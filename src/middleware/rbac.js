const logger = require('../utils/logger');

// Role hierarchy: admin > department_head > officer > citizen
const roleHierarchy = {
  'admin': 4,
  'department_head': 3,
  'officer': 2,
  'citizen': 1
};

// Check if user has required role or higher
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const userRole = req.user.role;
      const userRoleLevel = roleHierarchy[userRole] || 0;

      // Check if user has any of the allowed roles
      const hasPermission = allowedRoles.some(role => {
        const requiredLevel = roleHierarchy[role] || 0;
        return userRoleLevel >= requiredLevel;
      });

      if (!hasPermission) {
        logger.warn(Access denied for user ${req.user.id} with role ${userRole} to access ${req.originalUrl});
        return res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient permissions.'
        });
      }

      next();
    } catch (error) {
      logger.error('Authorization middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization error'
      });
    }
  };
};

// Check if user can access specific department resources
const checkDepartmentAccess = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    const userDepartmentId = req.user.department_id;

    // Admins can access all departments
    if (userRole === 'admin') {
      return next();
    }

    // Department heads and officers can only access their own department
    if ((userRole === 'department_head' || userRole === 'officer') && userDepartmentId) {
      // If accessing department-specific resource, check department ID
      const requestedDepartmentId = req.params.departmentId  req.body.department_id  req.query.department_id;

      if (requestedDepartmentId && requestedDepartmentId !== userDepartmentId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your department resources.'
        });
      }
    }

    next();
  } catch (error) {
    logger.error('Department access check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Access control error'
    });
  }
};

// Check if user can access their own resources or has admin privileges
const checkResourceOwnership = (resourceUserIdField = 'user_id') => {
  return (req, res, next) => {
    try {
      const userRole = req.user.role;
      const userId = req.user.id;

      // Admins can access all resources
      if (userRole === 'admin') {
        return next();
      }

      // Check if user is accessing their own resource
      const resourceUserId = req.params[resourceUserIdField] ||
                           req.body[resourceUserIdField] ||
                           req.query[resourceUserIdField] ||
                           req.resource?.[resourceUserIdField]; // For cases where resource is already loaded

      if (resourceUserId && resourceUserId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your own resources.'
        });
      }

      next();
    } catch (error) {
      logger.error('Resource ownership check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Access control error'
      });
    }
  };
};

module.exports = {
  authorize,
  checkDepartmentAccess,
  checkResourceOwnership,
  roleHierarchy
};