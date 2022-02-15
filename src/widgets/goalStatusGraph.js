import { Op } from 'sequelize';
import {
  Goal, Grant, Recipient, sequelize,
} from '../models';

export const GOAL_STATUS = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  CLOSED: 'Closed',
  CEASED: 'Ceased/Suspended',
  DRAFT: 'Draft',
};

const STATUSES_TO_INCLUDE = [
  GOAL_STATUS.NOT_STARTED,
  GOAL_STATUS.IN_PROGRESS,
  GOAL_STATUS.CLOSED,
  GOAL_STATUS.CEASED,
];

export default async function goalStatusGraph(scopes) {
  const goalsFromDb = await Goal.findAll({
    where: {
      [Op.and]: [
        scopes.goal,
        {
          status: {
            [Op.in]: STATUSES_TO_INCLUDE,
          },
        },
      ],
    },
    // BIGINT (type returned from count) gets converted to string. Explicitly set count to int
    attributes: [sequelize.literal('COUNT(DISTINCT("Goal".id))::int'), 'status'],
    group: ['"Goal".status'],
    includeIgnoreAttributes: false,
    raw: true,
    include: [{
      model: Grant,
      as: 'grants',
      required: true,
      include: [{
        model: Recipient,
        as: 'recipient',
        required: true,
      }],
    }],
  });

  const goals = STATUSES_TO_INCLUDE.map((status) => {
    const goal = goalsFromDb.find((g) => g.status === status);
    const count = goal ? goal.count : 0;
    return { status, count };
  });

  const total = goals.reduce((sum, g) => sum + g.count, 0);
  return {
    total,
    goals,
  };
}
