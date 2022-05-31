/* eslint-disable no-unused-vars */
import { Op } from 'sequelize';
import { auditLogger } from '../logger';
import {
  Goal,
  Grant,
  Objective,
  ObjectiveResource,
  ObjectiveTopic,
  ActivityReportObjective,
  GrantGoal,
  Recipient,
  ActivityReport,
  Topic,
  Program,
  sequelize,
} from '../models';
import { DECIMAL_BASE, REPORT_STATUSES } from '../constants';

const namespace = 'SERVICE:GOALS';

const logContext = {
  namespace,
};

const OPTIONS_FOR_GOAL_FORM_QUERY = (id, recipientId) => ({
  attributes: [
    'id',
    'endDate',
    ['name', 'goalName'],
    'status',
    [sequelize.col('grants.regionId'), 'regionId'],
    [sequelize.col('grants.recipient.id'), 'recipientId'],
  ],
  where: {
    id,
  },
  include: [
    {
      attributes: [
        'title',
        'id',
        'status',
      ],
      model: Objective,
      as: 'objectives',
      include: [
        {
          model: ObjectiveResource,
          as: 'resources',
          attributes: [
            ['userProvidedUrl', 'value'],
            ['id', 'key'],
          ],
        },
        {
          model: Topic,
          as: 'topics',
          attributes: [
            ['id', 'value'],
            ['name', 'label'],
          ],
        },
        {
          model: ActivityReport,
          as: 'activityReports',
          where: {
            calculatedStatus: {
              [Op.not]: REPORT_STATUSES.DELETED,
            },
          },
          required: false,
        },
      ],
    },
    {
      model: Grant,
      as: 'grants',
      attributes: [
        'id',
        'number',
        'regionId',
      ],
      include: [
        {
          attributes: ['programType'],
          model: Program,
          as: 'programs',
        },
        {
          attributes: ['id'],
          model: Recipient,
          as: 'recipient',
          where: {
            id: recipientId,
          },
          required: true,
        },
      ],
    },
  ],
});

export async function goalByIdAndRecipient(id, recipientId) {
  return Goal.findOne(OPTIONS_FOR_GOAL_FORM_QUERY(id, recipientId));
}

export async function goalsByIdAndRecipient(ids, recipientId) {
  return Goal.findAll(OPTIONS_FOR_GOAL_FORM_QUERY(ids, recipientId));
}

export async function goalByIdWithActivityReportsAndRegions(goalId) {
  return Goal.findOne({
    attributes: ['name', 'id', 'status'],
    where: {
      id: goalId,
    },
    include: [
      {
        model: Grant,
        as: 'grants',
        attributes: ['regionId'],
      },
      {
        attributes: ['id'],
        model: Objective,
        as: 'objectives',
        required: false,
        include: [{
          attributes: ['id'],
          model: ActivityReport,
          as: 'activityReports',
          required: false,
        }],
      },
    ],
  });
}

