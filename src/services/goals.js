/* eslint-disable no-unused-vars */
import { Op } from 'sequelize';
import { auditLogger } from '../logger';
import {
  Goal,
  Grant,
  Objective,
  ActivityReportObjective,
  ObjectiveTopic,
  ObjectiveResource,
  GrantGoal,
  sequelize,
  ActivityReport,
} from '../models';

const namespace = 'SERVICE:GOALS';

const logContext = {
  namespace,
};

/**
 * Goals is an array of an object with the following keys
    id,
    grants,
    name,
    status,
    endDate,
    regionId,
    recipientId,

  The goal model has the following columns
    id,
    name,
    status,
    timeframe,
    isFromSmartsheetTtaPlan
    endDate,

 * @param {Object} goals
 * @returns created or updated goal with grant goals
 */
export async function createOrUpdateGoals(goals) {
  return sequelize.transaction(async (transaction) => Promise.all(goals.map(async (goalData) => {
    const {
      id, grants, recipientId, regionId,
      ...fields
    } = goalData;

    const options = {
      ...fields,
      isFromSmartsheetTtaPlan: false,
      id: id === 'new' ? null : id,
    };

    const [goal] = await Goal.upsert(options, { transaction });

    await Promise.all(
      grants.map((grant) => GrantGoal.findOrCreate({
        where: {
          goalId: goal.id,
          recipientId,
          grantId: grant.value,
        },
        transaction,
      })),
    );

    // we want to return the data in roughly the form it was provided
    return {
      ...goal.dataValues,
      grants,
      recipientId,
      regionId,
    };
  })));
}

export async function goalsForGrants(grantIds) {
  /**
   * get all the matching grants
   */
  const grants = await Grant.findAll({
    attributes: ['id', 'oldGrantId'],
    where: {
      id: grantIds,
    },
  });

  /**
   * we need one big array that includes the old recipient id as well,
   * removing all the nulls along the way
   */
  const ids = grants
    .reduce((previous, current) => [...previous, current.id, current.oldGrantId], [])
    .filter((g) => g != null);

  /*
  * finally, return all matching goals
  */

  return Goal.findAll({
    where: {
      [Op.or]: [
        {
          status: 'Not Started',
        },
        {
          status: 'In Progress',
        },
        {
          status: null,
        },
      ],
    },
    include: [
      {
        model: Grant,
        as: 'grants',
        attributes: ['id'],
        where: {
          id: ids,
        },
      },
    ],
    order: ['createdAt'],
  });
}

async function removeActivityReportObjectivesFromReport(reportId, transaction) {
  return ActivityReportObjective.destroy({
    where: {
      activityReportId: reportId,
    },
    transaction,
  });
}

export async function removeGoals(goalsToRemove, transaction) {
  const goalsWithGrants = await Goal.findAll({
    attributes: ['id'],
    where: {
      id: goalsToRemove,
    },
    include: {
      attributes: ['id'],
      model: Grant,
      as: 'grants',
      required: true,
    },
    transaction,
  });

  const goalIdsToKeep = goalsWithGrants.map((g) => g.id);
  const goalsWithoutGrants = goalsToRemove.filter((id) => !goalIdsToKeep.includes(id));

  return Goal.destroy({
    where: {
      id: goalsWithoutGrants,
    },
    transaction,
  });
}

async function removeObjectives(currentObjectiveIds, transaction) {
  return Objective.destroy({
    where: {
      id: currentObjectiveIds,
    },
    transaction,
  });
}

async function removeUnusedObjectivesGoalsFromReport(reportId, currentGoals, transaction) {
  const previousObjectives = await ActivityReportObjective.findAll({
    where: {
      activityReportId: reportId,
    },
    include: {
      model: Objective,
      as: 'objective',
    },
  });

  const currentGoalIds = currentGoals.map((g) => g.id);
  const currentObjectiveIds = currentGoals.map((g) => g.objectives.map((o) => o.id)).flat();

  const previousGoalIds = previousObjectives.map((ro) => ro.objective.goalId);
  const previousObjectiveIds = previousObjectives.map((ro) => ro.objectiveId);

  const goalIdsToRemove = previousGoalIds.filter((id) => !currentGoalIds.includes(id));
  const objectiveIdsToRemove = [];
  await Promise.all(
    previousObjectiveIds.map(async (id) => {
      const notCurrent = !currentObjectiveIds.includes(id);
      const activityReportObjectives = await ActivityReportObjective
        .findAll({ where: { objectiveId: id } });
      const lastInstance = activityReportObjectives.length <= 1;
      if (notCurrent && lastInstance) {
        objectiveIdsToRemove.push(id);
      }
    }),
  );

  await removeActivityReportObjectivesFromReport(reportId, transaction);
  await removeObjectives(objectiveIdsToRemove, transaction);
  await removeGoals(goalIdsToRemove, transaction);
}

