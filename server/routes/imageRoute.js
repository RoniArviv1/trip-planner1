// routes/image.js
const express = require('express');
const router = express.Router();
const { getImageByLocation } = require('../controllers/imageController');

/**
 * GET /api/image
 * נקודת קצה לקבלת תמונה לפי מיקום
 * המיקום נשלח כפרמטר בשורת השאילתה (query string)
 * דוגמה: /api/image?location=Berlin
 * 
 * התפקיד של הבקר (getImageByLocation):
 *  - לקרוא את שם המיקום מה-Query
 *  - לשלוף או ליצור תמונה רלוונטית ממקור חיצוני (API/מאגר פנימי)
 *  - להחזיר ללקוח נתוני תמונה בפורמט JSON
 */
router.get('/', getImageByLocation);

module.exports = router;