async function cleanupObjectivesForGoal(goalId, currentObjectives) {
  // get all objectives not currently on a goal
  const orphanedObjectives = await Objective.findAll({
    attributes: ['id'],
    where: {
      goalId,
      id: {
        [Op.notIn]: currentObjectives.map((objective) => objective.id),
      },
    },
  });

  const orphanedObjectiveIds = orphanedObjectives.map((objective) => objective.id);

  await ObjectiveResource.destroy({
    where: {
      objectiveId: orphanedObjectiveIds,
    },
  });

  await ObjectiveTopic.destroy({
    where: {
      objectiveId: orphanedObjectiveIds,
    },
  });

  return Objective.destroy({
    where: {
      id: orphanedObjectiveIds,
    },
  });
}

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
  // per a discussion with Patrice, we are disabling the backend "for real"
  // for now (until the feature is ready to go)
  return goals;

  // // there can only be one on the goal form (multiple grants maybe, but one recipient)
  // // we will need this after the transaction, as trying to do a find all within a transaction
  // // yields the previous data values
  // let recipient;

  // eslint-disable-next-line max-len
  // const goalIds = await sequelize.transaction(async (transaction) => Promise.all(goals.map(async (goalData) => {
  //   const {
  //     id, grants, recipientId, regionId, objectives,
  //     ...fields
  //   } = goalData;

  //   // there can only be one on the goal form (multiple grants maybe, but one recipient)
  //   recipient = recipientId;

  //   const options = {
  //     ...fields,
  //     isFromSmartsheetTtaPlan: false,
  //     id: id === 'new' ? null : id,
  //   };

  //   const [goal] = await Goal.upsert(options, { transaction });

  //   const grantGoals = await Promise.all(
  //     grants.map((grant) => GrantGoal.findOrCreate({
  //       where: {
  //         goalId: goal.id,
  //         recipientId,
  //         grantId: grant.value,
  //       },
  //       transaction,
  //     })),
  //   );

  //   const grantGoalIds = grantGoals.map((gg) => gg.id);

  //   // cleanup grant goals
  //   await GrantGoal.destroy({
  //     where: {
  //       id: {
  //         [Op.notIn]: grantGoalIds,
  //       },
  //       goalId: goal.id,
  //     },
  //   });

  //   const newObjectives = await Promise.all(
  //     objectives.map(async (o) => {
  //       const {
  //         id: objectiveId,
  //         resources,
  //         topics,
  //         ...objectiveFields
  //       } = o;

  //       const where = parseInt(objectiveId, DECIMAL_BASE) ? {
  //         id: objectiveId,
  //         goalId: goal.id,
  //         ...objectiveFields,
  //       } : {
  //         goalId: goal.id,
  //         title: o.title,
  //         ttaProvided: '',
  //         status: 'Not started',
  //       };

  //       const [objective] = await Objective.upsert(
  //         where,
  //         { transaction },
  //       );

  //       // topics
  //       const objectiveTopics = await Promise.all(
  //         (topics.map((ot) => ObjectiveTopic.findOrCreate({
  //           where: {
  //             objectiveId: objective.id,
  //             topicId: ot.value,
  //           },
  //           transaction,
  //         }))),
  //       );

  //       // cleanup objective topics
  //       await ObjectiveTopic.destroy({
  //         where: {
  //           id: {
  //             [Op.notIn]: objectiveTopics.length ? objectiveTopics.map(([ot]) => ot.id) : [],
  //           },
  //           objectiveId: objective.id,
  //         },
  //       });

  //       // resources
  //       const objectiveResources = await Promise.all(
  //         resources.filter(({ value }) => value).map(
  //           ({ value }) => ObjectiveResource.findOrCreate({
  //             where: {
  //               userProvidedUrl: value,
  //               objectiveId: objective.id,
  //             },
  //             transaction,
  //           }),
  //         ),
  //       );

  //       // cleanup objective resources
  //       await ObjectiveResource.destroy({
  //         where: {
  //           id: {
  //             [Op.notIn]: objectiveResources.length
  //               ? objectiveResources.map(([or]) => or.id) : [],
  //           },
  //           objectiveId: objective.id,
  //         },
  //       });

  //       return {
  //         ...objective.dataValues,
  //         topics,
  //         resources,
  //       };
  //     }),
  //   );

  //   // this function deletes unused objectives
  //   await cleanupObjectivesForGoal(goal.id, newObjectives);

  //   return goal.id;
  // })));

  // // we have to do this outside of the transaction otherwise
  // // we get the old values
  // return goalsByIdAndRecipient(goalIds, recipient);
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

async function removeActivityReportObjectivesFromReport(reportId, objectiveIdsToRemove) {
  return ActivityReportObjective.destroy({
    where: {
      activityReportId: reportId,
      objectiveId: objectiveIdsToRemove,
    },
  });
}

export async function removeGoals(goalsToRemove) {
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
  });

  const goalIdsToKeep = goalsWithGrants.map((g) => g.id);
  const goalsWithoutGrants = goalsToRemove.filter((id) => !goalIdsToKeep.includes(id));

  return Goal.destroy({
    where: {
      id: goalsWithoutGrants,
    },
  });
}

async function removeObjectives(currentObjectiveIds) {
  return Objective.destroy({
    where: {
      id: currentObjectiveIds,
    },
  });
}

export async function removeUnusedGoalsObjectivesFromReport(reportId, currentObjectives) {
  const previousObjectives = await ActivityReportObjective.findAll({
    where: {
      activityReportId: reportId,
    },
    include: {
      model: Objective,
      as: 'objective',
      include: {
        model: Goal,
        as: 'goal',
        include: {
          model: Objective,
          as: 'objectives',
        },
      },
    },
  });

  const currentObjectiveIds = currentObjectives.map((o) => o.id);

  const activityReportObjectivesToRemove = previousObjectives.filter(
    (aro) => !currentObjectiveIds.includes(aro.objectiveId),
  );

  const objectiveIdsToRemove = activityReportObjectivesToRemove.map((aro) => aro.objectiveId);
  const goals = activityReportObjectivesToRemove.map((aro) => aro.objective.goal);

  const goalIdsToRemove = goals.filter((g) => g).filter((goal) => {
    const objectiveIds = goal.objectives.map((o) => o.id);
    return objectiveIds.every((oId) => objectiveIdsToRemove.includes(oId));
  }).map((g) => g.id);

  await removeActivityReportObjectivesFromReport(reportId, objectiveIdsToRemove);
  await removeObjectives(objectiveIdsToRemove);
  return removeGoals(goalIdsToRemove);
}

