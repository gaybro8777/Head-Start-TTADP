// Load in our dependencies
import { Model, DataTypes } from 'sequelize'; // eslint-disable-line import/no-import-module-exports
import httpContext from 'express-http-context'; // eslint-disable-line import/no-import-module-exports

const dmlType = ['INSERT', 'UPDATE', 'DELETE'];

// const exception = () => {
//   throw new Error(
//     'Audit log only allows reading and inserting data,'
//     + ' all modification and removal is not allowed.'
//   );
// };

const tryJsonParse = (fieldName) => {
  const data = this.getDataValue(fieldName);
  if (typeof data === 'object') {
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'string') {
        try {
          data[key] = JSON.parse(value);
        } catch (e) {
          data[key] = value;
        }
      }
    });
  }
  return data;
};

const addAuditTransactionSettings = async (sequelize, instance, options, type) => {
  const loggedUser = httpContext.get('loggedUser') ? httpContext.get('loggedUser') : '';
  const transactionId = httpContext.get('transactionId') ? httpContext.get('transactionId') : '';
  const auditDescriptor = httpContext.get('auditDescriptor') ? httpContext.get('auditDescriptor') : '';
  const result = await sequelize.queryInterface.sequelize.query(
    `SELECT
      -- Type: ${type}
      set_config('audit.loggedUser', '${loggedUser}', TRUE) as "loggedUser",
      set_config('audit.transactionId', '${transactionId}', TRUE) as "transactionId",
      set_config('audit.auditDescriptor', '${auditDescriptor}', TRUE) as "auditDescriptor";`,
    { transaction: options.transaction },
  );
  console.log(JSON.stringify(result)); // eslint-disable-line no-console
};

const generateAuditModel = (sequelize, model) => {
  const auditModelName = `ZZAuditLog${model.name}`;
  const auditModel = class extends Model {};

  auditModel.init({
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: null,
      primaryKey: true,
      autoIncrement: true,
    },
    data_id: { type: DataTypes.INTEGER },
    dml_type: {
      type: DataTypes.ENUM(...dmlType),
      allowNull: false,
    },
    old_row_data: {
      type: DataTypes.JSON,
      allowNull: true,
      get: tryJsonParse,
    },
    new_row_data: {
      type: DataTypes.JSON,
      allowNull: true,
      get: tryJsonParse,
    },
    dml_timestamp: {
      allowNull: false,
      type: DataTypes.DATE,
    },
    dml_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      comment: null,
    },
    dml_txid: {
      type: DataTypes.UUID,
      allowNull: false,
      validate: { isUUID: 'all' },
    },
    descriptor_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
  }, {
    sequelize,
    modelName: auditModelName,
    createdAt: false,
    updatedAt: false,
  });

  model.addHook(
    'beforeBulkCreate',
    (instance, options) => addAuditTransactionSettings(sequelize, instance, options, 'beforeBulkCreate'),
  );
  model.addHook(
    'beforeBulkDestroy',
    (options) => addAuditTransactionSettings(sequelize, null, options, 'beforeBulkDestroy'),
  );
  model.addHook(
    'beforeBulkUpdate',
    (options) => addAuditTransactionSettings(sequelize, null, options, 'beforeBulkUpdate'),
  );
  model.addHook(
    'afterValidate',
    (instance, options) => addAuditTransactionSettings(sequelize, instance, options, 'afterValidate'),
  );
  model.addHook(
    'beforeCreate',
    (instance, options) => addAuditTransactionSettings(sequelize, instance, options, 'beforeCreate'),
  );
  model.addHook(
    'beforeDestroy',
    (instance, options) => addAuditTransactionSettings(sequelize, instance, options, 'beforeDestroy'),
  );
  model.addHook(
    'beforeUpdate',
    (instance, options) => addAuditTransactionSettings(sequelize, instance, options, 'beforeUpdate'),
  );
  model.addHook(
    'beforeSave',
    (instance, options) => addAuditTransactionSettings(sequelize, instance, options, 'beforeSave'),
  );
  model.addHook(
    'beforeUpsert',
    (created, options) => addAuditTransactionSettings(sequelize, created, options, 'beforeUpsert'),
  );

  return auditModel;
};

module.exports = { generateAuditModel };
