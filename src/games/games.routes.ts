import GamesController from './games.controller';

const eventsRoute = `/api/games`;

const GamesRoutes = (app: any) => {
    app.post(`${eventsRoute}/:gameId/update`, GamesController.update);
    app.post(`${eventsRoute}/create`, GamesController.create);
};

export default GamesRoutes;
