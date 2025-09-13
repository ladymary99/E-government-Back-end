const { sequelize } = require("../config/database");
const User = require("./User");
const Department = require("./Department");
const Service = require("./Service");
const Request = require("./Request");
const Document = require("./Document");
const Payment = require("./Payment");
const Notification = require("./Notification");
const AuditLog = require("./AuditLog");

// Define associations
// User associations
User.belongsTo(Department, {
  foreignKey: "department_id",
  as: "department",
});
Department.hasMany(User, {
  foreignKey: "department_id",
  as: "users",
});

// Service associations
Service.belongsTo(Department, {
  foreignKey: "department_id",
  as: "department",
});
Department.hasMany(Service, {
  foreignKey: "department_id",
  as: "services",
});

// Request associations
Request.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});
Request.belongsTo(Service, {
  foreignKey: "service_id",
  as: "service",
});
Request.belongsTo(User, {
  foreignKey: "reviewed_by",
  as: "reviewer",
});

User.hasMany(Request, {
  foreignKey: "user_id",
  as: "requests",
});
Service.hasMany(Request, {
  foreignKey: "service_id",
  as: "requests",
});

// Document associations
Document.belongsTo(Request, {
  foreignKey: "request_id",
  as: "request",
});
Request.hasMany(Document, {
  foreignKey: "request_id",
  as: "documents",
});

// Payment associations
Payment.belongsTo(Request, {
  foreignKey: "request_id",
  as: "request",
});
Request.hasOne(Payment, {
  foreignKey: "request_id",
  as: "payment",
});

// Notification associations
Notification.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});
User.hasMany(Notification, {
  foreignKey: "user_id",
  as: "notifications",
});

// Audit Log associations
AuditLog.belongsTo(User, {
  foreignKey: "actor_id",
  as: "actor",
});

module.exports = {
  sequelize,
  User,
  Department,
  Service,
  Request,
  Document,
  Payment,
  Notification,
  AuditLog,
};
