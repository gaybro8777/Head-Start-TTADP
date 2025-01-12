const { Model } = require('sequelize');
const { beforeDestroy, afterDestroy } = require('./hooks/activityReportFile');

module.exports = (sequelize, DataTypes) => {
  class ActivityReportFile extends Model {
    static associate(models) {
      ActivityReportFile.belongsTo(models.ActivityReport, { foreignKey: 'activityReportId', as: 'activityReport' });
      ActivityReportFile.belongsTo(models.File, { foreignKey: 'fileId', as: 'file' });
    }
  }
  ActivityReportFile.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER,
    },
    activityReportId: {
      type: DataTypes.INTEGER,
    },
    fileId: {
      type: DataTypes.INTEGER,
    },
  }, {
    sequelize,
    modelName: 'ActivityReportFile',
    hooks: {
      beforeDestroy: async (instance, options) => beforeDestroy(sequelize, instance, options),
      afterDestroy: async (instance, options) => afterDestroy(sequelize, instance, options),
    },
  });
  return ActivityReportFile;
};
