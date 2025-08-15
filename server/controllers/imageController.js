// controllers/imageController.js
const axios = require('axios');

// פונקציה "שירותית" פנימית: מביאה תמונה לפי שם מיקום מ־Unsplash עם fallback מובנה
async function fetchImageByLocation(location) {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;

  // אם אין מפתח – מחזירים תמונת ברירת מחדל במקום להיכשל
  console.warn('UNSPLASH_ACCESS_KEY not set – using fallback image');
  if (!accessKey) {
    return {
      url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      alt: `${location} landscape (fallback)`
    };
  }

  try {
    // חיפוש ממוקד: תמונה אופקית אחת רלוונטית למיקום
    const { data } = await axios.get('https://api.unsplash.com/search/photos', {
      params: { query: location, orientation: 'landscape', per_page: 1 },
      headers: { Authorization: `Client-ID ${accessKey}` },
      timeout: 15000 // מונע תלייה במקרה של רשת איטית
    });

    // בחירה בטוחה של התוצאה הראשונה, עם שדות אלטרנטיביים לתיאור/כתובת
    const img = data?.results?.[0];
    if (img) {
      return {
        url: img.urls?.regular || img.urls?.small,
        alt: img.alt_description || `${location} view`,
        credit: img.user?.name,
        source: img.links?.html
      };
    }
  } catch (err) {
  }

  // fallback במקרה שאין תוצאות/שגיאה – שומר UX עקבי
  return {
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    alt: `${location} landscape (fallback)`
  };
}

// קונטרולר לנקודת קצה GET /api/image?location=... – ולידציה בסיסית + שימוש בשירות
async function getImageByLocation(req, res) {
  try {
    const { location } = req.query;
    if (!location) {
      return res.status(400).json({ success: false, message: 'Location is required' });
    }
    const image = await fetchImageByLocation(location);
    return res.json({ success: true, image });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch image' });
  }
}

module.exports = { getImageByLocation, fetchImageByLocation };
