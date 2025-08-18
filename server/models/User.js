const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// -------------------- הגדרת סכמת המשתמש --------------------
const userSchema = new mongoose.Schema({
  // שם המשתמש
  name: {
    type: String,
    required: [true, 'Name is required'], // שדה חובה
    trim: true,                           // הסרת רווחים מיותרים
    maxlength: [50, 'Name cannot be more than 50 characters']
  },

  // אימייל (משמש גם כפרטי התחברות)
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,         // ייחודי ברמת DB – לא יתאפשר שני משתמשים עם אותו אימייל
    lowercase: true,      // נרמול אותיות קטנות למניעת כפילויות
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },

  // סיסמה מוצפנת
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false         // החלטה עיצובית: לא להחזיר סיסמה כברירת מחדל
                          // כדי למנוע חשיפה לא מכוונת בתשובות API
  },

  // סטטוס חשבון (פעיל/לא פעיל)
  isActive: {
    type: Boolean,
    default: true
  },

  // תאריך כניסה אחרון
  lastLogin: {
    type: Date,
    default: Date.now // מתעדכן בעת התחברות מוצלחת
  }
}, {
  timestamps: true // יוצר אוטומטית createdAt ו־updatedAt
});

// אינדקס לחיפושים מהירים לפי אימייל (בנוסף ל-unique)
userSchema.index({ email: 1 });

// -------------------- Hooks (Middleware) --------------------
/**
 * pre('save') – מתבצע לפני שמירת מסמך:
 * אם הסיסמה שונתה, מבצעים hashing עם salt.
 */
userSchema.pre('save', async function(next) {
  // אם הסיסמה לא שונתה – ממשיכים בלי hashing מחדש
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12); // 12 סיבובים – איזון בין אבטחה לביצועים
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// -------------------- Methods (מתודות של המודל) --------------------
/**
 * השוואת סיסמה גולמית מול הסיסמה המוצפנת שנשמרה.
 * שימו לב: יש לשלוף את השדה password בעזרת select('+password')
 * מכיוון שהוא מוגדר select:false.
 */
userSchema.methods.matchPassword = async function(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

/**
 * החזרת פרופיל ציבורי – בלי הסיסמה.
 * שימושי להחזרת נתונים ל־API מבלי לחשוף מידע רגיש.
 */
userSchema.methods.getPublicProfile = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// -------------------- Statics (מתודות סטטיות) --------------------
/**
 * חיפוש משתמש לפי אימייל, עם נרמול ל-lowercase.
 * שומר על עקביות עם ההגדרה בסכמה.
 */
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

module.exports = mongoose.model('User', userSchema);
