import { Schema, model, ObjectId, PopulatedDoc } from 'mongoose';
import IAudit from './interfaces/audit.interfaces';
import { IAnswer } from './answers';

export interface IQuestion extends IAudit {
    _id: ObjectId;
    text: string;
    answers: PopulatedDoc<IAnswer>;
}

const questionSchema = new Schema<IQuestion>(
    {
        text: { type: String, required: true },
        answers: [{ type: Schema.Types.ObjectId, ref: 'Answer' }],
        createdBy: { type: Schema.Types.ObjectId, ref: 'Account' },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'Account' },
    },
    { timestamps: true },
);

export default model('Question', questionSchema);
