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
    static associate() {
    }
  }
  ObjectiveTopic.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER,
    },
  }, {
    sequelize,
    modelName: 'ObjectiveTopic',
  });
  return ObjectiveTopic;
};