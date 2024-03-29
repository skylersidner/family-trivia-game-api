import { NextFunction, Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import Accounts from '../models/accounts';
import { headerKey } from '../authentication/api.authentication';
import ApiKeys from '../models/api.keys';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';
import { omit, pick } from 'lodash';
import Games from '../models/games';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../utils';

const MAX_ACCOUNTS = 50;

const AccountsController = {
    update: async (
        request: Request,
        response: Response,
        next: NextFunction,
    ) => {
        try {
            const { accountId } = request.params;
            // @ts-ignore
            if (request.user?._id.toString() !== accountId) {
                console.log('param accountId: ', accountId);
                // @ts-ignore
                console.log('session user id: ', request.user?._id);
                throw Error('You are not authorized to update this account');
            }
            const updates = request.body;
            if (!accountId || accountId === 'undefined') {
                throw Error('Missing account id');
            }
            if (updates.password) {
                const hashedPassword = await bcrypt.hash(updates.password, 10);
                updates.password = hashedPassword;
            } else {
                delete updates.password;
            }
            const previousAccount = await Accounts.findOne({
                _id: new ObjectId(accountId),
            });
            console.log(
                'previous account: ' + accountId,
                omit(previousAccount?.toJSON(), ['password', 'apiKey']),
            );
            const account = await Accounts.findOneAndUpdate(
                { _id: new ObjectId(accountId) },
                { ...previousAccount?.toJSON(), ...updates },
                { new: true },
            );
            console.log(
                'updated account: ' + accountId,
                omit(account?.toJSON(), ['password', 'apiKey']),
            );
            const cleanedUser = omit(account?.toJSON(), ['password', 'apiKey']);
            return response.json(cleanedUser);
        } catch (e) {
            next(e);
        }
    },
    remainingSpots: async (
        request: any,
        response: Response,
        next: NextFunction,
    ) => {
        console.log('Call to determine remaining spots was made');
        const totalActiveAccounts = await Accounts.find({
            active: true,
        }).count();
        const remaining = MAX_ACCOUNTS - totalActiveAccounts;
        return response.json({ remaining });
    },
    refill: async (request: any, response: Response, next: NextFunction) => {
        const apiKeyHeader = request.headers[headerKey];
        const apiKey = await ApiKeys.findOne({
            apiKey: apiKeyHeader,
        });
        const account = await Accounts.findOneAndUpdate(
            { apiKey: apiKey?._id },
            {
                $inc: { 'sms.remainingCount': 100 },
            },
            { new: true },
        );
        return response.json(account);
    },
    create: async (request: any, response: any, next: any) => {
        try {
            const { phoneNumber, fullName, email, password } = request.body;
            console.log(
                `Creating account for: ${JSON.stringify({
                    phoneNumber,
                    fullName,
                    email,
                })}`,
            );
            if (!fullName || !email || !password) {
                throw Error('Missing required information');
            }
            const existingAccount = await Accounts.findOne({
                $or: [{ email }],
            });
            if (existingAccount) {
                throw Error(
                    'An account with that phone number or email already exists',
                );
            }
            const apiKey = await ApiKeys.create({
                apiKey: new ObjectId(),
            });
            const hashedPassword = await bcrypt.hash(request.body.password, 10);
            const account = await Accounts.create({
                email,
                apiKey: apiKey,
                fullName,
                password: hashedPassword,
            });
            const userResponse = pick(account, ['fullName', 'email', '_id']);
            const token = jwt.sign(userResponse, JWT_SECRET, {
                expiresIn: '4h',
            });
            return response.json({ token });
        } catch (e) {
            next(e);
            Sentry.captureMessage('Failed to create account');
        }
    },
    me: async (request: Request, response: Response, next: NextFunction) => {
        try {
            return response.json(request.user);
        } catch (e) {
            next(e);
            Sentry.captureMessage(`Failed to return user`);
        }
    },
    getAllGamesByAccountId: async (
        request: Request,
        response: Response,
        next: NextFunction,
    ) => {
        const { accountId } = request.params;
        try {
            const result = await Games.find({ createdBy: accountId }).exec();
            return response.json(result || []);
        } catch (e) {
            next(e);
            Sentry.captureMessage(
                `Failed to fetch games for accountId: ${accountId}`,
            );
        }
    },
};

export default AccountsController;
