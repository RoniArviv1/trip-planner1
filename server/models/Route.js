const mongoose = require('mongoose');

// מודל Route – מייצג מסלול טיול של משתמש
const routeSchema = new mongoose.Schema({
  // שיוך המסלול למשתמש יוצרו
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // שם המסלול עם חיתוך רווחים ומגבלת אורך
  name: {
    type: String,
    required: [true, 'Route name is required'],
    trim: true,
    maxlength: [100, 'Route name cannot be more than 100 characters']
  },

  // תיאור חופשי קצר
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },

  // סוג הטיול מוגבל לערכים ידועים
  tripType: {
    type: String,
    enum: ['hiking', 'cycling'],
    required: [true, 'Trip type is required']
  },

  // נתוני מיקום בסיסיים + קואורדינטות לתחילת המסלול
  location: {
    country: { type: String, required: true, trim: true },
    region: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    }
  },

  // נתוני המסלול המחושבים/המנורמלים להצגה ומפות
  routeData: {
    // גאומטריה בפורמט GeoJSON LineString (רשימת נקודות [lng, lat])
    geometry: {
      type: { type: String, enum: ['LineString'] },
      coordinates: { type: [[Number]] }
    },

    // מרכז גאוגרפי לתצוגת מפה (לא חובה – מתקבל גם מהנירמול)
    center: { type: [Number], default: undefined },

    // נקודות מפורטות לפי סדר והשתייכות ליום
    points: [{
      lat: Number,
      lng: Number,
      day: Number,
      order: Number
    }],

    // חלוקה למסלולי משנה לפי ימים, כולל סטטיסטיקות לכל יום
    dailyRoutes: [{
      day: Number,
      distance: Number, // ק"מ
      duration: Number, // שעות
      points: [{ lat: Number, lng: Number, order: Number }]
    }],

    // סיכומי מסלול כוללים לתצוגות מהירות
    totalDistance: { type: Number, required: true, min: 0 }, // ק"מ
    totalDuration: { type: Number, required: true, min: 0 }  // שעות
  },

  // תמונת המחשה (אופציונלי)
  image: { url: String, alt: String },

  // תגים חופשיים למיון/חיפוש
  tags: [{ type: String, trim: true }],

  // דירוג משתמש אופציונלי
  rating: { type: Number, min: 1, max: 5, default: null },

  // הערות חופשיות של המשתמש
  notes: { type: String, trim: true, maxlength: [1000, 'Notes cannot be more than 1000 characters'] }
}, { timestamps: true }); // יוצר createdAt ו-updatedAt אוטומטית

// אינדקסים לשאילתות שכיחות וביצועים טובים
routeSchema.index({ user: 1, createdAt: -1 });
routeSchema.index({ tripType: 1 });
routeSchema.index({ 'location.country': 1, 'location.city': 1 });
// אינדקס מרחבי על הגאומטריה לשימוש עתידי (חיפושים/מרחקים)
routeSchema.index({ 'routeData.geometry': '2dsphere' });

// שדות מחושבים לתצוגה – לא נשמרים במסד הנתונים
routeSchema.virtual('formattedDistance').get(function () {
  const km = this.routeData?.totalDistance || 0;
  return `${km.toFixed(1)} km`;
});

routeSchema.virtual('formattedDuration').get(function () {
  const h = this.routeData?.totalDuration || 0;
  return `${Math.round(h)} h`;
});

// יצירת אובייקט תקציר לתצוגת רשימה – חוסך העברת נתונים שלא נחוצים שם
routeSchema.methods.getSummary = function () {
  const d = this.toObject();
  return {
    id: d._id,
    name: d.name,
    description: d.description,
    tripType: d.tripType,
    location: d.location,
    formattedDistance: `${(d.routeData?.totalDistance || 0).toFixed(1)} km`,
    formattedDuration: `${Math.round(d.routeData?.totalDuration || 0)} h`,
    image: d.image,
    createdAt: d.createdAt
  };
};

// יצירת אובייקט מפורט לתצוגת מסלול – כולל routeData מלא וסטטיסטיקות
routeSchema.methods.getDetailed = function () {
  const d = this.toObject();
  return {
    id: d._id,
    name: d.name,
    description: d.description,
    tripType: d.tripType,
    location: d.location,
    routeData: d.routeData,
    totalDistance: d.routeData?.totalDistance || 0,
    totalDuration: d.routeData?.totalDuration || 0,
    formattedDistance: `${(d.routeData?.totalDistance || 0).toFixed(1)} km`,
    formattedDuration: `${Math.round(d.routeData?.totalDuration || 0)} h`,
    image: d.image,
    tags: d.tags,
    notes: d.notes,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt
  };
};

// הפעלת ה-Virtuals גם בהמרות ל-JSON/Object (לפרונט)
routeSchema.set('toJSON', { virtuals: true });
routeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Route', routeSchema);
