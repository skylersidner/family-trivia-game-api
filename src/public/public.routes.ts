import Games from '../models/games';
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
        const games = await Games.find({})
            .populate({
                path: 'createdBy',
                select: 'fullName email',
            })
            .populate({
                path: 'questions',
                match: { isDeleted: { $ne: true } },
            });

        response.json(games);
    });
};

export default PublicRoutes;
