import { pick } from 'lodash';
import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import Accounts from '../models/accounts';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../utils';
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

    app.post(`${path}/login`, async (request: Request, response: Response) => {
        const { email, password } = request.body;
        const user = await Accounts.findOne({
            email,
            active: true,
        });
        if (!user || !user?.password)
            return response
                .status(401)
                .json({ message: 'Invalid username or password' });
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return response
                .status(401)
                .json({ message: 'Invalid username or password' });
        }
        await Accounts.findOneAndUpdate(
            { _id: user._id },
            { lastLogin: new Date() },
        );
        const userResponse = pick(user, [
            'fullName',
            'phoneNumber',
            'email',
            'messageTypes',
            '_id',
            'pricingTier',
            'billingPeriod',
            'useSwearWords',
            'role',
        ]);
        const token = jwt.sign(userResponse, JWT_SECRET, {
            expiresIn: '24h',
        });
        return response.json({ token });
    });
};

export default AuthenticationRoutes;
