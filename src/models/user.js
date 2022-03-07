const { Model } = require('sequelize');
const isEmail = require('validator/lib/isEmail');
const { USER_ROLES } = require('../constants');

const featureFlags = [
  'recipient_goals_objectives',
];

const generateFullName = (name, role) => {
  const combinedRoles = Array.isArray(role) ? role.reduce((result, val) => {
    if (val) {
      return val === 'TTAC' || val === 'COR' ? `${result}, ${val}` : `${result}, ${val.split(' ').map((word) => word[0]).join('')}`;
    }
    return '';
  }, []) : [];
  return combinedRoles.length > 0 ? `${name}${combinedRoles}` : name;
};

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.belongsTo(models.Region, { foreignKey: { name: 'homeRegionId', allowNull: true }, as: 'homeRegion' });
      User.belongsToMany(models.Scope, {
        through: models.Permission, foreignKey: 'userId', as: 'scopes', timestamps: false,
      });
      User.hasMany(models.Permission, { foreignKey: 'userId', as: 'permissions' });
    }
  }
  User.init({
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: null,
      comment: null,
      primaryKey: true,
      autoIncrement: true,
    },
    homeRegionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    hsesUserId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    hsesUsername: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    hsesAuthorities: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    },
    name: DataTypes.STRING,
    phoneNumber: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      unique: true,
      validate: {
        isEmailOrEmpty(value, next) {
          if (!value || value === '' || isEmail(value)) {
            return next();
          }
          return next('email is invalid');
        },
      },
    },
    role: DataTypes.ARRAY(DataTypes.ENUM(USER_ROLES)),
    flags: DataTypes.ARRAY(DataTypes.ENUM(featureFlags)),
    fullName: {
      type: DataTypes.VIRTUAL,
      get() {
        return generateFullName(this.name, this.role);
      },
    },
    lastLogin: DataTypes.DATE,
  }, {
    defaultScope: {
      order: [
        [sequelize.fn('CONCAT', sequelize.col('name'), sequelize.col('email')), 'ASC'],
      ],
    },
    sequelize,
    modelName: 'User',
  });
  return User;
};

module.exports.featureFlags = featureFlags;
