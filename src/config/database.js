const { Sequelize } = require("sequelize");
const logger = require("../utils/logger");

// Check if we're in demo mode (no real database)
const isDemoMode = process.env.DEMO_MODE === "true" || !process.env.DB_HOST;

let sequelize;

if (isDemoMode) {
  // Use SQLite in memory for demo
  sequelize = new Sequelize("sqlite::memory:", {
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
      paranoid: true,
      freezeTableName: true,
    },
  });
  logger.info("Running in demo mode with in-memory SQLite database");
} else {
  // Use PostgreSQL for production
  sequelize = new Sequelize({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || "e_government_portal",
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "password",
    dialect: "postgres",
    logging:
      process.env.NODE_ENV === "development"
        ? (msg) => logger.debug(msg)
        : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
      paranoid: true,
      freezeTableName: true,
    },
  });
}

module.exports = { sequelize, isDemoMode };
