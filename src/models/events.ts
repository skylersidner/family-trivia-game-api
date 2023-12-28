import { Schema, model, ObjectId, Types, PopulatedDoc } from 'mongoose';
import Accounts, { IAccount } from './accounts';

interface IEventUpdate {
    _id: ObjectId;
    player: string;
    action: string;
    gameTime: string;
}

interface IEvent {
    _id: ObjectId;
    status: string;
    title: string;
    start?: Date;
    updates: IEventUpdate[];
    createdBy: PopulatedDoc<IAccount>;
}

const eventSchema = new Schema<IEvent>(
    {
        status: { type: String },
        title: { type: String },
        start: { type: Date, required: false, default: Date.now() },
        updates: [
            {
                player: { type: String },
                action: { type: String },
                gameTime: { type: String },
            },
        ],
        createdBy: { type: Schema.Types.ObjectId, ref: 'Account' },
    },
    { timestamps: true },
);

export default model('Event', eventSchema);

export { IEvent };
