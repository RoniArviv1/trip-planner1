const express = require('express');
const { body } = require('express-validator'); // Request validation
const { protect } = require('../middleware/auth'); // Auth middleware (JWT)
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword
} = require('../controllers/authController'); // Controllers

const router = express.Router(); // Express router

// -------------------- Validation --------------------

// Register validation
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

// Login validation
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Update profile validation
const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email')
];

// Change password validation
const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
];

// -------------------- Routes --------------------

// Register
router.post('/register', registerValidation, register);

// Login
router.post('/login', loginValidation, login);

// Get current user (requires login)
router.get('/me', protect, getMe);

// Update profile (requires login)
router.put('/profile', protect, updateProfileValidation, updateProfile);

// Change password (requires login)
router.put('/password', protect, changePasswordValidation, changePassword);

module.exports = router;