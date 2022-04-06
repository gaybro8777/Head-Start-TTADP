const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class GoalTemplate extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      GoalTemplate.belongsToMany(models.Goal, { foreignKey: 'goalTemplateId' });
    }
  }
  GoalTemplate.init({
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    templateName: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'GoalTemplate',
  });
  return GoalTemplate;
};
