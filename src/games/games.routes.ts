import GamesController from './games.controller';
import ApiAuthentication from '../authentication/api.authentication';
const gamesPath = `/api/games`;

const GamesRoutes = (app: any) => {
    app.patch(`${gamesPath}/:gameId`, GamesController.update);
    app.post(`${gamesPath}/create`, GamesController.create);
    app.get(`${gamesPath}/:gameId`, GamesController.getGameById);
    app.post(
        `${gamesPath}/:gameId/questions`,
        ApiAuthentication.requiresAuthentication,
        GamesController.addQuestions,
    );
    app.post(
        `${gamesPath}/:gameId/question/:questionId/answer`,
        ApiAuthentication.requiresAuthentication,
        GamesController.answerQuestion,
    );
    app.patch(
        `${gamesPath}/:gameId/question/:questionId`,
        ApiAuthentication.requiresAuthentication,
        GamesController.updateQuestion,
    );
    app.patch(
        `${gamesPath}/:gameId/question/:questionId/answer/:answerId`,
        ApiAuthentication.requiresAuthentication,
        GamesController.updateAnswer,
    );
    app.delete(
        `${gamesPath}/:gameId/question/:questionId`,
        ApiAuthentication.requiresAuthentication,
        GamesController.deleteQuestion,
    );
};

export default GamesRoutes;
