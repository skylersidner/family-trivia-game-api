import { Schema, model, ObjectId, PopulatedDoc } from 'mongoose';
import IAudit from './interfaces/audit.interfaces';
import { IAccount } from './accounts';

export interface IAnswer extends IAudit {
    _id: ObjectId;
    text: string;
    selectedBy: PopulatedDoc<IAccount>[];
    isCorrect: boolean;
    points: number;
    winners: PopulatedDoc<IAccount>[];
    isDeleted: boolean;
}

const answerSchema = new Schema<IAnswer>(
    {
        text: { type: String, required: true },
        isCorrect: { type: Boolean, default: false, required: false },
        points: { type: Number, default: 1, required: true },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'Account',
            required: true,
        },
        updatedBy: {
            type: Schema.Types.ObjectId,
            ref: 'Account',
            required: true,
        },
        selectedBy: {
            type: [Schema.Types.ObjectId],
            ref: 'Account',
            default: [],
        },
        winners: {
            type: [Schema.Types.ObjectId],
            ref: 'Account',
            default: [],
        },
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true },
);

export default model('Answer', answerSchema);
