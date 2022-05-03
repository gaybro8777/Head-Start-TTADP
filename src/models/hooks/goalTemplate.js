const { Op } = require('sequelize');

const autoPopulateTemplateNameModifiedAt = (sequelize, instance) => {
  const changed = instance.changed();
  if (Array.isArray(changed)
    && changed.includes('templateName')
    && instance.templateName !== null
    && instance.templateName !== undefined) {
    instance.set('templateNameModifiedAt', new Date());
  }
};

const autoPopulateCreationMethod = (sequelize, instance) => {
  const changed = instance.changed();
  if (Array.isArray(changed)
        && (!changed.includes('creationMethod')
        || instance.creationMethod === null
        || instance.creationMethod === undefined)) {
    instance.set('creationMethod', 'Automatic');
  }
};

const propagateTemplateName = async (sequelize, instance, options) => {
  const changed = instance.changed();
  if (Array.isArray(changed)
        && changed.includes('templateName')
        && instance.creationMethod === 'Automatic') {
    await sequelize.models.Goal.update(
      { name: instance.name },
      {
        where: {
          [Op.and]: [
            { goalTemplateId: instance.id },
            { onApprovedAR: false },
            { name: { [Op.not]: instance.name } },
          ],
        },
        transaction: options.transaction,
      },
    );
  }
};

const beforeValidate = (sequelize, instance) => {
  autoPopulateTemplateNameModifiedAt(sequelize, instance);
  autoPopulateCreationMethod(sequelize, instance);
};

const afterUpdate = async (sequelize, instance, options) => {
  await propagateTemplateName(sequelize, instance, options);
};

export {
  autoPopulateTemplateNameModifiedAt,
  autoPopulateCreationMethod,
  propagateTemplateName,
  beforeValidate,
  afterUpdate,
};
