import { Request, Response } from 'express';
const ErrorHandler = (
    error: Error,
    request: Request,
    response: Response,
    next: any,
) => {
    console.log(error);
    response.status(500).json({
        message: error.message,
        stack: error.stack,
    });
};

export default ErrorHandler;
