import { Schema, model, ObjectId } from 'mongoose';

interface ISms {
    remainingCount: number;
}

interface IAccount {
    _id: ObjectId;
    apiKey: ObjectId;
    active: boolean;
    email: string;
    phoneNumber: string;
    fullName?: string;
    createdAt: Date;
    updatedAt: Date;
    sms: ISms;
    password: string;
    lastLogin?: Date;
}

const accountSchema = new Schema<IAccount>(
    {
        apiKey: { type: Schema.Types.ObjectId, ref: 'ApiKey' },
        active: { type: Boolean, default: true },
        email: { type: String },
        phoneNumber: { type: String },
        fullName: { type: String, required: false },
        sms: {
            remainingCount: { type: Number, default: 0 },
        },
        password: {
            type: String,
            required: true,
        },
        lastLogin: { type: Date, required: false },
    },
    { timestamps: true },
);

export default model('Account', accountSchema);

export { IAccount, ISms };
