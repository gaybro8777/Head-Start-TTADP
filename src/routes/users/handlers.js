import UserPolicy from '../../policies/user';
import SCOPES from '../../middleware/scopeConstants';
import { userById, usersWithPermissions } from '../../services/users';
import handleErrors from '../../lib/apiErrorHandler';
import { DECIMAL_BASE } from '../../constants';
import { statesByGrantRegion } from '../../services/grant';
import { createAndStoreVerificationToken, validateVerificationToken } from '../../services/token';
import { sendEmailVerificationRequestWithToken } from '../../lib/mailer';

export async function getPossibleCollaborators(req, res) {
  try {
    const user = await userById(req.session.userId);
    const { region } = req.query;
    const authorization = new UserPolicy(user);
    if (!authorization.canViewUsersInRegion(parseInt(region, DECIMAL_BASE))) {
      res.sendStatus(403);
      return;
    }

    const users = await usersWithPermissions([region], SCOPES.READ_WRITE_REPORTS);
    res.json(users);
  } catch (error) {
    await handleErrors(req, res, error, { namespace: 'SERVICE:USER' });
  }
}

export async function getPossibleStateCodes(req, res) {
  try {
    const user = await userById(req.session.userId);
    const regions = user.permissions.map((permission) => permission.regionId);
    const stateCodes = await statesByGrantRegion(regions);
    res.json(stateCodes);
  } catch (error) {
    await handleErrors(req, res, error, { namespace: 'SERVICE:USER' });
  }
}

export async function requestVerificationEmail(req, res) {
  try {
    const user = await userById(req.session.userId);
    const token = await createAndStoreVerificationToken(req.session.userId, 'email');

    await sendEmailVerificationRequestWithToken(user, token);
    res.sendStatus(200);
  } catch (error) {
    await handleErrors(req, res, error, { namespace: 'SERVICE:USER' });
  }
}

export async function verifyEmailToken(req, res) {
  const { token } = req.params;

  if (!token || !req.session.userId) {
    res.sendStatus(400);
    return;
  }

  try {
    const validated = await validateVerificationToken(req.session.userId, token, 'email');
    if (!validated) {
      res.sendStatus(403);
      return;
    }
    res.sendStatus(200);
  } catch (error) {
    await handleErrors(req, res, error, { namespace: 'SERVICE:USER' });
  }
}
