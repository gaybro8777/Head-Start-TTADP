const {
  Model,
} = require('sequelize');

/**
 * Roles table. Stores user roles, e.g. 'HS' ('Health Specialist')
 *
 * @param {} sequelize
 * @param {*} DataTypes
 */

module.exports = (sequelize, DataTypes) => {
  class Role extends Model {
    static associate(models) {
      Role.belongsToMany(models.Topic, {
        through: models.RoleTopic, foreignKey: 'roleId', as: 'topics', otherKey: 'topicId',
      });
      Role.belongsToMany(models.User, {
        through: models.UserRole,
        foreignKey: 'roleId',
        otherKey: 'userId',
        as: 'users',
      });
      Role.belongsToMany(models.ActivityReportCollaborator, {
        through: models.CollaboratorRole,
        otherKey: 'activityReportCollaboratorId',
        foreignKey: 'roleId',
        as: 'collaboratorRoles',
      });
    }
  }
  Role.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fullName: {
      type: DataTypes.STRING,
    },
    isSpecialist: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      default: false,
      onUpdate: 'CASCADE',
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    mapsTo: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'Role',
  });
  return Role;
};
