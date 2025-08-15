const Route = require('../models/Route');
const { asyncHandler } = require('../middleware/errorHandler');
const { validationResult } = require('express-validator');
const normalizeRouteData = require('./normalizeRouteData');
const mongoose = require('mongoose');

// @desc    Get all routes for current user
// @route   GET /api/routes
// @access  Private
const getRoutes = asyncHandler(async (req, res) => {
  // פרמס של עמוד/כמות לרשימה – המרה למספר עם ברירת מחדל
  const pageNum = Number(req.query.page || 1);
  const limitNum = Number(req.query.limit || 10);
  const { tripType } = req.query;

  // סינון לפי משתמש מחובר; אופציונלית לפי סוג טיול
  const filter = { user: req.user.id };
  if (tripType) filter.tripType = tripType;

  // שליפה מדפדפת + מיון מהחדש לישן
  const routes = await Route.find(filter)
    .sort({ createdAt: -1 })
    .limit(limitNum)
    .skip((pageNum - 1) * limitNum)
    .exec();

  const count = await Route.countDocuments(filter);

  // מחזירים רק תקציר לכל מסלול כדי לחסוך נפח תגובה
  res.json({
    success: true,
    data: {
      routes: routes.map(route => route.getSummary()),
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(count / limitNum),
        totalRoutes: count,
        hasNextPage: pageNum * limitNum < count,
        hasPrevPage: pageNum > 1
      }
    }
  });
});

// @desc    Get single route
// @route   GET /api/routes/:id
// @access  Private
const getRoute = asyncHandler(async (req, res) => {
  const route = await Route.findById(req.params.id);
  if (!route) return res.status(404).json({ success: false, message: 'Route not found' });

  // הגנה על נתוני משתמשים אחרים
  if (route.user.toString() !== req.user.id)
    return res.status(403).json({ success: false, message: 'Not authorized to access this route' });

  // נרמול routeData לפורמט עקבי + חישוב center לשימוש בפרונט
  const { routeData: normalizedRD, center } = normalizeRouteData(route.routeData, route.location);

  const detailed = route.getDetailed();
  detailed.routeData = normalizedRD;
  detailed.center = center;

  res.json({ success: true, data: { route: detailed } });
});

// @desc    Create new route
// @route   POST /api/routes
// @access  Private
const createRoute = asyncHandler(async (req, res) => {
  // ולידציית בקשה בעזרת express-validator (אם הוגדר ברמת הראוט)
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const {
    name,
    description,
    tripType,
    location,
    routeData,
    // weather, ← במכוון לא נקלט ולא נשמר
    image,
    tags,
    notes
  } = req.body;

  // נרמול נתוני מסלול לפני שמירה למסד – מבטיח מבנה עקבי
  const { routeData: normalizedRD } = normalizeRouteData(routeData, location);

  const route = await Route.create({
    user: req.user.id,
    name,
    description,
    tripType,
    location,
    routeData: normalizedRD,
    // weather, ← לא נשמר במסד הנתונים
    image,
    tags,
    notes
  });

  res.status(201).json({
    success: true,
    data: { route: route.getDetailed() },
    message: 'Route created successfully'
  });
});

// @desc    Update route
// @route   PUT /api/routes/:id
// @access  Private
const updateRoute = asyncHandler(async (req, res) => {
  let route = await Route.findById(req.params.id);

  if (!route) {
    return res.status(404).json({ success: false, message: 'Route not found' });
  }

  // מניעת עדכון של מסלול שלא שייך למשתמש
  if (route.user.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Not authorized to update this route' });
  }

  const {
    name,
    description,
    tripType,
    location,
    routeData,
    // weather, ← במכוון לא מעדכנים
    image,
    tags,
    notes
  } = req.body;

  // עדכונים חלקיים בלבד – נוגעים רק בשדות שנשלחו
  if (name !== undefined) route.name = name;
  if (description !== undefined) route.description = description;
  if (tripType !== undefined) route.tripType = tripType;
  // if (weather !== undefined) route.weather = weather; ← לא מעדכנים מז"א
  if (image !== undefined) route.image = image;
  if (tags !== undefined) route.tags = tags;
  if (notes !== undefined) route.notes = notes;

  // אם מיקום עודכן – נשמור אותו ונשתמש בו לנרמול routeData החדש
  const nextLocation = location !== undefined ? location : route.location;
  if (location !== undefined) route.location = location;

  // נרמול routeData רק אם הגיע עדכון עבורו
  if (routeData !== undefined) {
    const { routeData: normalizedRD } = normalizeRouteData(routeData, nextLocation);
    route.routeData = normalizedRD;
  }

  const updatedRoute = await route.save();

  res.json({
    success: true,
    data: { route: updatedRoute.getDetailed() },
    message: 'Route updated successfully'
  });
});

// @desc    Delete route
// @route   DELETE /api/routes/:id
// @access  Private
const deleteRoute = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // ולידציה מוקדמת למזהה לא תקין – מונע שאילתות מיותרות למסד
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid route id' });
  }

  // מוחקים רק אם המסלול שייך למשתמש – הגנה דו-שלבית (גם בבקשה וגם במסד)
  const deleted = await Route.findOneAndDelete({ _id: id, user: req.user.id });

  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Route not found' });
  }

  return res.json({ success: true, message: 'Route deleted successfully' });
});

module.exports = {
  getRoutes,
  getRoute,
  createRoute,
  updateRoute,
  deleteRoute,
};
