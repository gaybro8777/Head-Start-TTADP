/* eslint-disable import/prefer-default-export */
import {
  Objective,
  ActivityReportObjective,
} from '../models';

export async function saveObjectivesForReport(objectives, report, transaction) {
  // const objectivesToCreate = objectives.filter((obj) => !obj.new);

  // const existingObjectives = await Promise.all(
  //   objectives.map((objective) => Objective.findOrCreate({
  //     where: {
  //       objective,
  //     },
  //   })),
  // );

  // const activityReportObjectives = await Promise.all(
  //   existingObjectives.map((objective) => ActivityReportObjective.findOrCreate({
  //     where: {
  //       activityReportId: report.id,
  //       objectiveId: objective.id,
  //     },
  //     transaction,
  //   })),
  // );

  const reportObjectives = await ActivityReportObjective.findAll({
    where: {
      activityReportId: report.id,
    },
    transaction,
  });

  const objectiveIds = reportObjectives.map((reportObjective) => reportObjective.objectiveId);
  await ActivityReportObjective.destroy(
    {
      where: {
        activityReportId: report.id,
      },
    },
    transaction,
  );

  await Objective.destroy(
    {
      where: {
        id: objectiveIds,
      },
    },
    transaction,
  );

  return Promise.all(objectives.map(async (objective) => {
    const { status, title, ttaProvided } = objective;

    const createdObjective = await Objective.create({
      title,
      ttaProvided,
      status,
    }, { transaction });

    return ActivityReportObjective.create(
      {
        objectiveId: createdObjective.id,
        activityReportId: report.id,
      },
      { transaction },
    );
  }));
}
