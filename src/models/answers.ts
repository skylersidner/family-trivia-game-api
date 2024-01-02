import { Schema, model, ObjectId, PopulatedDoc } from 'mongoose';
import IAudit from './interfaces/audit.interfaces';
import { IAccount } from './accounts';


export interface IAnswer extends IAudit{
    _id: ObjectId;
    text: string;
    selectedBy: PopulatedDoc<IAccount>;
}

const answerSchema = new Schema<IAnswer>(
    {
        text: { type: String },
        createdBy: { type: Schema.Types.ObjectId, ref: 'Account' },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'Account' },
        selectedBy: { type: Schema.Types.ObjectId, ref: 'Account' },
    },
    { timestamps: true },
);

export default model('Answer', answerSchema);
