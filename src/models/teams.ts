import { Schema, model, ObjectId } from 'mongoose';
import Accounts, {IAccount} from "./accounts";

interface IPlayer {
    _id: ObjectId;
    name: string;
    number: number;
}

interface ITeam {
    _id: ObjectId;
    name: string;
    players: [IPlayer];
    createdBy: IAccount;
}

const teamSchema = new Schema<ITeam>(
    {
        name: { type: String },
        players: [{
            name: { type: String },
            number: { type: Number },
        }],
        createdBy: {type: Accounts}
    }
)

export default model('Team', teamSchema)

export { ITeam }