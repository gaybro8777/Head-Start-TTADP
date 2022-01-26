import sequelize, { Op } from 'sequelize';

export function withGrantNumber(grantNumber) {
  const normalizedgrantNumber = `%${sequelize.escape(grantNumber)}%`;
  return {
    number: {
      [Op.iLike]: normalizedgrantNumber,
    },
  };
}

export function withoutGrantNumber(grantNumber) {
  const normalizedgrantNumber = `%${sequelize.escape(grantNumber)}%`;
  return {
    number: {
      [Op.notILike]: normalizedgrantNumber,
    },
  };
}
