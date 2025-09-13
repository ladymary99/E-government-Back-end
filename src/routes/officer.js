const express = require('express');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { User, Service, Request, Notification, AuditLog } = require('../models');
const { auth } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const router = express.Router();

router.use(auth);
router.use(authorize('officer'));

// Get officer dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const totalRequests = await Request.count();
    const pendingRequests = await Request.count({
      where: { status: ['submitted', 'under_review'] }
    });

    const pendingRequestsList = await Request.findAll({
      where: { status: ['submitted', 'under_review'] },
      include: [
        { model: User, as: 'user', attributes: ['name', 'email'] },
        { model: Service, as: 'service', attributes: ['name'] }
      ],
      limit: 10
    });

    res.json({
      success: true,
      data: { stats: { totalRequests, pendingRequests }, pendingRequestsList }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get requests
router.get('/requests', async (req, res) => {
  try {
    const { status } = req.query;
    const whereClause = status ? { status } : {};

    const requests = await Request.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'user', attributes: ['name', 'email'] },
        { model: Service, as: 'service', attributes: ['name'] }
      ],
      order: [['submitted_at', 'DESC']]
    });

    res.json({ success: true, data: { requests } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Process request decision
router.post('/requests/:id/decision', [
  body('decision').isIn(['approved', 'rejected']),
  body('remarks').optional().isString()
], async (req, res) => {
  try {
    const { decision, remarks } = req.body;
    const request = await Request.findByPk(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    await request.update({
      status: decision,
      remarks,
      reviewed_by: req.user.id,
      reviewed_at: new Date()
    });

    res.json({ success: true, message: Request ${decision} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;