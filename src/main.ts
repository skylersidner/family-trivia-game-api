import express from 'express';
import cors from 'cors';
import passport from 'passport';
import session, { SessionOptions } from 'express-session';
import MongoStore from 'connect-mongo';
import createMongooseConnection, { databaseUrl } from './database';
import initializePassport from '../passport-config';
import AccountRoutes from './accounts/accounts.routes';
import PublicRoutes from './public/public.routes';
import ErrorHandler from '../error.handler';
import * as Sentry from '@sentry/node';
import AuthenticationRoutes from './authentication/authentication.routes';
import { omit } from 'lodash';
import EventsRoutes from './events/events.routes';
import { IAccount } from './models/accounts';
import { Server } from 'socket.io';

declare global {
    namespace Express {
        export interface User extends IAccount {}
    }
}

const isProduction = process.env.NODE_ENV === 'production';

try {
    const app = express();
    const port = process.env.PORT || 3003;

    // Need to create a different sentry app
    // Sentry.init({
    //     dsn: 'https://922c7d37b38344f99ac77ed174bcbbd8@o4505218028994560.ingest.sentry.io/4505218032992256',
    //     integrations: [
    //         // enable HTTP calls tracing
    //         new Sentry.Integrations.Http({ tracing: true }),
    //         // enable Express.js middleware tracing
    //         new Sentry.Integrations.Express({ app }),
    //         // Automatically instrument Node.js libraries and frameworks
    //         ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
    //     ],
    //
    //     // Set tracesSampleRate to 1.0 to capture 100%
    //     // of transactions for performance monitoring.
    //     // We recommend adjusting this value in production
    //     tracesSampleRate: 1.0,
    // });

    // Set up session

    const sessionConfig: SessionOptions = {
        secret: 'back-to-the-future-4',
        resave: true,
        proxy: true,
        saveUninitialized: false,
        // @ts-ignore
        store: MongoStore.create({ mongoUrl: databaseUrl }),
        cookie: {
            secure: isProduction,
            maxAge: 1000 * 60 * 60 * 24 * 7,
            sameSite: 'none',
        },
    };
    if (!isProduction) {
        delete sessionConfig.cookie; // serve secure cookies
    }
    app.use(session(sessionConfig));

    // Set up passport
    app.use(passport.initialize());
    app.use(passport.session());
    initializePassport(passport);

    // RequestHandler creates a separate execution context, so that all
    // transactions/spans/breadcrumbs are isolated across requests
    app.use(Sentry.Handlers.requestHandler());
    // TracingHandler creates a trace for every incoming request
    app.use(Sentry.Handlers.tracingHandler());

    const origin = isProduction
        ? 'https://emerald-ui.onrender.com'
        : 'http://localhost:5000';
    // CORS
    app.use(
        cors({
            credentials: true,
            origin,
        }),
    );
    app.use(express.json());
    app.use((req, res, next) => {
        console.log('Request made to: ', req.url);
        console.log('Request body: ', omit(req.body, ['password']));
        next();
    });

    PublicRoutes(app);
    EventsRoutes(app);
    AuthenticationRoutes(app);
    AccountRoutes(app);
    // The error handler must be before any other error middleware and after all controllers
    app.use(Sentry.Handlers.errorHandler());

    //Error Handler Must Be Last In Middleware
    app.use(ErrorHandler);

    const server = app.listen(process.env.PORT || port, async () => {
        try {
            console.log('Connecting to mongodb');
            await createMongooseConnection();
            console.log('Connected to mongodb');
            // initializeCronJobs();
            console.log(`Application listening on port ${port}.`);
        } catch (error) {
            console.log('Error connecting to mongodb');
            console.log(error);
        }
    });
    const io = new Server(server, {
        cors: {
            origin: '*',
        },
    });
    io.on('connection', (socket) => {
        console.log('a user connected');
        socket.on('disconnect', () => {
            console.log('user disconnected');
        });
    });
} catch (error) {
    console.log('Error starting application');
    console.log(error);
}
