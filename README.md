E-Government Citizen Services Portal (Backend)

A comprehensive, secure, and scalable backend system for a multi-role citizen services platform that enables citizens to apply for government services online, officers to process applications, and administrators to manage the system.

Features
Multi-Role Authentication & Authorization
Citizens: Apply for services, track applications, upload documents
Officers: Review and process applications, manage departmental workflows
Department Heads: Supervise services and staff within their department
Admins: System-wide management, reports, and user administration
Core Functionality
Service Management: Create and manage government services with dynamic forms
Request Processing: Complete workflow from submission to approval/rejection
Document Upload: Secure file handling with validation
Payment Integration: Track service fees and payment status
Notifications: Real-time updates for users
Audit Logging: Complete audit trail for all system actions
Reporting: Comprehensive reports and analytics
Security Features
JWT-based authentication with refresh tokens
Role-Based Access Control (RBAC)
Input validation and sanitization
Rate limiting and DDoS protection
Secure file upload handling
Database query protection
Tech Stack
Backend Framework: Node.js + Express.js
Database: PostgreSQL with Sequelize ORM
Authentication: JWT with bcrypt password hashing
File Upload: Multer with file type validation
Logging: Winston with Morgan middleware
API Documentation: Swagger/OpenAPI
Validation: Express-validator + Joi
Security: Helmet, CORS, Rate limiting
Prerequisites
Node.js (v18 or higher)
PostgreSQL (v13 or higher)
npm or yarn package manager
Quick Start

1. Clone and Install
   git clone <repository-url>

cd e-government-portal-backend

npm install 2. Environment Setup
Copy the environment template and configure your settings:

cp .env.example .env
Edit .env with your configuration:

# Server Configuration

PORT=3000
NODE_ENV=development

# Database Configuration

DB_HOST=localhost
DB_PORT=5432
DB_NAME=e_government_portal
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Admin User (for seeding)

ADMIN_EMAIL=admin@government.gov
ADMIN_PASSWORD=Admin123!
ADMIN_NAME=System Administrator 3. Database Setup
Create PostgreSQL database:

CREATE DATABASE e_government_portal;
Run migrations and seed data:

npm run migrate

npm run seed 4. Start the Server

# Development mode with auto-reload

npm run dev

# Production mode

npm start
The server will start on http://localhost:3000

📖 API Documentation
Once the server is running, access the interactive API documentation at: http://localhost:3000/api-docs
🎯 API Endpoints
Authentication (/api/v1/auth)
POST /register - Citizen registration
POST /login - User login
POST /logout - User logout
POST /refresh-token - Refresh access token
GET /me - Get current user
Citizen Portal (/api/v1/citizen)
GET /dashboard - Dashboard statistics
GET /services - Available services
POST /requests - Submit service request
GET /requests - Get user's requests
GET /requests/:id - Get specific request
POST /requests/:id/documents - Upload documents
GET /notifications - Get notifications
Officer Portal (/api/v1/officer)
GET /dashboard - Officer dashboard
GET /requests - Get requests for review
GET /requests/:id - Get request details
POST /requests/:id/decision - Approve/reject request
PUT /requests/:id/status - Update request status
GET /audit-logs - View audit logs
Admin Portal (/api/v1/admin)
GET /dashboard - Admin dashboard
GET /departments - Manage departments
POST /departments - Create department
GET /services - Manage services
POST /services - Create service
GET /users - Manage users
GET /reports - Generate reports
GET /requests/all - View all requests
🏗 Database Schema
Core Models
Users: Authentication and profile management
Departments: Government departments
Services: Available government services
Requests: Service applications with workflow
Documents: File attachments
Payments: Fee tracking
Notifications: User notifications
AuditLogs: System audit trail
🧪 Testing
Sample Credentials
After running the seed script, you can use these credentials:

Admin:

Email: admin@government.gov
Password: Admin123!
Officer:

Email: officer@example.com
Password: password123
Citizen:

Email: citizen@example.com
Password: password123
Running Tests

# Run all tests

npm test

# Run tests with coverage

npm run test:coverage

# Run tests in watch mode

npm run test:watch
📁 Project Structure
src/
├── config/ # Configuration files
│ ├── database.js # Database connection
│ └── swagger.js # API documentation
├── middleware/ # Express middleware
│ ├── auth.js # Authentication middleware
│ ├── rbac.js # Role-based access control
│ └── errorHandler.js
├── models/ # Database models
│ ├── User.js
│ ├── Department.js
│ ├── Service.js
│ ├── Request.js
│ └── ...
├── routes/ # API routes
│ ├── auth.js # Authentication routes
│ ├── citizen.js # Citizen portal routes
│ ├── officer.js # Officer portal routes
│ └── admin.js # Admin portal routes
├── utils/ # Utility functions
│ └── logger.js # Winston logger
└── views/ # EJS templates (for testing)
├── index.ejs
└── login.ejs

scripts/ # Database scripts
├── migrate.js # Database migration
└── seed.js # Sample data seeding
🔧 Development
Available Scripts
npm start - Start production server
npm run dev - Start development server with nodemon
npm run migrate - Run database migrations
npm run seed - Populate database with sample data
npm test - Run tests
npm run lint - Run ESLint
Adding New Services
Create service via Admin API or directly in database
Define required documents and form fields in JSONB format
Set processing fees and department assignment
Configure workflow rules as needed
Custom Form Fields
Services support dynamic form fields defined in JSON:

{

"form_fields": [

    {

      "name": "purpose",

      "type": "text",

      "label": "Purpose of Request",

      "required": true

    },

    {

      "name": "urgency",

      "type": "select",

      "label": "Urgency Level",

      "options": ["normal", "urgent"],

      "required": false

    }

]
}
🔐 Security Considerations
All passwords are hashed using bcrypt
JWT tokens have short expiry times with refresh token mechanism
Input validation on all endpoints
SQL injection protection via Sequelize ORM
File upload restrictions and validation
Rate limiting to prevent abuse
CORS protection
Security headers via Helmet
📊 Monitoring & Logging
Winston logger with multiple transports
Morgan HTTP request logging
Audit logging for all critical actions
Error tracking and reporting
Performance monitoring capabilities
🚀 Deployment
Environment Variables for Production
NODE_ENV=production
PORT=3000
DB_HOST=your-production-db-host
DB_NAME=your-production-db-name
DB_USER=your-production-db-user
DB_PASSWORD=your-production-db-password
JWT_SECRET=your-very-secure-jwt-secret
JWT_REFRESH_SECRET=your-very-secure-refresh-secret
Docker Deployment
A Dockerfile and docker-compose.yml can be added for containerized deployment.

🤝 Contributing
Fork the repository
Create a feature branch (git checkout -b feature/amazing-feature)
Commit your changes (git commit -m 'Add some amazing feature')
Push to the branch (git push origin feature/amazing-feature)
Open a Pull Request
📝 License
This project is licensed under the MIT License - see the LICENSE file for details.

🆘 Support
For support and questions:

Create an issue in the repository
Contact the development team
Check the API documentation at /api-docs
🗺 Roadmap
WebSocket support for real-time notifications
Email notification integration
Advanced reporting with charts
Mobile API optimizations
Integration with external payment gateways
Document verification workflows
Multi-language support
Advanced search and filtering
Data export capabilities
System health monitoring dashboard
