import { NextFunction, Request, Response } from 'express';
import ApiKey, { IApiKey } from '../models/api.keys';

export const headerKey = 'x-api-key';
const ApiAuthentication = {
    verifyKey: async function verifyKey(
        request: Request,
        response: Response,
        next: NextFunction,
    ) {
        const apiKeyHeader = request.headers[headerKey];
        const key: IApiKey | null = await ApiKey.findOne({
            key: apiKeyHeader,
        });
        if (key?.active) {
            return next();
        }
        return response.status(401).json({});
    },
};

export default ApiAuthentication;
