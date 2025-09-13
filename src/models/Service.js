const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Service = sequelize.define(
  "Service",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 200],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    fee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
      validate: {
        min: 0,
      },
    },
    department_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Department",
        key: "id",
      },
    },
    required_documents: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    processing_time: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Expected processing time (e.g., "3-5 business days")',
    },
    form_fields: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: "Dynamic form fields configuration",
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "services",
    scopes: {
      active: {
        where: {
          is_active: true,
        },
      },
    },
  }
);

module.exports = Service;
