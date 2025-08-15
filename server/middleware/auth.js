const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware להגנה על ראוטים (מאמת שהמשתמש מחובר ובעל הרשאות)
const protect = async (req, res, next) => {
  let token;

  // בודקים אם יש Authorization Header בפורמט של Bearer Token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // שליפת הטוקן מהמחרוזת "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];

      // אימות הטוקן באמצעות המפתח הסודי (JWT_SECRET)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // שליפת המשתמש מהמסד ע"פ ה-ID שקודד בטוקן
      req.user = await User.findById(decoded.id).select('-password'); // ללא שדה הסיסמה

      // אם המשתמש לא נמצא – החזרת שגיאה
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      // אם החשבון לא פעיל – חסימה
      if (!req.user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated'
        });
      }

      // ממשיכים לראוט הבא
      next();
    } catch (error) {
      // טיפול בשגיאה בזמן אימות הטוקן (למשל טוקן פג תוקף או שגוי)
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  }

  // אם לא התקבל טוקן כלל – חסימה
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
};

// פונקציה ליצירת JWT חדש עבור משתמש
const generateToken = (id) => {
  // יוצרת טוקן עם ה-ID של המשתמש ותוקף ברירת מחדל של 7 ימים (או ערך מוגדר במשתנים)
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Middleware אופציונלי – בודק טוקן אם קיים, אך לא מחזיר שגיאה אם הוא חסר/לא תקין
const optionalAuth = async (req, res, next) => {
  let token;

  // בודקים אם יש Authorization Header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // שליפת הטוקן ואימותו
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // אם תקין – שמירת המשתמש בבקשה
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
    }
  }

  // תמיד ממשיכים הלאה, גם אם לא נמצא טוקן או שהוא לא תקין
  next();
};

module.exports = {
  protect,
  generateToken,
  optionalAuth
};
