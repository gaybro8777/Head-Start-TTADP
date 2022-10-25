import { sequelize } from '../models';
import handleErrors from '../lib/apiErrorHandler';

const namespace = 'SERVICE:WRAPPER';

const logContext = {
  namespace,
};

export default function transactionWrapper(originalFunction) {
  return async function wrapper(req, res, next) {
    return sequelize.transaction(async () => {
      let result;
      try {
        result = await originalFunction(req, res, next);
      } catch (err) {
        await handleErrors(req, res, err, logContext);
        throw err;
      }
      return result;
    });
  };
}
