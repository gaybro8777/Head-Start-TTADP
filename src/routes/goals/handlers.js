import { updateGoalStatusById, createOrUpdateGoals, destroyGoal } from '../../services/goals';
import handleErrors from '../../lib/apiErrorHandler';
import Goal from '../../policies/goals';
import { userById } from '../../services/users';

const namespace = 'SERVICE:GOALS';

const logContext = {
  namespace,
};

export async function createGoals(req, res) {
  try {
    const { goals } = req.body;

    // check permissions
    const user = await userById(req.session.userId);

    let canCreate = true;

    goals.forEach((goal) => {
      if (canCreate && !new Goal(user, goal).canCreate()) {
        canCreate = false;
      }
    });

    if (!canCreate) {
      res.sendStatus(401);
      return;
    }

    const newGoals = await createOrUpdateGoals(goals);

    res.json(newGoals);
  } catch (error) {
    await handleErrors(req, res, error, logContext);
  }
}

export async function changeGoalStatus(req, res) {
  try {
    const { goalId } = req.params;
    const { newStatus } = req.body;
    // TODO: Who has permission to perform this operation.
    const updatedGoal = await updateGoalStatusById(goalId, newStatus);

    if (!updatedGoal) {
      res.sendStatus(404);
      return;
    }

    res.json(updatedGoal);
  } catch (error) {
    await handleErrors(req, res, error, logContext);
  }
}

export async function deleteGoal(req, res) {
  try {
    const { goalId } = req.params;
    const { regionId } = req.body;

    const user = await userById(req.session.userId);

    const policy = new Goal(user, {
      id: goalId,
      regionId,
    });

    if (!policy.canDelete()) {
      res.sendStatus(401);
      return;
    }

    const deletedGoal = await destroyGoal(goalId);

    // destroy goal returns a promise with the number of deleted goals
    // it should be 1 or 0
    // if 0, the goal wasn't deleted, presumably because it wasn't found

    if (!deletedGoal) {
      res.sendStatus(404);
      return;
    }

    res.json(deletedGoal);
  } catch (error) {
    await handleErrors(req, res, error, logContext);
  }
}
