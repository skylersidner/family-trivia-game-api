import GamesController from './games.controller';
import ApiAuthentication from '../authentication/api.authentication';
const gamesRoutes = `/api/games`;

const GamesRoutes = (app: any) => {
    app.post(`${gamesRoutes}/:gameId/update`, GamesController.update);
    app.post(`${gamesRoutes}/create`, GamesController.create);
    app.get(`${gamesRoutes}/:gameId`, GamesController.getGameById);
    app.post(
        `${gamesRoutes}/:gameId/question`,
        ApiAuthentication.requiresAuthentication,
        GamesController.addQuestion,
    );
};

export default GamesRoutes;