export async function saveGoalsForReport(goals, report) {
  const currentGoals = await Promise.all(goals.map(async (goal) => {
    const goalId = goal.id;
    const fields = goal;

    if (!Number.isInteger(goalId)) {
      delete fields.id;
    }

    // using upsert here and below
    // - add returning: true to options to get an array of [<Model>,<created>] (postgres only)
    // - https://sequelize.org/v5/class/lib/model.js~Model.html#static-method-upsert
    const [newGoal] = await Goal.upsert(fields, { returning: true });
    const newObjectives = await Promise.all(goal.objectives.map(async (objective) => {
      const { id, ...updatedFields } = objective;
      const updatedObjective = { ...updatedFields, goalId: newGoal.id };

      if (Number.isInteger(id)) {
        updatedObjective.id = id;
      }

      const [savedObjective] = await Objective.upsert(
        updatedObjective,
        { returning: true },
      );

      await ActivityReportObjective.findOrCreate({
        where: {
          objectiveId: savedObjective.id,
          activityReportId: report.id,
        },
      });
      return savedObjective;
    }));

    newGoal.objectives = newObjectives;
    return newGoal;
  }));

  const currentObjectives = currentGoals.map((g) => g.objectives).flat();
  return removeUnusedGoalsObjectivesFromReport(report.id, currentObjectives);
}

export async function copyGoalsToGrants(goals, grantIds) {
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
  });
}

export async function updateGoalStatusById(
  goalId,
  oldStatus,
  newStatus,
  closeSuspendReason,
  closeSuspendContext,
) {
  return sequelize.transaction(async (transaction) => {
    const updatedGoal = await Goal.update(
      {
        status: newStatus,
        closeSuspendReason,
        closeSuspendContext,
        previousStatus: oldStatus,
      },
      { where: { id: goalId }, returning: true, transaction },
    );
    return updatedGoal[1][0];
  });
}

export async function destroyGoal(goalId) {
  return goalId;
  // return sequelize.transaction(async (transaction) => {
  //   try {
  //     const reportsWithGoal = await ActivityReport.findAll({
  //       attributes: ['id'],
  //       include: [
  //         {
  //           attributes: ['id'],
  //           model: Objective,
  //           required: true,
  //           as: 'objectivesWithGoals',
  //           include: [
  //             {
  //               attributes: ['id'],
  //               model: Goal,
  //               required: true,
  //               where: {
  //                 id: goalId,
  //               },
  //               as: 'goal',
  //             },
  //           ],
  //         },
  //       ],
  //       transaction,
  //       raw: true,
  //     });

  //     const isOnReport = reportsWithGoal.length;
  //     if (isOnReport) {
  //       throw new Error('Goal is on an activity report and can\'t be deleted');
  //     }

  //     const objectiveTopicsDestroyed = await ObjectiveTopic.destroy({
  //       where: {
  //         objectiveId: {
  //           [Op.in]: sequelize.literal(
  //             `(SELECT "id" FROM "Objectives" WHERE "goalId" = ${sequelize.escape(goalId)})`,
  //           ),
  //         },
  //       },
  //       transaction,
  //     });

  //     const objectiveResourcesDestroyed = await ObjectiveResource.destroy({
  //       where: {
  //         objectiveId: {
  //           [Op.in]: sequelize.literal(
  //             `(SELECT "id" FROM "Objectives" WHERE "goalId" = ${sequelize.escape(goalId)})`,
  //           ),
  //         },
  //       },
  //       transaction,
  //     });

  //     const objectivesDestroyed = await Objective.destroy({
  //       where: {
  //         goalId,
  //       },
  //       transaction,
  //     });

  //     const grantGoalsDestroyed = await GrantGoal.destroy({
  //       where: {
  //         goalId,
  //       },
  //       transaction,
  //     });

  //     const goalsDestroyed = await Goal.destroy({
  //       where: {
  //         id: goalId,
  //       },
  //       transaction,
  //     });

  //     return {
  //       goalsDestroyed,
  //       grantGoalsDestroyed,
  //       objectiveResourcesDestroyed,
  //       objectiveTopicsDestroyed,
  //       objectivesDestroyed,
  //     };
  //   } catch (error) {
  //     auditLogger.error(
  //  `${logContext.namespace} - Sequelize error - unable to delete from db - ${error}`
  //  );
  //     return 0;
  //   }
  // });
}
