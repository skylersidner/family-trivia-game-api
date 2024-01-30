import { Schema, model, ObjectId, PopulatedDoc } from 'mongoose';
import IAudit from './interfaces/audit.interfaces';
import { IAnswer } from './answers';

enum ANSWER_TYPE {
    SELECT_ONE = 'SELECT_ONE',
    SELECT_MANY = 'SELECT_MANY',
    FREE_FORM = 'FREE_FORM',
}
export interface IQuestion extends IAudit {
    _id: ObjectId;
    text: string;
    answers: PopulatedDoc<IAnswer>;
    type: ANSWER_TYPE;
    isDeleted: boolean;
}

const questionSchema = new Schema<IQuestion>(
    {
        text: { type: String, required: true },
        answers: [{ type: Schema.Types.ObjectId, ref: 'Answer' }],
        createdBy: { type: Schema.Types.ObjectId, ref: 'Account' },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'Account' },
        type: {
            type: String,
            enum: ANSWER_TYPE,
            required: true,
            default: ANSWER_TYPE.SELECT_ONE,
        },
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true },
);

export default model('Question', questionSchema);
