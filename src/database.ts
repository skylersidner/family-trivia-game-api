import { connect } from 'mongoose';
// import mongoose from "mongoose";
// mongoose.set('debug', true)
const baseDatabaseUrl = 'mongodb://localhost:27022';
const databaseUrl = process.env.MONGO_URL || `${baseDatabaseUrl}/trivia`;
const createMongooseConnection = async () => {
    await connect(databaseUrl);
    // Importing models here to ensure that the schemas are registered with mongoose
    import('./models/answers');
    import('./models/accounts');
    import('./models/games');
    import('./models/questions');
};

export default createMongooseConnection;
export { databaseUrl };
