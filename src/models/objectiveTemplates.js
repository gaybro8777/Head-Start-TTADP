const { Model } = require('sequelize');

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
      ObjectiveTemplate.belongsToMany(models.Topic, { through: models.ObjectiveTemplateTopic, foreignKey: 'objectiveTemplateId', as: 'topics' });
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
    templateTitle: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    lastUsed: {
      allowNull: true,
      type: DataTypes.DATE,
    },
    templateNameModifiedAt: {
      allowNull: false,
      type: DataTypes.DATE,
    },
  }, {
    sequelize,
    modelName: 'ObjectiveTemplate',
  });
  return ObjectiveTemplate;
};