export async function saveGoalsForReport(goals, report, transaction) {
  await removeUnusedObjectivesGoalsFromReport(report.id, goals, transaction);

  return Promise.all(goals.map(async (goal) => {
    const goalId = goal.id;
    const fields = goal;

    if (!Number.isInteger(goalId)) {
      delete fields.id;
    }

    // using upsert here and below
    // - add returning: true to options to get an array of [<Model>,<created>] (postgres only)
    // - https://sequelize.org/v5/class/lib/model.js~Model.html#static-method-upsert

    const newGoal = await Goal.upsert(fields, { returning: true, transaction });

    return Promise.all(goal.objectives.map(async (objective) => {
      const { id, ...updatedFields } = objective;
      const updatedObjective = { ...updatedFields, goalId: newGoal[0].id };

      if (Number.isInteger(id)) {
        updatedObjective.id = id;
      }

      const savedObjective = await Objective.upsert(
        updatedObjective,
        { returning: true, transaction },
      );

      return ActivityReportObjective.create({
        objectiveId: savedObjective[0].id,
        activityReportId: report.id,
      }, { transaction });
    }));
  }));
}

export async function copyGoalsToGrants(goals, grantIds, transaction) {
  const grants = await Grant.findAll({
    where: {
      id: grantIds,
    },
  });

  const grantGoals = [];
  goals.forEach((goal) => {
    grants.forEach((grant) => {
      grantGoals.push({
        grantId: grant.id,
        recipientId: grant.recipientId,
        goalId: goal.id,
      });
    });
  });

  await GrantGoal.bulkCreate(grantGoals, {
    ignoreDuplicates: true,
    transaction,
  });
}

export async function updateGoalStatusById(
  goalId,
  newStatus,
  closeSuspendReason,
  closeSuspendContext,
) {
  /* TODO:
    Disable for now until goals are unique grants.
  */
  /*
  const updatedGoal = await Goal.update(
    {
      status: newStatus,
      closeSuspendReason,
      closeSuspendContext,
    },
    { where: { id: goalId }, returning: true },
  );
  return updatedGoal[1][0];
  */
}

export async function destroyGoal(goalId) {
  return sequelize.transaction(async (transaction) => {
    try {
      const isOnReport = await ActivityReport.findAll({
        attributes: ['id'],
        include: [
          {
            attributes: ['id'],
            model: Objective,
            required: true,
            as: 'objectivesWithGoals',
            include: [
              {
                attributes: ['id'],
                model: Goal,
                required: true,
                where: {
                  id: goalId,
                },
                as: 'goal',
              },
            ],
          },
        ],
        raw: true,
      }).length;

      if (isOnReport) {
        throw new Error('Goal is on an activity report and can\'t be deleted');
      }

      await ObjectiveTopic.destroy({
        where: {
          objectiveId: {
            [Op.in]: sequelize.literal(
              `(SELECT "id" FROM "Objectives" WHERE "goalId" = ${sequelize.escape(goalId)})`,
            ),
          },
        },
      });

      await ObjectiveResource.destroy({
        where: {
          objectiveId: {
            [Op.in]: sequelize.literal(
              `(SELECT "id" FROM "Objectives" WHERE "goalId" = ${sequelize.escape(goalId)})`,
            ),
          },
        },
      });

      await Objective.destroy({
        where: {
          goalId,
        },
      });

      await GrantGoal.destroy({
        where: {
          goalId,
        },
        transaction,
      });

      return Goal.destroy({
        where: {
          id: goalId,
        },
        transaction,
      });
    } catch (error) {
      auditLogger.error(`${logContext.namespace} - Sequelize error - unable to delete from db - ${error}`);
      return 0;
    }
  });
}
