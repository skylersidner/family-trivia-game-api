import { Schema, model, ObjectId, PopulatedDoc } from 'mongoose';
import IAudit from './interfaces/audit.interfaces';
import { IQuestion } from './questions';

export const GAMES_STATUS = {
    CREATED: 'CREATED',
    STARTED: 'STARTED',
    FINISHED: 'FINISHED',
};

export interface IGame extends IAudit {
    _id: ObjectId;
    status: string;
    title: string;
    startDate?: Date;
    questions?: PopulatedDoc<IQuestion>;
    currentPlayerCount: number;
}

const gameSchema = new Schema<IGame>(
    {
        status: {
            type: String,
            enum: Object.values(GAMES_STATUS),
            default: GAMES_STATUS.CREATED,
        },
        title: { type: String },
        startDate: { type: Date, required: false, default: Date.now() },
        createdBy: { type: Schema.Types.ObjectId, ref: 'Account' },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'Account' },
        questions: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
        currentPlayerCount: { type: Number, default: 0 },
    },
    { timestamps: true },
);

export default model('Game', gameSchema);
