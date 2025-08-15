const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const { planTrip } = require('../controllers/tripController');

const router = express.Router();

/**
 * ולידציה לבקשת תכנון טיול
 * מוודאת שה־location הוא אובייקט תקין עם name, lat, lng
 * ושסוג הטיול tripType הוא ערך מותר ('hiking' או 'cycling')
 */
const planTripValidation = [
  body('location')
    .custom((value) => {
      if (
        typeof value !== 'object' ||
        !value.name ||
        typeof value.lat !== 'number' ||
        typeof value.lng !== 'number'
      ) {
        // במקרה שהפורמט של המיקום לא תקין – זורקים שגיאה שתיתפס ע"י express-validator
        throw new Error('Location must be a valid object with name, lat, and lng');
      }
      return true; // מעבר ולידציה בהצלחה
    }),
  body('tripType')
    .isIn(['hiking', 'cycling'])
    .withMessage('Trip type must be either hiking or cycling') // הודעת שגיאה מותאמת
];

/**
 * POST /api/trip/plan
 * מגן על המסלול (רק משתמשים מחוברים יכולים) ומפעיל ולידציה לפני קריאה ללוגיקת תכנון המסלול
 */
router.post('/plan', protect, planTripValidation, planTrip);

module.exports = router;
