import { Op } from 'sequelize';
import { ActivityReport } from '../models';
import { REPORT_STATUSES } from '../constants';

export default async function reasonList(scopes) {
  // Query Database for all Reasons within the scope.
  const res = await ActivityReport.findAll({
    attributes: [
      'reason',
    ],
    where: {
      [Op.and]: [
        scopes,
        { status: REPORT_STATUSES.APPROVED },
      ],
    },
    raw: true,
  });

  // Get counts for each reason.
  const reasons = [];
  res.forEach((rarr) => {
    rarr.reason.forEach((r) => {
      const reasonObj = reasons.find((e) => e.name === r);
      if (reasonObj) {
        reasonObj.count += 1;
      } else {
        reasons.push({ name: r, count: 1 });
      }
    });
  });

  // Sort By Reason Count largest to smallest.
  reasons.sort((r1, r2) => {
    if (r2.count - r1.count === 0) {
      // Break tie on Reason name.
      const reasonName1 = r1.name.toUpperCase().replace(' ', ''); // ignore upper and lowercase
      const reasonName2 = r2.name.toUpperCase().replace(' ', ''); // ignore upper and lowercase
      if (reasonName1 < reasonName2) {
        return -1;
      }
      if (reasonName1 > reasonName2) {
        return 1;
      }
    }
    return r2.count - r1.count;
  });

  // Return only top 14.
  return reasons;
}
