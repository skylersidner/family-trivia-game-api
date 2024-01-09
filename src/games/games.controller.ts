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
        const user = request.user;
        try {
            const creatorPopulate = {
                path: 'questions',
                populate: {
                    path: 'answers',
                    populate: {
                        path: 'selectedBy',
                        select: 'fullName',
                    },
                },
            };
            const participantPopulate = {
                path: 'questions',
                populate: {
                    path: 'answers',
                    select: '-isCorrect',
                },
            };
            const { gameId } = request.params;
            const game = await Games.findById(gameId);
            await game?.populate(
                game?.createdBy?._id.toString() === user?._id.toString()
                    ? creatorPopulate
                    : participantPopulate,
            );

            return response.json(game);
        } catch (e) {
            next(e);
            Sentry.captureMessage('Failed to find game');
        }
    },
    addQuestions: async (
        request: Request,
        response: Response,
        next: NextFunction,
    ) => {
        const user = request.user;
        try {
            const { gameId } = request.params;
            const questions = request.body;
            let game;
            for (const question of questions) {
                const { questionText, answers } = question;

                const answersToCreate = answers.map((answer: IAnswer) => ({
                    text: answer.text,
                    isCorrect: answer.isCorrect,
                    createdBy: user?._id,
                    updatedBy: user?._id,
                    selectedBy: [],
                }));
                const createdAnswers = await Answers.insertMany(
                    answersToCreate,
                );
                const createdQuestion = await Questions.create({
                    text: questionText,
                    answers: createdAnswers.map((answer) => answer._id),
                });
                game = await Games.findOneAndUpdate(
                    {
                        _id: gameId,
                    },
                    {
                        $push: {
                            questions: createdQuestion._id,
                        },
                    },
                    { new: true },
                );
            }

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
            const { gameId, questionId } = request.params;
            //Oh geez, jamming it in now
            const question = await Questions.findById(questionId);
            await Answers.updateMany(
                {
                    _id: { $in: question?.answers },
                    selectedBy: user?._id,
                },
                {
                    $pull: {
                        selectedBy: user?._id,
                    },
                },
            );
            await Answers.findOneAndUpdate(
                { _id: answerId },
                {
                    $addToSet: { selectedBy: user?._id },
                },
            );
            const game = await Games.findById(gameId)
                .populate({
                    path: 'questions',
                    populate: {
                        path: 'answers',
                        select: '-isCorrect',
                    },
                })
                .lean();

            return response.json(game);
        } catch (e) {
            next(e);
            Sentry.captureMessage('Failed to find game');
        }
    },
};

export default GamesController;
