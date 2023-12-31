import express from 'express';
import cors from 'cors';
import createMongooseConnection, { databaseUrl } from './database';
import AccountRoutes from './accounts/accounts.routes';
import PublicRoutes from './public/public.routes';
import ErrorHandler from '../error.handler';
import * as Sentry from '@sentry/node';
import AuthenticationRoutes from './authentication/authentication.routes';
import { omit } from 'lodash';
import EventsRoutes from './events/events.routes';
import { IAccount } from './models/accounts';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './utils';

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        // eslint-disable-next-line @typescript-eslint/no-empty-interface
        export interface User extends IAccount {}
    }
}

const isProduction = process.env.NODE_ENV === 'production';

try {
    const app = express();
    const port = process.env.PORT || 3003;

    // RequestHandler creates a separate execution context, so that all
    // transactions/spans/breadcrumbs are isolated across requests
    app.use(Sentry.Handlers.requestHandler());
    // TracingHandler creates a trace for every incoming request
    app.use(Sentry.Handlers.tracingHandler());

    const origin = isProduction
        ? 'https://family-trivia.onrender.com/' // This needs to be the ui that is calling the API.  Can be the onrender or custom domain
        : 'http://localhost:5000';
    // CORS
    app.use(
        cors({
            credentials: true,
            origin,
        }),
    );

    // JWT Authentication
    app.use((request, response, next) => {
        const authorizationHeader = request.headers['authorization'];
        const token = authorizationHeader?.split(' ')[1];
        try {
            if (token) {
                const user = jwt.verify(token, JWT_SECRET) as IAccount;
                if (user) {
                    request.user = user;
                }
            }
            next();
        } catch (error) {
            console.log({ message: 'Error verifying token' });
            return response.status(401).json({ message: 'Session expired' });
        }
    });


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
