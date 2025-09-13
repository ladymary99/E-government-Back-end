const logger = require('../utils/logger');
const { ValidationError, UniqueConstraintError, ForeignKeyConstraintError } = require('sequelize');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error(${req.method} ${req.originalUrl} - ${err.message}, {
    error: err.stack,
    user: req.user?.id,
    ip: req.ip
  });

  // Sequelize Validation Error
  if (err instanceof ValidationError) {
    const message = err.errors.map(error => error.message).join(', ');
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message,
      details: err.errors
    });
  }

  // Sequelize Unique Constraint Error
  if (err instanceof UniqueConstraintError) {
    const field = err.errors[0]?.path || 'field';
    return res.status(400).json({
      success: false,
      error: 'Duplicate Entry',
      message: ${field} already exists
    });
  }

  // Sequelize Foreign Key Constraint Error
  if (err instanceof ForeignKeyConstraintError) {
    return res.status(400).json({
      success: false,
      error: 'Invalid Reference',
      message: 'Referenced resource does not exist'
    });
  }

  // JWT Error
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid Token',
      message: 'Please log in again'
    });
  }

  // JWT Expired Error
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token Expired',
      message: 'Please log in again'
    });
  }

  // Multer Error (File Upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: 'File Too Large',
      message: 'File size exceeds limit'
    });
  }

  // Default error
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.name || 'Server Error',
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;