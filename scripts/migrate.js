require("dotenv").config();
const { sequelize } = require("../src/models");
const logger = require("../src/utils/logger");

async function runMigrations() {
  try {
    logger.info("Starting database migration...");

    // Test connection
    await sequelize.authenticate();
    logger.info("Database connection established successfully.");

    // Sync all models (create tables)
    await sequelize.sync({ force: process.env.NODE_ENV === "development" });
    logger.info("Database tables created/updated successfully.");

    logger.info("Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    logger.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigrations();
