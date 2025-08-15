// Middleware מרכזי לטיפול בשגיאות באפליקציה
const errorHandler = (err, req, res, next) => {
  // יוצרים אובייקט חדש של השגיאה כדי לא לשנות את המקור
  let error = { ...err };
  error.message = err.message;

  

  // טיפול בשגיאת Mongoose – ObjectId לא תקין (CastError)
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // טיפול בשגיאת Mongoose – מפתח כפול (למשל אימייל שכבר קיים)
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 };
  }

  // טיפול בשגיאת Mongoose – ולידציה (חוקי שדות לא מולאו/לא תקינים)
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // טיפול בשגיאת JWT – טוקן לא תקין
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  // טיפול בשגיאת JWT – טוקן שפג תוקפו
  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  // שליחת תגובת ברירת מחדל ללקוח
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
    // במצב פיתוח מציגים גם את ה-stack trace
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// עטיפת פונקציות אסינכרוניות ב־Promise עם catch – כדי לא לחזור על try/catch בכל קונטרולר
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// פונקציה לעיצוב הודעות ולידציה – מחזירה אובייקט פשוט עם הודעות שגיאה
const formatValidationErrors = (errors) => {
  const formattedErrors = {};
  
  Object.keys(errors).forEach(key => {
    formattedErrors[key] = errors[key].message;
  });
  
  return formattedErrors;
};

module.exports = {
  errorHandler,
  asyncHandler,
  formatValidationErrors
};
