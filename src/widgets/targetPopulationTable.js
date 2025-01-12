import { Op } from 'sequelize';
import { ActivityReport } from '../models';
import { REPORT_STATUSES, TARGET_POPULATIONS } from '../constants';
import { countBySingleKey } from './helpers';

export default async function targetPopulationTable(scopes) {
  const res = await ActivityReport.findAll({
    attributes: [
      'targetPopulations',
    ],
    where: {
      [Op.and]: [
        scopes.activityReport,
        { calculatedStatus: REPORT_STATUSES.APPROVED },
      ],
    },
    raw: true,
  });

  const populations = TARGET_POPULATIONS.map((population) => ({ name: population, count: 0 }));

  return countBySingleKey(res, 'targetPopulations', populations);
}
