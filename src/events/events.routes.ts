import ApiAuthentication from '../authentication/api.authentication';
import EventsController from './events.controller';

const eventsRoute = `/api/events`;

const EventsRoutes = (app: any) => {
    app.post(`${eventsRoute}/:gameId/update`, EventsController.update);
    app.post(`${eventsRoute}/create`, EventsController.create);
};

export default EventsRoutes;
