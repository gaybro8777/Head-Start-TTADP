const { Model } = require('sequelize');
const { CREATION_METHOD } = require('../constants');
const { beforeValidate, beforeUpdate, afterUpdate } = require('./hooks/objectiveTemplate');
// const { auditLogger } = require('../logger');

module.exports = (sequelize, DataTypes) => {
  class ObjectiveTemplate extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      ObjectiveTemplate.hasMany(models.Objective, { foreignKey: 'objectiveTemplateId', as: 'objectives' });
      ObjectiveTemplate.hasMany(models.ObjectiveTemplateResource, { foreignKey: 'objectiveTemplateId', as: 'resources' });
      ObjectiveTemplate.belongsToMany(models.Topic, {
        through: models.ObjectiveTemplateTopic,
        foreignKey: 'objectiveTemplateId',
        otherKey: 'topicId',
        as: 'topics',
      });
      ObjectiveTemplate.hasMany(models.GoalTemplateObjectiveTemplate, { foreignKey: 'objectiveTemplateId', as: 'goalTemplateObjectiveTemplates' });
      ObjectiveTemplate.belongsToMany(models.GoalTemplate, {
        through: models.GoalTemplateObjectiveTemplate,
        foreignKey: 'objectiveTemplateId',
        otherKey: 'goalTemplateId',
        as: 'goalTemplates',
      });
    }
  }
  ObjectiveTemplate.init({
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    hash: {
      allowNull: false,
      type: DataTypes.TEXT,
    },
    templateTitle: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    regionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    creationMethod: {
      allowNull: false,
      type: DataTypes.ENUM(Object.keys(CREATION_METHOD).map((k) => CREATION_METHOD[k])),
    },
    lastUsed: {
      allowNull: true,
      type: DataTypes.DATE,
    },
    templateTitleModifiedAt: {
      allowNull: false,
      type: DataTypes.DATE,
    },
  }, {
    sequelize,
    modelName: 'ObjectiveTemplate',
    hooks: {
      beforeValidate: async (instance, options) => beforeValidate(sequelize, instance, options),
      beforeUpdate: async (instance, options) => beforeUpdate(sequelize, instance, options),
      afterUpdate: async (instance, options) => afterUpdate(sequelize, instance, options),
    },
  });
  return ObjectiveTemplate;
};
