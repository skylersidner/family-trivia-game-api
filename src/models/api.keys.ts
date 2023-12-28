import { Schema, model, ObjectId } from 'mongoose';

enum ApiKeyTypes {
    BASIC = 'BASIC',
    PROFESSIONAL = 'PROFESSIONAL',
    ENTERPRISE = 'ENTERPRISE',
    ADMIN = 'ADMIN',
}

interface IApiKey {
    _id: ObjectId;
    apiKey: string;
    // platform: string;
    active: boolean;
    subscriberEmail: string;
    type: ApiKeyTypes;
    createdAt: Date;
    updatedAt: Date;
}

const apiKeySchema = new Schema<IApiKey>(
    {
        apiKey: { type: String, required: true },
        active: { type: Boolean, default: true },
        subscriberEmail: { type: String },
        type: {
            type: String,
            default: ApiKeyTypes.BASIC,
            enum: Object.values(ApiKeyTypes),
        },
    },
    { timestamps: true },
);

export default model('ApiKey', apiKeySchema);

export { IApiKey, ApiKeyTypes };
