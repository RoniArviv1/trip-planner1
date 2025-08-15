const express = require('express');
const { body } = require('express-validator'); // ספרייה לבדיקת ולידציה של נתוני בקשה
const { protect } = require('../middleware/auth'); // Middleware שמוודא שהמשתמש מחובר (JWT)
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword
} = require('../controllers/authController'); // פונקציות הבקרה (Controllers) עבור כל פעולה

const router = express.Router(); // יצירת Router של Express

// -------------------- Validation Middleware --------------------

// ולידציה לרישום משתמש חדש
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

// ולידציה להתחברות
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// ולידציה לעדכון פרופיל משתמש
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
  // הערה: השדה preferences הוסר מהוולידציה בהתאם לעדכון הדרישות
];

// ולידציה לשינוי סיסמה
const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
];

// -------------------- Routes --------------------

// רישום משתמש חדש
router.post('/register', registerValidation, register);

// התחברות
router.post('/login', loginValidation, login);

// קבלת פרטי המשתמש המחובר (דורש התחברות)
router.get('/me', protect, getMe);

// עדכון פרטי פרופיל (דורש התחברות)
router.put('/profile', protect, updateProfileValidation, updateProfile);

// שינוי סיסמה (דורש התחברות)
router.put('/password', protect, changePasswordValidation, changePassword);

module.exports = router;
