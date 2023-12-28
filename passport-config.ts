import LocalStrategy from 'passport-local';
import bcrypt from 'bcrypt';
import { PassportStatic } from 'passport';
import Accounts from './src/models/accounts';

function initialize(passport: PassportStatic) {
    passport.use(
        // @ts-ignore
        new LocalStrategy(
            { usernameField: 'email' },
            async (email: string, password: string, done: any) => {
                const user = await Accounts.findOne({
                    email,
                    active: true,
                });
                if (!user || !user?.password) return done(null, false);
                console.log('found user', user._id.toString());
                bcrypt.compare(
                    password,
                    user.password,
                    (bcryptError, result) => {
                        if (bcryptError) throw bcryptError;
                        if (result) {
                            Accounts.findOneAndUpdate(
                                {
                                    email,
                                    active: true,
                                },
                                {
                                    lastLogin: new Date(),
                                },
                            ).exec();
                            return done(null, user);
                        }
                        return done(null, false);
                    },
                );

                return undefined;
            },
        ),
    );

    passport.serializeUser((user: any, done: any) => {
        // @ts-ignore
        done(null, user._id);
    });

    passport.deserializeUser(async (id: string, done: any) => {
        let user;
        let error;
        try {
            user = await Accounts.findOne({ _id: id });
        } catch (err) {
            error = err;
        }
        done(error, user);
    });
}

export default initialize;
