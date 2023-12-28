import ApiAuthentication from '../authentication/api.authentication';
import AccountsController from './accounts.controller';

const accountPath = `/api/accounts`;

const AccountRoutes = (app: any) => {
    app.post(`${accountPath}/create`, AccountsController.create);
    app.post(
        `${accountPath}/refill`,
        ApiAuthentication.verifyKey,
        AccountsController.refill,
    );
    app.get(`${accountPath}/remainingSpots`, AccountsController.remainingSpots);
    app.post(`${accountPath}/update/:accountId`, AccountsController.update);
};

export default AccountRoutes;
