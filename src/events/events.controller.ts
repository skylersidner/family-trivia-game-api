import { NextFunction, Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import Events from '../models/events';

const EventsController = {
    update: async (
        request: Request,
        response: Response,
        next: NextFunction,
    ) => {
        try {
            const { gameId } = request.params;
            const update = request.body;
            // @ts-ignore
            if (request.user?._id.toString() !== accountId) {
                console.log('param gameId: ', gameId);
                // @ts-ignore
                console.log('session user id: ', request.user?._id);
                throw Error('You are not authorized to update this account');
            }
            const updatedEvent = await Events.findOneAndUpdate(
                { gameId },
                { ...update, updatedBy: request.user?._id },
                { new: true },
            );

            return response.json(updatedEvent);
        } catch (e) {
            next(e);
            Sentry.captureMessage('Failed to create event update');
        }
    },
    create: async (
        request: Request,
        response: Response,
        next: NextFunction,
    ) => {
        try {
            const newEvent = request.body;
            // @ts-ignore
            if (!request.user?._id) {
                Sentry.captureMessage(
                    'User is not authorized to create an event',
                );
            }
            const createdEvent = await Events.create({
                ...newEvent,
                createdBy: request.user?._id,
            });

            return response.json(createdEvent);
        } catch (e) {
            next(e);
            Sentry.captureMessage('Failed to create event update');
        }
    },
};

export default EventsController;
