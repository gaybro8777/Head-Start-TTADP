import faker from '@faker-js/faker';
import db, {
  Goal,
  Objective,
  Recipient,
  Grant,
} from '..';

describe('objective model hooks', () => {
  let recipient;
  let grant;
  let goal;

  let objective1;
  let objective2;
  let objective3;

  beforeAll(async () => {
    recipient = await Recipient.create({
      id: faker.datatype.number(),
      name: faker.name.firstName(),
    });

    grant = await Grant.create({
      id: faker.datatype.number(),
      number: faker.datatype.string(),
      recipientId: recipient.id,
      regionId: 1,
    });

    goal = await Goal.create({
      name: 'Goal 1',
      status: 'Draft',
      endDate: null,
      isFromSmartsheetTtaPlan: false,
      onApprovedAR: false,
      grantId: grant.id,
      createdVia: 'rtr',
    });
  });

  afterAll(async () => {
    await Objective.destroy({
      where: {
        id: [objective1.id, objective2.id, objective3.id],
      },
    });

    await Goal.destroy({
      where: {
        id: goal.id,
      },
    });

    await Grant.destroy({
      where: {
        id: grant.id,
      },
    });

    await Recipient.destroy({
      where: {
        id: recipient.id,
      },
    });
    await db.sequelize.close();
  });

  it('does not update when the goal does not match the qualifications', async () => {
    objective1 = await Objective.create({
      title: 'Objective 1',
      goalId: goal.id,
      status: 'Draft',
    }, { individualHooks: true });

    let testGoal = await Goal.findByPk(goal.id);
    expect(testGoal.status).toEqual('Draft');

    await Objective.update({ status: 'In Progress' }, {
      where: {
        id: objective1.id,
      },
      individualHooks: true,
    });

    testGoal = await Goal.findByPk(goal.id);
    expect(testGoal.status).toEqual('Draft');

    await Objective.destroy({ where: { id: objective1.id } });
  });

  it('updates when the goal matches the qualifications', async () => {
    await Goal.update({ createdVia: 'activityReport' }, { where: { id: goal.id } });

    let testGoal = await Goal.findByPk(goal.id);
    expect(testGoal.status).toEqual('Draft');
    expect(testGoal.createdVia).toEqual('activityReport');
    expect(testGoal.id).toEqual(goal.id);

    objective2 = await Objective.create({
      title: 'Objective 2',
      goalId: goal.id,
      status: 'Draft',
    }, { individualHooks: true });
    objective3 = await Objective.create({
      title: 'Objective 3',
      goalId: goal.id,
      status: 'Not Started',
    }, { individualHooks: true });

    testGoal = await Goal.findByPk(goal.id);
    expect(testGoal.status).toEqual('Not Started');

    await Objective.update({ status: 'In Progress' }, {
      where: {
        id: objective2.id,
      },
      individualHooks: true,
    });

    testGoal = await Goal.findByPk(goal.id);
    expect(testGoal.status).toEqual('In Progress');

    await Objective.update({ status: 'Completed' }, {
      where: { id: [objective3.id, objective2.id] },
      individualHooks: true,

    });

    testGoal = await Goal.findByPk(goal.id);
    expect(testGoal.status).toEqual('Closed');
  });
});
