import faker from '@faker-js/faker';
import db, {
  Recipient,
  Grant,
  Goal,
  ActivityReportObjective,
  Objective,
  Topic,
  ObjectiveTopic,
  ObjectiveResource,
} from '../../models';
import { createReport, destroyReport } from '../../testUtils';

import { goalByIdAndRecipient } from '../goals';
import { REPORT_STATUSES } from '../../constants';

describe('goalById', () => {
  let grantRecipient;
  let grantForReport;
  let report;
  let goalOnActivityReport;
  let objective;

  beforeAll(async () => {
    grantRecipient = await Recipient.create({
      id: faker.datatype.number({ min: 64000 }),
      name: faker.random.alphaNumeric(6),
      uei: faker.datatype.string(12),
    });

    grantForReport = await Grant.create({
      number: grantRecipient.id,
      recipientId: grantRecipient.id,
      programSpecialistName: faker.name.firstName(),
      regionId: 1,
      id: faker.datatype.number({ min: 64000 }),
    });

    goalOnActivityReport = await Goal.create({
      name: 'Goal on activity report',
      status: 'In Progress',
      timeframe: '12 months',
      grantId: grantForReport.id,
      isFromSmartsheetTtaPlan: false,
      id: faker.datatype.number({ min: 64000 }),
    });

    objective = await Objective.create({
      goalId: goalOnActivityReport.id,
      title: 'objective test',
      status: 'Not Started',
    });

    const [topic] = await Topic.findOrCreate({
      where: {
        name: 'test',
      },
    });

    await ObjectiveTopic.create({
      topicId: topic.id,
      objectiveId: objective.id,
    });

    await ObjectiveResource.create({
      objectiveId: objective.id,
      userProvidedUrl: 'http://www.google.com',
    });

    report = await createReport({
      regionId: 1,
      activityRecipients: [
        { grantId: grantForReport.id },
      ],
      calculatedStatus: REPORT_STATUSES.APPROVED,
    });

    await ActivityReportObjective.create({
      activityReportId: report.id,
      objectiveId: objective.id,
      ttaProvided: 'asdfadf',
      status: objective.status,
    });
  });

  afterAll(async () => {
    await ActivityReportObjective.destroy({
      where: {
        activityReportId: report.id,
      },
    });

    await ObjectiveTopic.destroy({
      where: {
        objectiveId: objective.id,
      },
    });

    await ObjectiveResource.destroy({
      where: {
        objectiveId: objective.id,
      },
    });

    await Objective.destroy({
      where: {
        goalId: goalOnActivityReport.id,
      },
    });

    await destroyReport(report);

    await Goal.destroy({
      where: {
        id: goalOnActivityReport.id,
      },
    });

    await Grant.destroy({
      where: {
        id: grantForReport.id,
      },
    });

    await Recipient.destroy({
      where: {
        id: grantRecipient.id,
      },
    });

    await db.sequelize.close();
  });

  it('retrieves a goal with associated data', async () => {
    const goal = await goalByIdAndRecipient(goalOnActivityReport.id, grantRecipient.id);
    // seems to be something with the aliasing attributes that requires
    // them to be accessed in this way
    expect(goal.dataValues.name).toBe('Goal on activity report');
    expect(goal.objectives.length).toBe(1);
    expect(goal.objectives[0].activityReports.length).toBe(1);
    expect(goal.objectives[0].topics.length).toBe(1);
    expect(goal.objectives[0].resources.length).toBe(1);
    expect(goal.objectives[0].resources[0].dataValues.value).toBe('http://www.google.com');
    expect(goal.grant.id).toBe(grantForReport.id);
  });
});
