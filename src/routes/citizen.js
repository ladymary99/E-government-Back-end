const express = require('express');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { User, Service, Request, Document, Payment, Notification, Department } = require('../models');
const { auth } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/documents');
  },
  filename: (req, file, cb) => {
    cb(null, ${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)});
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Apply auth and citizen role to all routes
router.use(auth);
router.use(authorize('citizen'));

// @route   GET /api/v1/citizen/dashboard
// @desc    Get citizen dashboard data
// @access  Private (Citizen)
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's requests with counts
    const [totalRequests, pendingRequests, approvedRequests, rejectedRequests] = await Promise.all([
      Request.count({ where: { user_id: userId } }),
      Request.count({ where: { user_id: userId, status: ['submitted', 'under_review'] } }),
      Request.count({ where: { user_id: userId, status: 'approved' } }),
      Request.count({ where: { user_id: userId, status: 'rejected' } })
    ]);

    // Get recent requests
    const recentRequests = await Request.findAll({
      where: { user_id: userId },
      include: [
        { model: Service, as: 'service', attributes: ['name', 'fee'] },
        { model: User, as: 'reviewer', attributes: ['name'] }
      ],
      order: [['submitted_at', 'DESC']],
      limit: 5
    });

    // Get unread notifications
    const unreadNotifications = await Notification.count({
      where: { user_id: userId, is_read: false }
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalRequests,
          pendingRequests,
          approvedRequests,
          rejectedRequests,
          unreadNotifications
        },
        recentRequests
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/v1/citizen/services
// @desc    Get all available services
// @access  Private (Citizen)
router.get('/services', async (req, res) => {
  try {
    const { department_id, search } = req.query;

    const whereClause = { is_active: true };
    if (department_id) whereClause.department_id = department_id;
    if (search) whereClause.name = { [Op.iLike]: %${search}% };

    const services = await Service.findAll({
      where: whereClause,
      include: [
        { model: Department, as: 'department', attributes: ['name'] }
      ],
      order: [['name', 'ASC']]
    });

    const departments = await Department.findAll({
      where: { is_active: true },
      attributes: ['id', 'name'],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: { services, departments }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});// @route   POST /api/v1/citizen/requests
// @desc    Submit a new service request
// @access  Private (Citizen)
router.post('/requests', [
  body('service_id').isUUID().withMessage('Valid service ID required'),
  body('form_data').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { service_id, form_data } = req.body;

    // Check if service exists and is active
    const service = await Service.findOne({
      where: { id: service_id, is_active: true }
    });

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // Create request
    const request = await Request.create({
      user_id: req.user.id,
      service_id,
      form_data: form_data || {},
      status: 'submitted'
    });

    // Create payment record if service has a fee
    if (service.fee > 0) {
      await Payment.create({
        request_id: request.id,
        amount: service.fee,
        status: 'pending'
      });
    }

    // Create notification
    await Notification.create({
      user_id: req.user.id,
      title: 'Request Submitted',
      message: Your request for ${service.name} has been submitted successfully.,
      type: 'success'
    });

    res.status(201).json({
      success: true,
      message: 'Request submitted successfully',
      data: { request }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/v1/citizen/requests
// @desc    Get user's requests
// @access  Private (Citizen)
router.get('/requests', async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { user_id: req.user.id };
    if (status) whereClause.status = status;

    const { rows: requests, count } = await Request.findAndCountAll({
      where: whereClause,
      include: [
        { model: Service, as: 'service', attributes: ['name', 'fee'] },
        { model: User, as: 'reviewer', attributes: ['name'] },
        { model: Payment, as: 'payment', attributes: ['amount', 'status'] }
      ],
      order: [['submitted_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        requests,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/v1/citizen/requests/:id
// @desc    Get specific request details
// @access  Private (Citizen)
router.get('/requests/:id', async (req, res) => {
  try {
    const request = await Request.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      include: [
        { model: Service, as: 'service' },
        { model: User, as: 'reviewer', attributes: ['name'] },
        { model: Document, as: 'documents' },
        { model: Payment, as: 'payment' }
      ]
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    res.json({ success: true, data: { request } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/v1/citizen/requests/:id/documents
// @desc    Upload documents for a request
// @access  Private (Citizen)
router.post('/requests/:id/documents', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Check if request belongs to user
    const request = await Request.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }// Create document record
    const document = await Document.create({
      request_id: request.id,
      file_name: req.file.originalname,
      file_type: req.file.mimetype.includes('pdf') ? 'pdf' : 'image',
      file_path: req.file.path,
      file_size: req.file.size,
      mime_type: req.file.mimetype
    });

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: { document }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/v1/citizen/notifications
// @desc    Get user notifications
// @access  Private (Citizen)
router.get('/notifications', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { rows: notifications, count } = await Notification.findAndCountAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/v1/citizen/notifications/:id/read
// @desc    Mark notification as read
// @access  Private (Citizen)
router.put('/notifications/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    await notification.update({ is_read: true, read_at: new Date() });

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;