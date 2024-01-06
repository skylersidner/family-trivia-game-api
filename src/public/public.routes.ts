import Events from '../models/game';
const publicPath = `/public`;

const PublicRoutes = (app: any) => {
    app.get(`${publicPath}/hello`, async (request: any, response: any) => {
        console.log(`${publicPath}/hello was called`);
        response.send('Hey there good lookin!');
    });
    app.get(`${publicPath}/debug-sentry`, function mainHandler(request: any) {
        const { key } = request.query;
        if (key && key === 'TestingSentryErrors') {
            throw new Error('Sentry Error Debug');
        }
    });
    app.get(`${publicPath}/games`, async (request: any, response: any) => {
        console.log(`${publicPath}/games was called`);
        const events = await Events.find({}).populate(
            'createdBy',
            'fullName email',
        );
        response.json(events);
    });
};

export default PublicRoutes;
