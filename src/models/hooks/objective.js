const autoPopulateObjectiveTemplateId = async (sequelize, instance, options) => {
  // eslint-disable-next-line no-prototype-builtins
  if (!instance.hasOwnProperty('objectiveTemplateId')
  || instance.objectiveTemplateId === null
  || instance.objectiveTemplateId === undefined) {
    const goal = await sequelize.models.Goal.findOne({
      where: { id: instance.goalId },
      include: [
        {
          model: sequelize.models.Grant,
          as: 'grants',
          attributes: ['regionId'],
        },
      ],
    });
    const objectiveTemplate = await sequelize.models.ObjectiveTemplate.findOrCreate({
      where: { templateName: instance.name, regionId: goal.regionId },
      default: {
        templateTitle: instance.title,
        lastUsed: instance.createdAt,
        regionId: goal.regionId,
        creationMethod: 'Automatic',
      },
      transaction: options.transaction,
    });
    instance.set('objectiveTemplateId', objectiveTemplate[0].id);
  }
};

const autoPopulateOnApprovedAR = (sequelize, instance) => {
  // eslint-disable-next-line no-prototype-builtins
  if (!instance.hasOwnProperty('onApprovedAR')
  || instance.onApprovedAR === null
  || instance.onApprovedAR === undefined) {
    instance.set('onApprovedAR', false);
  }
};

const preventTitleChangeWhenOnApprovedAR = (sequelize, instance) => {
  if (instance.onApprovedAR === true) {
    const changed = instance.changed();
    if (Array.isArray(changed)
          && changed.includes('title')) {
      throw new Error('Objective title change not allowed for objectives on approved activity reports.');
    }
  }
};

const autoPopulateStatusChangeDates = (sequelize, instance) => {
  const changed = instance.changed();
  if (Array.isArray(changed) && changed.includes('status')) {
    const now = new Date();
    switch (instance.status) {
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
      case 'Complete':
        if (instance.firstCompleteAt === null
          && instance.firstCompleteAt === undefined) {
          instance.set('firstCompleteAt', now);
        }
        instance.set('lastCompleteAt', now);
        break;
      default:
        throw new Error(`Goal status changed to invalid value of "${instance.status}".`);
    }
  }
};

const propagateTitle = async (sequelize, instance, options) => {
  const changed = instance.changed();
  if (Array.isArray(changed) && changed.includes('title')) {
    await sequelize.models.ObjectiveTemplate.update(
      { templateTitle: instance.title },
      {
        where: { id: instance.goalTemplateId },
        transaction: options.transaction,
      },
    );
  }
};

const beforeValidate = async (sequelize, instance, options) => {
  await autoPopulateObjectiveTemplateId(sequelize, instance, options);
  autoPopulateOnApprovedAR(sequelize, instance);
  preventTitleChangeWhenOnApprovedAR(sequelize, instance);
  autoPopulateStatusChangeDates(sequelize, instance);
};

const afterUpdate = async (sequelize, instance, options) => {
  await propagateTitle(sequelize, instance, options);
};

export {
  autoPopulateObjectiveTemplateId,
  autoPopulateOnApprovedAR,
  preventTitleChangeWhenOnApprovedAR,
  propagateTitle,
  beforeValidate,
  afterUpdate,
};
