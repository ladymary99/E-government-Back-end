const express = require("express");
const { body, validationResult } = require("express-validator");
const { Op } = require("sequelize");
const {
  sequelize,
  User,
  Department,
  Service,
  Request,
  Payment,
  AuditLog,
} = require("../models");
const { auth } = require("../middleware/auth");
const { authorize } = require("../middleware/rbac");

const router = express.Router();

router.use(auth);
router.use(authorize("admin"));

// Dashboard
router.get("/dashboard", async (req, res) => {
  try {
    const [totalUsers, totalDepartments, totalServices, totalRequests] =
      await Promise.all([
        User.count({ where: { is_active: true } }),
        Department.count({ where: { is_active: true } }),
        Service.count({ where: { is_active: true } }),
        Request.count(),
      ]);

    const recentRequests = await Request.findAll({
      include: [
        { model: User, as: "user", attributes: ["name", "email"] },
        { model: Service, as: "service", attributes: ["name"] },
      ],
      order: [["submitted_at", "DESC"]],
      limit: 10,
    });

    res.json({
      success: true,
      data: {
        stats: { totalUsers, totalDepartments, totalServices, totalRequests },
        recentRequests,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Departments CRUD
router.get("/departments", async (req, res) => {
  try {
    const departments = await Department.findAll({
      include: [
        { model: User, as: "users", attributes: ["id", "name", "role"] },
        { model: Service, as: "services", attributes: ["id", "name"] },
      ],
    });
    res.json({ success: true, data: { departments } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post(
  "/departments",
  [
    body("name").notEmpty().isLength({ min: 2, max: 100 }),
    body("description").optional().isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const department = await Department.create(req.body);
      res.status(201).json({ success: true, data: { department } });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

router.put("/departments/:id", async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);
    if (!department) {
      return res
        .status(404)
        .json({ success: false, message: "Department not found" });
    }

    await department.update(req.body);
    res.json({ success: true, data: { department } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Services CRUD
router.get("/services", async (req, res) => {
  try {
    const services = await Service.findAll({
      include: [{ model: Department, as: "department", attributes: ["name"] }],
    });
    res.json({ success: true, data: { services } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post(
  "/services",
  [
    body("name").notEmpty().isLength({ min: 2, max: 200 }),
    body("description").notEmpty(),
    body("fee").isNumeric().withMessage("Fee must be numeric"),
    body("department_id").isUUID().withMessage("Valid department ID required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const service = await Service.create(req.body);
      res.status(201).json({ success: true, data: { service } });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Users management
router.get("/users", async (req, res) => {
  try {
    const { role, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { is_active: true };
    if (role) whereClause.role = role;
    const { rows: users, count } = await User.findAndCountAll({
      where: whereClause,
      include: [{ model: Department, as: "department", attributes: ["name"] }],
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.put("/users/:id", async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    await user.update(req.body);
    res.json({ success: true, data: { user: user.toJSON() } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Reports
router.get("/reports", async (req, res) => {
  try {
    const { type = "overview" } = req.query;

    if (type === "overview") {
      const [requestsByDepartment, requestsByStatus, monthlyRevenue] =
        await Promise.all([
          sequelize.query(
            `
          SELECT d.name as department, COUNT(r.id) as request_count
          FROM departments d
          LEFT JOIN services s ON d.id = s.department_id
          LEFT JOIN requests r ON s.id = r.service_id
          WHERE d.is_active = true
          GROUP BY d.id, d.name
          ORDER BY request_count DESC
        `,
            { type: sequelize.QueryTypes.SELECT }
          ),

          Request.findAll({
            attributes: ["status", [sequelize.fn("COUNT", "id"), "count"]],
            group: ["status"],
          }),

          Payment.findAll({
            attributes: [
              [
                sequelize.fn(
                  "DATE_TRUNC",
                  "month",
                  sequelize.col("payment_date")
                ),
                "month",
              ],
              [sequelize.fn("SUM", sequelize.col("amount")), "total"],
            ],
            where: { status: "paid" },
            group: [
              sequelize.fn(
                "DATE_TRUNC",
                "month",
                sequelize.col("payment_date")
              ),
            ],
            order: [
              [
                sequelize.fn(
                  "DATE_TRUNC",
                  "month",
                  sequelize.col("payment_date")
                ),
                "DESC",
              ],
            ],
          }),
        ]);

      res.json({
        success: true,
        data: { requestsByDepartment, requestsByStatus, monthlyRevenue },
      });
    } else {
      res.status(400).json({ success: false, message: "Invalid report type" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// All requests (for admin oversight)
router.get("/requests/all", async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { rows: requests, count } = await Request.findAndCountAll({
      include: [
        { model: User, as: "user", attributes: ["name", "email"] },
        {
          model: Service,
          as: "service",
          include: [{ model: Department, as: "department" }],
        },
        { model: User, as: "reviewer", attributes: ["name"] },
      ],
      order: [["submitted_at", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      data: {
        requests,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
