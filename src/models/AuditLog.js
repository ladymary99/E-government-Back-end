const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const AuditLog = sequelize.define(
  "AuditLog",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    actor_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "User",
        key: "id",
      },
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Action performed (e.g., APPROVED_REQUEST, CREATED_USER)",
    },
    target_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: "ID of the target resource",
    },
    target_type: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Type of target resource (e.g., request, user, service)",
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      comment: "Additional context about the action",
    },
    ip_address: {
      type: DataTypes.INET,
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "audit_logs",
    updatedAt: false, // Audit logs should not be updated
    scopes: {
      byActor: (actorId) => ({
        where: { actor_id: actorId },
      }),
      byAction: (action) => ({
        where: { action },
      }),
      byTarget: (targetId, targetType) => ({
        where: { target_id: targetId, target_type: targetType },
      }),
    },
  }
);

module.exports = AuditLog;
