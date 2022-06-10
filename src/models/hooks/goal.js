const autoPopulateGoalTemplateId = async (sequelize, instance, options) => {
  // eslint-disable-next-line no-prototype-builtins
  if (!instance.hasOwnProperty('goalTemplateId')
  || instance.goalTemplateId === null
  || instance.goalTemplateId === undefined) {
    const grant = await sequelize.models.Grant.findOne({ where: { id: instance.grantId } });
    const goalTemplate = await sequelize.models.GoalTemplate.findOrCreate({
      where: { hash: sequelize.fn('md5', sequelize.fn('NULLIF', sequelize.fn('TRIM', instance.name), '')), regionId: grant.regionId },
      defaults: {
        templateName: instance.name,
        lastUsed: instance.createdAt,
        regionId: grant.regionId,
        creationMethod: 'Automatic',
      },
      transaction: options.transaction,
    });
    instance.set('goalTemplateId', goalTemplate[0].id);
  }
};

const autoPopulateOnApprovedAR = (sequelize, instance) => {
  // eslint-disable-next-line no-prototype-builtins
  if (instance.onApprovedAR === undefined
    || instance.onApprovedAR === null) {
    instance.set('onApprovedAR', false);
  }
};

const preventNamChangeWhenOnApprovedAR = (sequelize, instance) => {
  if (instance.onApprovedAR === true) {
    const changed = instance.changed();
    if (instance.id !== null && Array.isArray(changed)
          && changed.includes('name')) {
      throw new Error('Goal name change now allowed for goals on approved activity reports.');
    }
  }
};

const autoPopulateStatusChangeDates = (sequelize, instance) => {
  const changed = instance.changed();
  if (Array.isArray(changed) && changed.includes('status')) {
    const now = new Date();
    const { status } = instance;
    switch (status) {
      case '':
      case null:
      case 'Draft':
        break;
      case 'Not Started':
        if (instance.firstNotStartedAt === null
          && instance.firstNotStartedAt === undefined) {
          instance.set('firstNotStartedAt', now);
        }
        instance.set('lastNotStartedAt', now);
        break;
      case 'In Progress':
        if (instance.firstInProgressAt === null
          && instance.firstInProgressAt === undefined) {
          instance.set('firstInProgressAt', now);
        }
        instance.set('lastInProgressAt', now);
        break;
      case 'Suspended':
        if (instance.firstSuspendedAt === null
          && instance.firstSuspendedAt === undefined) {
          instance.set('firstSuspendedAt', now);
        }
        instance.set('lastSuspendedAt', now);
        break;
      case 'Closed':
        if (instance.firstClosedAt === null
          && instance.firstClosedAt === undefined) {
          instance.set('firstClosedAt', now);
        }
        instance.set('lastClosedAt', now);
        break;
      default:
        throw new Error(`Goal status changed to invalid value of "${status}".`);
    }
  }
};

const propagateName = async (sequelize, instance, options) => {
  const changed = instance.changed();
  if (Array.isArray(changed) && changed.includes('name')) {
    await sequelize.models.GoalTemplate.update(
      { templateName: instance.name },
      {
        where: { id: instance.goalTemplateId },
        transaction: options.transaction,
      },
    );
  }
};

const beforeValidate = async (sequelize, instance, options) => {
  await autoPopulateGoalTemplateId(sequelize, instance, options);
  autoPopulateOnApprovedAR(sequelize, instance);
  preventNamChangeWhenOnApprovedAR(sequelize, instance);
  autoPopulateStatusChangeDates(sequelize, instance);
};

const afterUpdate = async (sequelize, instance, options) => {
  await propagateName(sequelize, instance, options);
};

export {
  autoPopulateGoalTemplateId,
  autoPopulateOnApprovedAR,
  preventNamChangeWhenOnApprovedAR,
  autoPopulateStatusChangeDates,
  propagateName,
  beforeValidate,
  afterUpdate,
};
