const User = require('../models/User');
const { generateToken } = require('../middleware/auth'); // פונקציה שמייצרת JWT
const { asyncHandler } = require('../middleware/errorHandler'); // עוטף פונקציות כדי לתפוס שגיאות ב-async/await
const { validationResult } = require('express-validator');

// רישום משתמש חדש – כולל ולידציה, בדיקת ייחודיות אימייל, שמירה והחזרת JWT
const register = asyncHandler(async (req, res) => {
  // בדיקת תוצאות ולידציה שהוגדרו בראוטר
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, email, password } = req.body;

  // בדיקה אם יש כבר משתמש עם אותו אימייל
  const userExists = await User.findByEmail(email);
  if (userExists) {
    return res.status(400).json({ success: false, message: 'User already exists with this email' });
  }

  // יצירת משתמש חדש במסד הנתונים
  const user = await User.create({ name, email, password });
  if (!user) {
    return res.status(400).json({ success: false, message: 'Invalid user data' });
  }

  // יצירת טוקן JWT להמשך אימות
  const token = generateToken(user._id);
  res.status(201).json({
    success: true,
    data: { user: user.getPublicProfile(), token }, // מחזירים פרופיל ציבורי בלבד
    message: 'User registered successfully'
  });
});

// התחברות משתמש – כולל בדיקת סיסמה, סטטוס משתמש, והחזרת טוקן
const login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password } = req.body;
  // טוען גם את השדה password לצורך השוואה
  const user = await User.findByEmail(email).select('+password');
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  // לא מאפשר התחברות אם החשבון לא פעיל
  if (!user.isActive) {
    return res.status(401).json({ success: false, message: 'Account is deactivated' });
  }

  // בדיקת התאמת הסיסמה
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  // עדכון תאריך ההתחברות האחרון
  user.lastLogin = new Date();
  await user.save();

  const token = generateToken(user._id);
  res.json({
    success: true,
    data: { user: user.getPublicProfile(), token },
    message: 'Login successful'
  });
});

// מחזיר את פרטי המשתמש המחובר (מבוסס על ה-user.id מהטוקן)
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ success: true, data: { user: user.getPublicProfile() } });
});

// עדכון פרופיל – מאפשר לשנות שם ואימייל בלבד, כולל בדיקה אם האימייל החדש פנוי
const updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (typeof name === 'string' && name.trim()) {
    user.name = name.trim();
  }

  if (typeof email === 'string' && email.trim()) {
    const existingUser = await User.findByEmail(email.trim());
    // מוודאים שלא מחליפים לאימייל שכבר שייך למישהו אחר
    if (existingUser && existingUser._id.toString() !== req.user.id) {
      return res.status(400).json({ success: false, message: 'Email is already taken' });
    }
    user.email = email.trim();
  }

  const updatedUser = await user.save();
  res.json({
    success: true,
    data: { user: updatedUser.getPublicProfile() },
    message: 'Profile updated successfully'
  });
});

// שינוי סיסמה – דורש את הסיסמה הנוכחית לבדיקה
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // טוען גם את הסיסמה מהמסד לצורך השוואה
  const user = await User.findById(req.user.id).select('+password');
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  // בודק שהסיסמה הנוכחית נכונה
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect' });
  }

  // שומר את הסיסמה החדשה
  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: 'Password changed successfully' });
});

module.exports = { register, login, getMe, updateProfile, changePassword };
