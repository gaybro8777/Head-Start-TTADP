const propagateDestroyToMetadata = async (sequelize, instance, options) => Promise.all([
  await sequelize.models.ActivityReportObjectiveFile.destroy({
    where: {
      activityReportObjectiveId: instance.id,
    },
    individualHooks: true,
    transaction: options.transaction,
  }),
  await sequelize.models.ActivityReportObjectiveResource.destroy({
    where: {
      activityReportObjectiveId: instance.id,
    },
    individualHooks: true,
    transaction: options.transaction,
  }),
  await sequelize.models.ActivityReportObjectiveTopic.destroy({
    where: {
      activityReportObjectiveId: instance.id,
    },
    individualHooks: true,
    transaction: options.transaction,
  }),
]);

const beforeDestroy = async (sequelize, instance, options) => {
  await propagateDestroyToMetadata(sequelize, instance, options);
};

export {
  propagateDestroyToMetadata,
  beforeDestroy,
};
