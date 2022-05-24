const { Model } = require('sequelize');
const { CLOSE_SUSPEND_REASONS } = require('../constants');
const { formatDate } = require('../lib/modelHelpers');
const { beforeValidate, afterUpdate } = require('./hooks/goal');
// const { auditLogger } = require('../logger');

/**
 * Goals table. Stores goals for tta.
 *
 * @param {} sequelize
 * @param {*} DataTypes
 */
module.exports = (sequelize, DataTypes) => {
  class Goal extends Model {
    static associate(models) {
      Goal.belongsToMany(models.ActivityReport, {
        through: models.ActivityReportGoal,
        foreignKey: 'goalId',
        otherKey: 'activityReportId',
        as: 'activityReports',
      });
      Goal.belongsToMany(models.Topic, {
        through: models.TopicGoal,
        otherKey: 'topicId',
        foreignKey: 'goalId',
        as: 'topics',
      });
      Goal.belongsTo(models.Grant, { foreignKey: 'grantId', as: 'grant' });
      Goal.hasMany(models.Objective, { foreignKey: 'goalId', as: 'objectives' });
      Goal.belongsTo(models.GoalTemplate, { foreignKey: 'goalTemplateId', as: +'goalTemplates' });
    }
  }
  Goal.init({
    name: DataTypes.TEXT,
    status: DataTypes.STRING,
    timeframe: DataTypes.STRING,
    isFromSmartsheetTtaPlan: DataTypes.BOOLEAN,
    endDate: {
      type: DataTypes.DATEONLY,
      get: formatDate,
    },
    goalNumber: {
      type: DataTypes.VIRTUAL,
      get() {
        const { id, grant } = this;
        let regionId = 0;
        if (grant) {
          regionId = grant.regionId;
        }
        return `R${regionId}-G-${id}`;
      },
    },
    closeSuspendReason: {
      allowNull: true,
      type: DataTypes.ENUM(Object.keys(CLOSE_SUSPEND_REASONS).map((k) => CLOSE_SUSPEND_REASONS[k])),
    },
    closeSuspendContext: {
      type: DataTypes.TEXT,
    },
    grantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: {
          tableName: 'grants',
        },
        key: 'id',
      },
      onUpdate: 'CASCADE',
    },
    goalTemplateId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: {
          tableName: 'goalTemplates',
        },
        key: 'id',
      },
      onUpdate: 'CASCADE',
    },
    previousStatus: {
      type: DataTypes.STRING,
    },
    onApprovedAR: {
      type: DataTypes.BOOLEAN,
      default: false,
    },
    firstNotStartedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastNotStartedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    firstInProgressAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastInProgressAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    firstCeasedSuspendedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastCeasedSuspendedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    firstClosedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastClosedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    firstCompletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastCompletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'Goal',
    hooks: {
      beforeValidate: async (instance, options) => beforeValidate(sequelize, instance, options),
      afterUpdate: async (instance, options) => afterUpdate(sequelize, instance, options),
    },
  });
  return Goal;
};
