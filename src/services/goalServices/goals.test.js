import { Op } from 'sequelize';
import {
  saveGoalsForReport, goalsForGrants,
} from '../goals';
import {
  sequelize,
  Goal,
  Grant,
  Objective,
  ActivityReportObjective,
  ActivityReportGoal,
} from '../../models';

describe('Goals DB service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('saveGoalsForReport', () => {
    beforeEach(() => {
      ActivityReportObjective.findAll = jest.fn().mockResolvedValue([]);
      ActivityReportObjective.destroy = jest.fn();
      ActivityReportObjective.findOrCreate = jest.fn().mockResolvedValue([{ update: jest.fn() }]);
      Goal.findAll = jest.fn().mockResolvedValue([]);
      Goal.findOne = jest.fn().mockResolvedValue();
      Goal.findOrCreate = jest.fn().mockResolvedValue([{ id: 1 }, false]);
      Goal.destroy = jest.fn();
      Goal.update = jest.fn().mockResolvedValue([1, [{ id: 1 }]]);
      Objective.destroy = jest.fn();
      ActivityReportGoal.findOrCreate = jest.fn().mockResolvedValue();
      ActivityReportObjective.create = jest.fn();
      Goal.create = jest.fn().mockResolvedValue({ id: 1 });
      Objective.create = jest.fn().mockResolvedValue({ id: 1 });
      Objective.findOrCreate = jest.fn().mockResolvedValue([{ id: 1 }]);
      Objective.update = jest.fn().mockResolvedValue({ id: 1 });
    });

    describe('with removed goals', () => {
      it('deletes the objective', async () => {
        ActivityReportObjective.findAll.mockResolvedValue([
          {
            objectiveId: 1,
            objective: {
              goalId: 1,
            },
          },
        ]);
        await saveGoalsForReport([], { id: 1 });

        expect(Objective.destroy).toHaveBeenCalledWith(
          {
            where: {
              id: [1],
            },
          },
        );
      });

      it('deletes the ActivityReportObjective', async () => {
        ActivityReportObjective.findAll.mockResolvedValue([]);
        await saveGoalsForReport([], { id: 1 });
        expect(ActivityReportObjective.destroy).toHaveBeenCalledWith({
          where: {
            activityReportId: 1,
            objectiveId: [],
          },
        });
      });

      it('deletes goals not attached to a grant', async () => {
        ActivityReportObjective.findAll.mockResolvedValue([
          {
            objectiveId: 1,
            objective: {
              goalId: 1,
              goal: {
                id: 1,
                objectives: [{ id: 1 }],
              },
            },
          },
          {
            objectiveId: 2,
            objective: {
              goalId: 2,
              goal: {
                id: 2,
                objectives: [{ id: 2 }],
              },
            },
          },
        ]);

        Goal.findAll.mockResolvedValue([
          {
            id: 1,
          },
        ]);

        await saveGoalsForReport([], { id: 1 });
        expect(Goal.destroy).toHaveBeenCalledWith({
          where: {
            id: [2],
          },
        });
      });
    });

    it('creates new goals', async () => {
      await saveGoalsForReport([
        {
          id: 'new', grantIds: [1], name: 'name', status: 'Closed', objectives: [],
        },
      ], { id: 1 });
      expect(Goal.findOrCreate).toHaveBeenCalledWith({
        defaults: {
          grantId: 1,
          name: 'name',
          objectives: [],
          status: 'Closed',
        },
        where: {
          grantId: 1,
          name: 'name',
          status: {
            [Op.not]: 'Closed',
          },
        },
      });
    });

    it('can use existing goals', async () => {
      const existingGoal = {
        id: 1,
        name: 'name',
        objectives: [],
        grantIds: [],
      };

      await saveGoalsForReport([existingGoal], { id: 1 });
      expect(Goal.update).toHaveBeenCalledWith({
        id: 1,
        name: 'name',
        objectives: [],
      }, {
        where: { id: 1 },
        returning: true,
      });
    });

    test.todo('can update an existing goal');

    it('can create new objectives', async () => {
      const existingGoal = {
        id: 1,
        name: 'name',
        objectives: [],
        update: jest.fn(),
        grantIds: [1],
      };

      const goalWithNewObjective = {
        ...existingGoal,
        objectives: [{
          goalId: 1, title: 'title', ttaProvided: '', ActivityReportObjective: {}, status: '',
        }],
      };
      await saveGoalsForReport([goalWithNewObjective], { id: 1 });
      expect(Objective.findOrCreate).toHaveBeenCalledWith({
        where: {
          goalId: 1,
          title: 'title',
          status: { [Op.not]: 'Completed' },
        },
        defaults: { goalId: 1, title: 'title', status: '' },
      });
    });

    it('can update existing objectives', async () => {
      const existingGoal = {
        id: 1,
        name: 'name',
        objectives: [{ title: 'title', id: 1, status: 'Closed' }],
        update: jest.fn(),
        grantIds: [1],
      };

      const update = jest.fn();
      Objective.findByPk = jest.fn().mockResolvedValue({ update });

      await saveGoalsForReport([existingGoal], { id: 1 });
      expect(update).toHaveBeenCalledWith({ title: 'title', status: 'Closed' });
    });
  });
});

describe('goalsForGrants', () => {
  beforeAll(async () => {
    jest.resetAllMocks();
  });

  it('finds the correct list of goals', async () => {
    Grant.findAll = jest.fn();
    Grant.findAll.mockResolvedValue([{ id: 505, oldGrantId: 506 }]);
    Goal.findAll = jest.fn();
    Goal.findAll.mockResolvedValue([{ id: 505 }, { id: 506 }]);

    await goalsForGrants([506]);

    expect(Goal.findAll).toHaveBeenCalledWith({
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
          as: 'grant',
          attributes: ['id'],
          where: {
            id: [505, 506],
          },
        },
      ],
      order: ['createdAt'],
    });
  });
});
