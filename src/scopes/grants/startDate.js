import { Op } from 'sequelize';

export function beforeStartDate(dates) {
  const scopes = dates.reduce((acc, date) => [
    ...acc,
    {
      endDate: {
        [Op.lte]: new Date(date),
      },
    },
  ], []);

  return {
    [Op.or]: scopes,
  };
}

export function afterStartDate(dates) {
  const scopes = dates.reduce((acc, date) => [
    ...acc,
    {
      startDate: {
        [Op.lte]: new Date(date),
      },
      endDate: {
        [Op.gte]: new Date(date),
      },
    },
  ], []);

  return {
    [Op.or]: scopes,
  };
}

export function activeWithinDates(dates) {
  const scopes = dates.reduce((acc, range) => {
    if (!range.split) {
      return acc;
    }

    const [sd, ed] = range.split('-');
    if (!sd || !ed) {
      return acc;
    }

    return [
      ...acc,
      {
        startDate: {
          [Op.lte]: new Date(ed),
        },
        endDate: {
          [Op.gte]: new Date(sd),
        },
      },
    ];
  }, []);

  return {
    [Op.or]: scopes,
  };
}
