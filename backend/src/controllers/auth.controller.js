const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User.model');
const { success, error } = require('../utils/apiResponse');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return error(res, 'Validation failed', 400, errors.array());

    const { name, email, password, phone, role } = req.body;
    const allowedRoles = ['customer', 'shop_owner'];
    const userRole = allowedRoles.includes(role) ? role : 'customer';

    const existing = await User.findOne({ email });
    if (existing) return error(res, 'Email already registered', 409);

    const user = await User.create({ name, email, password, phone, role: userRole });
    const token = signToken(user._id);

    return success(res, { user, token }, 'Account created successfully', 201);
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return error(res, 'Validation failed', 400, errors.array());

    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return error(res, 'Invalid email or password', 401);
    }

    if (!user.isActive) return error(res, 'Account is deactivated', 403);

    const token = signToken(user._id);
    user.password = undefined;

    return success(res, { user, token }, 'Login successful');
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res) => {
  return success(res, { user: req.user }, 'Profile fetched');
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, address },
      { new: true, runValidators: true }
    );
    return success(res, { user }, 'Profile updated');
  } catch (err) {
    next(err);
  }
};
