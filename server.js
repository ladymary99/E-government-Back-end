require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const rateLimit = require('express-rate-limit');

// Import custom modules
const { sequelize, isDemoMode } = require('./src/config/database');
const logger = require('./src/utils/logger');
const errorHandler = require('./src/middleware/errorHandler');

// Import routes
const authRoutes = require('./src/routes/auth');
const citizenRoutes = require('./src/routes/citizen');
const officerRoutes = require('./src/routes/officer');
const adminRoutes = require('./src/routes/admin');

const app = express();
const PORT = process.env.PORT  3000;

// Rate limiting
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW  15) * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX  100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL  'http://localhost:3001',
  credentials: true
}));
app.use(limiter);
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Set EJS as template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

// Basic routes
app.get('/', (req, res) => {
  res.render('index', {
    title: 'E-Government Portal',
    message: 'Welcome to the E-Government Citizen Services Portal'
  });
});

// Login pages for different portals
app.get('/citizen/login', (req, res) => {
  res.render('citizen/login');
});

app.get('/officer/login', (req, res) => {
  res.render('officer/login');
});

app.get('/admin/login', (req, res) => {
  res.render('admin/login');
});

// Simple dashboard redirects (for testing)
app.get('/citizen/dashboard', (req, res) => {
  res.json({ message: 'Citizen Dashboard - Use API endpoints for full functionality' });
});

app.get('/officer/dashboard', (req, res) => {
  res.json({ message: 'Officer Dashboard - Use API endpoints for full functionality' });
});

app.get('/admin/dashboard', (req, res) => {
  res.json({ message: 'Admin Dashboard - Use API endpoints for full functionality' });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/citizen', citizenRoutes);
app.use('/api/v1/officer', officerRoutes);
app.use('/api/v1/admin', adminRoutes);

// API Documentation
if (process.env.NODE_ENV !== 'production') {
  const swaggerUi = require('swagger-ui-express');
  const swaggerSpec = require('./src/config/swagger');
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Database connection and server startup
async function startServer() {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');

    // Sync database models
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('Database models synchronized.');
    }

    app.listen(PORT, '0.0.0.0', () => {
      logger.info(Server is running on port ${PORT});
      logger.info(Environment: ${process.env.NODE_ENV});
      if (process.env.NODE_ENV !== 'production') {
        logger.info(API Documentation: http://localhost:${PORT}/api-docs);
      }
    });
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT. Graceful shutdown...');
  await sequelize.close();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM. Graceful shutdown...');
  await sequelize.close();
  process.exit(0);
});

startServer();