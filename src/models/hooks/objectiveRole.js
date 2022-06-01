// const { Op } = require('sequelize');
// import { auditLogger } from '../../logger';
import { CREATION_METHOD } from '../../constants';

// When a new resource is added to an objective, add the resource to the template or update the
// updatedAt value.
const propagateCreateToTemplate = async (sequelize, instance, options) => {
  const objective = await sequelize.models.Objective.findOne({
    where: { id: instance.objectiveId },
    include: [
      {
        model: sequelize.models.ObjectiveTemplate,
        as: 'objectiveTemplate',
        required: true,
        attributes: ['id', 'creationMethod'],
      },
    ],
    transaction: options.transaction,
  });
  if (objective.objectiveTemplate.creationMethod === CREATION_METHOD[0]) { // 'Automatic'
    const otr = await sequelize.models.ObjectiveTemplateRole.findOrCreate({
      where: {
        objectiveTemplateId: objective.objectiveTemplateId,
        roleId: instance.roleId,
      },
      defaults: {
        objectiveTemplateId: instance.objective.objectiveTemplateId,
        fileId: instance.fileId,
      },
      transaction: options.transaction,
    });
    await sequelize.models.ObjectiveTemplateRole.update(
      {
        updatedAt: new Date(),
      },
      {
        where: { id: otr.id },
        transaction: options.transaction,
      },
    );
  }
};

const propagateDestroyToTemplate = async (sequelize, instance, options) => {
  const objective = await sequelize.models.Objective.findOne({
    where: { id: instance.objectiveId },
    include: [
      {
        model: sequelize.models.ObjectiveTemplate,
        as: 'objectiveTemplate',
        required: true,
        attributes: ['id', 'creationMethod'],
      },
    ],
    transaction: options.transaction,
  });
  if (objective.objectiveTemplate.creationMethod === CREATION_METHOD[0]) { // 'Automatic'
    const otr = await sequelize.models.ObjectiveTemplateRole.findOne({
      attributes: ['id'],
      where: {
        objectiveTemplateId: objective.objectiveTemplateId,
        roleId: instance.roleId,
      },
      include: [
        {
          model: sequelize.models.ObjectiveTemplate,
          as: 'objectiveTemplate',
          required: true,
          include: [
            {
              model: sequelize.models.Objective,
              as: 'objectives',
              required: true,
              attributes: ['id'],
              where: { onApprovedAR: true },
            },
          ],
        },
      ],
      transaction: options.transaction,
    });
    if (otr.objectiveTemplate.objectives.length > 0) {
      await sequelize.models.ObjectiveTemplateRole.update(
        {
          updatedAt: new Date(),
        },
        {
          where: { id: otr.id },
          transaction: options.transaction,
        },
      );
    } else {
      await sequelize.models.ObjectiveTemplateRole.destroy({
        where: { id: otr.id },
        transaction: options.transaction,
      });
    }
  }
};

const afterCreate = async (sequelize, instance, options) => {
  await propagateCreateToTemplate(sequelize, instance, options);
};

const afterDestroy = async (sequelize, instance, options) => {
  await propagateDestroyToTemplate(sequelize, instance, options);
};

export {
  propagateCreateToTemplate,
  propagateDestroyToTemplate,
  afterCreate,
  afterDestroy,
};
