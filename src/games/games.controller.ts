import { NextFunction, Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import Games from '../models/games';
import Questions from '../models/questions';
import Answers, { IAnswer } from '../models/answers';

const GamesController = {
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
            const updatedEvent = await Games.findOneAndUpdate(
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
            const createdEvent = await Games.create({
                ...newEvent,
                createdBy: request.user?._id,
            });
            await createdEvent.populate('createdBy');

            return response.json(createdEvent);
        } catch (e) {
            next(e);
            Sentry.captureMessage('Failed to create event update');
        }
    },
    getGameById: async (
        request: Request,
        response: Response,
        next: NextFunction,
    ) => {
        // Later we can check to see if the game is private and if the user is authorized to view it
        try {
            const { gameId } = request.params;
            const game = await Games.findById(gameId).populate({
                path: 'questions',
                populate: {
                    path: 'answers',
                    select: '-isCorrect',
                },
            });

            return response.json(game);
        } catch (e) {
            next(e);
            Sentry.captureMessage('Failed to find game');
        }
    },
    addQuestion: async (
        request: Request,
        response: Response,
        next: NextFunction,
    ) => {
        const user = request.user;
        try {
            const { gameId } = request.params;
            const { questionText, answers } = request.body;
            const answersToCreate = answers.map((answer: IAnswer) => ({
                text: answer.text,
                isCorrect: answer.isCorrect,
                createdBy: user?._id,
                updatedBy: user?._id,
            }));
            const createdAnswers = await Answers.insertMany(answersToCreate);
            const question = await Questions.create({
                text: questionText,
                answers: createdAnswers.map((answer) => answer._id),
            });
            const game = await Games.findOneAndUpdate(
                {
                    _id: gameId,
                },
                {
                    $push: {
                        questions: question._id,
                    },
                },
                { new: true },
            );

            return response.json(game);
        } catch (e) {
            next(e);
            Sentry.captureMessage('Failed to find game');
        }
    },
    answerQuestion: async (
        request: Request,
        response: Response,
        next: NextFunction,
    ) => {
        try {
            const user = request.user;
            const { answerId } = request.body;
            const answer = await Answers.findOneAndUpdate(
                { _id: answerId },
                {
                    $addToSet: { selectedBy: user?._id },
                },
            );

            return response.json({});
        } catch (e) {
            next(e);
            Sentry.captureMessage('Failed to find game');
        }
    },
};

export default GamesController;
