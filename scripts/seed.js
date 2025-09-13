require('dotenv').config();
const { User, Department, Service, Request, Payment, Notification } = require('../src/models');
const logger = require('../src/utils/logger');

async function seedDatabase() {
  try {
    logger.info('Starting database seeding...');

    // Create Departments
    const departments = await Department.bulkCreate([
      {
        name: 'Ministry of Health',
        description: 'Healthcare services and medical certificates'
      },
      {
        name: 'Ministry of Education',
        description: 'Educational services and document verification'
      },
      {
        name: 'Ministry of Interior',
        description: 'Civil status and identification services'
      },
      {
        name: 'Ministry of Transportation',
        description: 'Vehicle registration and driving licenses'
      }
    ]);

    logger.info(Created ${departments.length} departments);

    // Create Admin User
    const adminUser = await User.create({
      name: 'System Administrator',
      email: process.env.ADMIN_EMAIL || 'admin@government.gov',
      password: process.env.ADMIN_PASSWORD || 'Admin123!',
      role: 'admin',
      is_active: true
    });

    // Create Department Heads
    const departmentHeads = await User.bulkCreate([
      {
        name: 'Dr. Sarah Johnson',
        email: 'head.health@government.gov',
        password: 'password123',
        role: 'department_head',
        department_id: departments[0].id
      },
      {
        name: 'Prof. Michael Brown',
        email: 'head.education@government.gov',
        password: 'password123',
        role: 'department_head',
        department_id: departments[1].id
      }
    ]);

    // Create Officers
    const officers = await User.bulkCreate([
      {
        name: 'John Smith',
        email: 'officer@example.com',
        password: 'password123',
        role: 'officer',
        department_id: departments[0].id
      },
      {
        name: 'Mary Wilson',
        email: 'officer.education@government.gov',
        password: 'password123',
        role: 'officer',
        department_id: departments[1].id
      },
      {
        name: 'David Lee',
        email: 'officer.interior@government.gov',
        password: 'password123',
        role: 'officer',
        department_id: departments[2].id
      }
    ]);

    // Create Sample Citizens
    const citizens = await User.bulkCreate([
      {
        name: 'Alice Johnson',
        email: 'citizen@example.com',
        password: 'password123',
        role: 'citizen',
        national_id: '1234567890',
        dob: '1990-05-15',
        contact_info: {
          phone: '+1234567890',
          address: '123 Main Street, City'
        }
      },
      {
        name: 'Bob Smith',
        email: 'bob.smith@email.com',
        password: 'password123',
        role: 'citizen',
        national_id: '0987654321',
        dob: '1985-10-22',
        contact_info: {
          phone: '+1987654321',
          address: '456 Oak Avenue, City'
        }
      }
    ]);

;logger.info(Created ${departmentHeads.length + officers.length + citizens.length + 1} users);

    // Create Services
    const services = await Service.bulkCreate([
      {
        name: 'Medical Certificate',
        description: 'Official medical certificate for employment or legal purposes',
        fee: 25.00,
        department_id: departments[0].id,
        processing_time: '2-3 business days',
        required_documents: ['ID Copy', 'Medical Report'],
        form_fields: [
          { name: 'purpose', type: 'text', label: 'Purpose of Certificate', required: true },
          { name: 'doctor_name', type: 'text', label: 'Attending Doctor', required: false }
        ]
      },
      {
        name: 'Health Insurance Registration',
        description: 'Register for national health insurance program',
        fee: 0.00,
        department_id: departments[0].id,
        processing_time: '5-7 business days',
        required_documents: ['ID Copy', 'Income Statement'],
        form_fields: [
          { name: 'employment_status', type: 'select', label: 'Employment Status', required: true },
          { name: 'dependents', type: 'number', label: 'Number of Dependents', required: true }
        ]
      },
      {
        name: 'Academic Transcript',
        description: 'Official academic transcript and grade report',
        fee: 15.00,
        department_id: departments[1].id,
        processing_time: '3-5 business days',
        required_documents: ['ID Copy', 'Student ID'],
        form_fields: [
          { name: 'institution', type: 'text', label: 'Educational Institution', required: true },
          { name: 'graduation_year', type: 'number', label: 'Graduation Year', required: true }
        ]
      },
      {
        name: 'Birth Certificate',
        description: 'Official birth certificate for legal documentation',
        fee: 20.00,
        department_id: departments[2].id,
        processing_time: '1-2 business days',
        required_documents: ['ID Copy', 'Hospital Birth Record'],
        form_fields: [
          { name: 'birth_place', type: 'text', label: 'Place of Birth', required: true },
          { name: 'parents_names', type: 'text', label: 'Parents Full Names', required: true }
        ]
      },
      {
        name: 'Driving License Renewal',
        description: 'Renew expired or expiring driving license',
        fee: 50.00,
        department_id: departments[3].id,
        processing_time: '1 business day',
        required_documents: ['Current License', 'ID Copy', 'Medical Certificate'],
        form_fields: [
          { name: 'license_type', type: 'select', label: 'License Type', required: true },
          { name: 'violations', type: 'checkbox', label: 'Any Recent Violations?', required: false }
        ]
      }
    ]);

    logger.info(Created ${services.length} services);// Create Sample Requests
    const requests = await Request.bulkCreate([
      {
        user_id: citizens[0].id,
        service_id: services[0].id,
        status: 'submitted',
        form_data: {
          purpose: 'Employment verification',
          doctor_name: 'Dr. Smith'
        }
      },
      {
        user_id: citizens[1].id,
        service_id: services[2].id,
        status: 'under_review',
        form_data: {
          institution: 'State University',
          graduation_year: 2020
        },
        reviewed_by: officers[1].id
      },
      {
        user_id: citizens[0].id,
        service_id: services[3].id,
        status: 'approved',
        form_data: {
          birth_place: 'City Hospital',
          parents_names: 'John Johnson and Mary Johnson'
        },
        reviewed_by: officers[2].id,
        reviewed_at: new Date(),
        remarks: 'All documents verified. Certificate approved.'
      }
    ]);

    logger.info(Created ${requests.length} sample requests);

    // Create Payments for paid services
    const payments = [];
    for (const request of requests) {
      const service = services.find(s => s.id === request.service_id);
      if (service && service.fee > 0) {
        payments.push({
          request_id: request.id,
          amount: service.fee,
          status: request.status === 'approved' ? 'paid' : 'pending',
          payment_date: request.status === 'approved' ? new Date() : null
        });
      }
    }

    if (payments.length > 0) {
      await Payment.bulkCreate(payments);
      logger.info(Created ${payments.length} payment records);
    }

    // Create Sample Notifications
    const notifications = await Notification.bulkCreate([
      {
        user_id: citizens[0].id,
        title: 'Welcome to E-Government Portal',
        message: 'Your account has been created successfully. You can now apply for government services online.',
        type: 'info'
      },
      {
        user_id: citizens[0].id,
        title: 'Birth Certificate Approved',
        message: 'Your birth certificate request has been approved. You can collect it from the office.',
        type: 'success'
      },
      {
        user_id: citizens[1].id,
        title: 'Document Under Review',
        message: 'Your academic transcript request is currently under review by our officers.',
        type: 'info'
      }
    ]);

    logger.info(Created ${notifications.length} notifications);

    logger.info('Database seeding completed successfully!');
    logger.info('Sample credentials:');
    logger.info('Admin: admin@government.gov / Admin123!');
    logger.info('Officer: officer@example.com / password123');
    logger.info('Citizen: citizen@example.com / password123');

  } catch (error) {
    logger.error('Seeding failed:', error);
    throw error;
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(error => {
      logger.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedDatabase