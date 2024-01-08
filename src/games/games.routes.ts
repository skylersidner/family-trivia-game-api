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
        `${gamesPath}}/:gameId/question/:questionId/answer`,
        ApiAuthentication.requiresAuthentication,
        GamesController.answerQuestion,
    );
};

export default GamesRoutes;
