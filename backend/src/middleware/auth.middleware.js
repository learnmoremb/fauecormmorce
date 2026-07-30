const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { error } = require('../utils/apiResponse');

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Not authorized, no token', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return error(res, 'User not found', 401);
    next();
  } catch {
    return error(res, 'Not authorized, token invalid', 401);
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return error(res, 'Access denied: insufficient permissions', 403);
  }
  next();
};

module.exports = { protect, requireRole };
