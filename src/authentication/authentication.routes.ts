import passport from 'passport';
import { pick } from 'lodash';
import { NextFunction, Request, Response } from 'express';
const path = '/api/auth';
const AuthenticationRoutes = (app: any) => {
    app.get(
        `${path}/logout`,
        (request: Request, response: Response, next: NextFunction) => {
            request.logout((err: unknown) => {
                if (err) {
                    return next(err);
                }
                return response.json({ message: 'Logged out' });
            });
        },
    );

    app.post(
        `${path}/login`,
        (request: Request, response: Response, next: NextFunction) => {
            const strategy = passport.authenticate(
                'local',
                // @ts-ignore
                function (err, user) {
                    // This is the function called when passport.user local strategy is called "done" is called
                    if (err) {
                        return next(err);
                    }
                    if (!user) {
                        return response
                            .status(401)
                            .json({ message: 'Invalid username or password' });
                    }

                    // NEED TO CALL req.login()!!!
                    request.login(user, next);
                },
            );
            strategy(request, response, next);
        },
        // @ts-ignore
        (request, response) => {
            const user = pick(request.user, [
                'fullName',
                'phoneNumber',
                'email',
                'status',
                'messageTypes',
                '_id',
            ]);
            response.json(user);
        },
    );
};

export default AuthenticationRoutes;
