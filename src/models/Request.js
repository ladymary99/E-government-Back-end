const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Request = sequelize.define('Request', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'User',
      key: 'id'
    }
  },
  service_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Service',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('submitted', 'under_review', 'approved', 'rejected', 'completed'),
    allowNull: false,
    defaultValue: 'submitted'
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  form_data: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  reviewed_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'User',
      key: 'id'
    }
  },
  submitted_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  reviewed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  reference_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  }
}, {
  tableName: 'requests',
  hooks: {
    beforeCreate: async (request) => {
      const timestamp = Date.now().toString().slice(-8);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      request.reference_number = REQ-${timestamp}-${random};
    }
  }
});

module.exports = Request;