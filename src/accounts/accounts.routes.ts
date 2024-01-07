import ApiAuthentication from '../authentication/api.authentication';
import AccountsController from './accounts.controller';

const accountsPath = `/api/accounts`;

const AccountRoutes = (app: any) => {
    app.post(`${accountsPath}/create`, AccountsController.create);
    app.post(
        `${accountsPath}/refill`,
        ApiAuthentication.verifyKey,
        AccountsController.refill,
    );
    app.get(`${accountsPath}/remainingSpots`, AccountsController.remainingSpots);
    app.get(`${accountsPath}/me`, AccountsController.me);
    app.get(`${accountsPath}/:accountId/games`, AccountsController.getAllGamesByAccountId)
    app.patch(`${accountsPath}/:accountId`, AccountsController.update);
};

export default AccountRoutes;
