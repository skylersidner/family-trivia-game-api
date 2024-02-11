import { NextFunction, Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import Games, { GAMES_STATUS } from '../models/games';
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
            const game = await Games.findById(gameId).lean();
            // @ts-ignore
            if (request.user?._id.toString() !== game?.createdBy.toString()) {
                console.log('param gameId: ', gameId);
                // @ts-ignore
                console.log('session user id: ', request.user?._id);
                throw Error('You are not authorized to update this game');
            }
            const updatedEvent = await Games.findOneAndUpdate(
                { _id: gameId },
                { ...game, ...update, updatedBy: request.user?._id },
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
            const { user } = request;
            if (!user) {
                throw Error('User is not authorized to create an event');
            }
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
                match: { isDeleted: { $ne: true } },
                populate: {
                    path: 'answers',
                    populate: [{
                        path: 'selectedBy',
                        select: 'fullName',
                    },{
                        path: 'winners',
                        select: 'fullName',
                    }]
                },
            };
            const participantPopulate = {
                path: 'questions',
                match: { isDeleted: { $ne: true } },
                populate: {
                    path: 'answers',
                    select: '-isCorrect',
                    populate: [{
                        path: 'selectedBy',
                        select: 'fullName'
                    },{
                        path: 'winners',
                        select: 'fullName',
                    }],
                },
            };
            const { gameId } = request.params;
            const game = await Games.findById(gameId);
            await game?.populate(
                game?.createdBy?._id.toString() === user?._id.toString() ||
                    game?.status === GAMES_STATUS.FINISHED
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
            const { questions } = request.body;
            let game;
            for (const question of questions) {
                const { text, answersString } = question;
                let answers = question.answers;

                if (answersString) {
                    answers = JSON.parse(answersString); // support for Insomnia passing a JSON string for the data
                }

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
                    text,
                    answers: createdAnswers.map((answer) => answer._id),
                    type: question.type,
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
    updateQuestion: async ( // TODO: unsure if this works...
        request: Request,
        response: Response,
        next: NextFunction,
    ) => {
        try {
            const question = request.body;
            const { questionId } = request.params;

            // TODO: Removing restriction for now, but probably need another status for games that are "in progress"...
            // const game = await Games.findById(gameId);
            // if (game && game.status == GAMES_STATUS.FINISHED) {
            //     throw Error('Game is already finished');
            // }

            // TODO: validate question object

            console.log('question: ', question)
            const result = await Questions.updateOne(
                {
                    _id: questionId
                },
                question
            );
            console.log('updateQuestion result: ', result)
            const updatedQuestion = await Questions.findById(questionId);

            return response.json(updatedQuestion);
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
            const { answerIds } = request.body;
            const { gameId, questionId } = request.params;
            const game = await Games.findById(gameId);
            if (game && game.status == GAMES_STATUS.FINISHED) {
                throw Error('Game is already finished');
            }
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
            await Answers.updateMany(
                { _id: { $in: answerIds } },
                {
                    $addToSet: { selectedBy: user?._id },
                },
            );
            const updatedGame = await Games.findById(gameId)
                .populate({
                    path: 'questions',
                    match: { isDeleted: { $ne: true } },
                    populate: {
                        path: 'answers',
                        select: '-isCorrect',
                        populate: {
                            path: 'selectedBy',
                            select: 'fullName',
                        },
                    },
                })
                .lean();

            return response.json(updatedGame);
        } catch (e) {
            next(e);
            Sentry.captureMessage('Failed to find game');
        }
    },
    deleteQuestion: async (
        request: Request,
        response: Response,
        next: NextFunction,
    ) => {
        try {
            const user = request.user;
            const { gameId, questionId } = request.params;
            const game = await Games.findById(gameId);
            if (
                !user ||
                user?._id?.toString() !== game?.createdBy?.toString()
            ) {
                throw Error('User is not authorized to delete a question');
            }
            if (game && game.status == GAMES_STATUS.FINISHED) {
                throw Error('Game is already finished');
            }
            // first delete the answers

            const question = await Questions.findOneAndUpdate(
                { _id: questionId },
                { isDeleted: true },
                { new: true },
            );
            await Answers.updateMany(
                {
                    _id: { $in: question?.answers },
                },
                {
                    isDeleted: true,
                },
            );
            const updatedGame = await Games.findById(gameId)
                .populate({
                    path: 'questions',
                    match: { isDeleted: { $ne: true } },
                    populate: {
                        path: 'answers',
                        populate: {
                            path: 'selectedBy',
                            select: 'fullName',
                        },
                    },
                })
                .lean();

            return response.json(updatedGame);
        } catch (e) {
            next(e);
            Sentry.captureMessage('Failed to find game');
        }
    },
    updateAnswer: async (
        request: Request,
        response: Response,
        next: NextFunction,
    ) => {
        try {
            const answer = request.body;
            const { answerId } = request.params;

            // TODO: validate answer object
            const result = await Answers.updateOne(
                {
                    _id: answerId
                },
                answer
            );
            console.log('updateAnswer result: ', result)
            const updatedAnswer = await Answers.findById(answerId);

            return response.json(updatedAnswer);
        } catch (e) {
            next(e);
            Sentry.captureMessage('Failed to find game');
        }
    },
};

export default GamesController;
