const {
  Model,
} = require('sequelize');

/**
   * ObjectiveTopic table. Junction table
   * between Objectives and topics
   * @param {} sequelize
   * @param {*} DataTypes
   */
module.exports = (sequelize, DataTypes) => {
  class ObjectiveTopic extends Model {
    static associate(models) {
      ObjectiveTopic.belongsTo(models.Objective, { foreignKey: 'objectiveId', onDelete: 'cascade' });
    }
  }
  ObjectiveTopic.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER,
    },
    objectiveId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'ObjectiveTopic',
  });
  return ObjectiveTopic;
};
