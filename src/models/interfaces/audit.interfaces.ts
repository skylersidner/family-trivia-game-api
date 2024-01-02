import { PopulatedDoc } from 'mongoose';
import { IAccount } from '../accounts';

interface IAudit {
    createdAt: Date;
    updatedAt: Date;
    updatedBy: PopulatedDoc<IAccount>;
    createdBy: PopulatedDoc<IAccount>;
}

export default IAudit;