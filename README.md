Roni Arviv 206395642
Maya Kalev 212212856

Trip Planner AI — README

פרויקט קצה לקצה לתכנון מסלולי טיול חכמים עם React בצד הלקוח ו־ Node.js Express בצד השרת. המערכת מייצרת מסלולי הליכה או רכיבה ריאליים סביב יעד שבוחר המשתמש, מבצעת התאמה לרשת שבילים וכבישים, מציגה תחזית מזג אוויר אמיתית לשלושת הימים הקרובים ומאפשרת לשמור את המסלול לחשבון האישי.


סקירה כללית
האפליקציה מאפשרת למשתמשים להתחבר או להירשם, לבחור יעד וסוג טיול, לקבל מסלול ריאלי שנבנה משילוב מודל שפה גדול ליצירת נקודות עניין וכיווני תנועה, יחד עם OpenRouteService להצמיד את המסלול לרשת הדרכים והשבילים האמיתית במפה. בנוסף מתקבלת תחזית מזג אוויר אמיתית לשלושת הימים הקרובים ותמונה מייצגת של היעד. המשתמש יכול לשמור את המסלול, לצפות בו מאוחר יותר, לערוך פרטים ולמחוק.

יכולות עיקריות
- התחברות, הרשמה, התנתקות וניהול פרופיל עם JWT.
- תכנון מסלול הליכה מעגלי ליום אחד 5 עד 15 קילומטר.
- תכנון מסלול רכיבה ליומיים לא מעגלי עד כ 60 קילומטר ליום.
- התאמת המסלול לרשת שבילים וכבישים עם OpenRouteService 
- זיהוי והרחקה של מסלול בקו ישר כדי למנוע תוצאות לא ריאליות.
- תחזית מזג אוויר אמיתית לשלושת הימים הקרובים לפי נקודת התחלה.
- תמונת כיסוי ליעד מהאינטרנט או ברירת מחדל.
- שמירה, צפייה, עדכון ומחיקה של מסלולים בבסיס הנתונים לכל משתמש.
- מפות אינטראקטיביות עם Leaflet והצגת Polyline לפי ימים.

ארכיטקטורה ומבנה פרויקט

📂 trip-planner1-main/
│
├── 📂 client/ — צד לקוח (Frontend) כתוב ב־React
│   ├── 📂 public/ — קבצי HTML סטטיים (כולל index.html הראשי)
│   ├── 📂 src/
│   │   ├── 📂 components/ — רכיבי ממשק חוזרים (Navbar, LocationSearch, WeatherCard, RouteMap, LoadingSpinner)
│   │   ├── 📂 contexts/ — ניהול State גלובלי (AuthContext)
│   │   ├── 📂 pages/ — דפי המערכת (Home, Login, Profile, Register, RouteDetail, SavedRoutes, TripPlanner)
│   │   ├── 📂 services/ — ממשקים ל־API (authService, routeService, tripService, weatherService)
│   │   ├── index.js — קובץ כניסה לאפליקציה
│   │   └── index.css — קובץ עיצוב עם TailwindCSS
│   └── tailwind.config.js — קובץ הגדרות TailwindCSS
│
├── 📂 server/ — צד שרת (Backend) ב־Node.js + Express 
│   ├── 📂 routes/ — נתיבי API (auth, routes, trip)
│   ├── 📂 controllers/ — לוגיקת ניהול בקשות
│   ├── 📂 models/ — מודלי Mongoose למסד הנתונים
│   ├── 📂 middleware/ — אימות JWT, טיפול בשגיאות, ולידציות
│   └── server.js — קובץ הפעלת השרת
│
├── .gitignore — קובץ להתעלמות מקבצים מיותרים ב־Git
├── README.md — תיעוד הפרויקט
└── setup.ps1 — סקריפט התקנה מהיר ב־PowerShell



טכנולוגיות עיקריות
- לקוחReact, React Router, TailwindCSS, Leaflet, Axios, react-hot-toast   -
- שרת-  Node.js, Express, Mongoose, JWT, express-validator
- נתוניםMongoDB -
- צד שלישי OpenRouteService לניווט,
 OpenWeatherMap לתחזית,
 Unsplash לתמונות יעד,
 Groq LLM ליצירת  .Waypoints


התקנה והרצה מקומית:
דרישות מוקדמות
- Node.js גרסה 18 ומעלה
- npm או yarn 
- MongoDB רץ מקומית או בענן
- מפתחות API לשירותים הבאים:
  - OPENROUTESERVICE_API_KEY
  - WEATHER_API_KEY ל OpenWeatherMap
  - GROQ_API_KEY למודל השפה
  - UNSPLASH_ACCESS_KEY אופציונלי לתמונות

קבצי סביבה env
צור שני קבצי env נפרדים לשרת ולקוח.

server/.env
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:3000

MONGODB_URI=mongodb://localhost:27017/trip-planner

JWT_SECRET=change_me
JWT_EXPIRE=7d

OPENROUTESERVICE_API_KEY=your_ors_key
WEATHER_API_KEY=your_openweather_key
GROQ_API_KEY=your_groq_key
UNSPLASH_ACCESS_KEY=your_unsplash_key 
# טיונינג אופציונלי
CYCLING_MAX_KM_PER_DAY=60
HIKING_MIN_KM=5
HIKING_MAX_KM=15


client/.env
במידה והלקוח צריך לפנות לשרת בכתובת שונה מברירת מחדל הגדירי:
REACT_APP_API_URL=http://localhost:5001/api


הרצה מהירה עם PowerShell אופציונלי
במערכת Windows ניתן להריץ את סקריפט ההתקנה:
powershell
# מתוך תיקיית השורש של הפרויקט
.\setup.ps1

הסקריפט יתקין תלויות, יוודא קבצי env וידפיס הוראות המשך. עדיין יש לספק מפתחות תקפים בקבצי env. 

הרצה ידנית של השרת והלקוח
פתחי שני טרמינלים נפרדים.
טרמינל 1 שרת:
bash
cd server
npm install
npm run dev   #  או npm start אם לא מוגדר dev 
טרמינל 2 לקוח:
bash
cd client
npm install
npm start

ברירת מחדל: לקוח על http://localhost:3000 שרת על http://localhost:5001 

זרימת עבודה קצה לקצה
1. משתמש נכנס או נרשם. השרת מחזיר JWT והלקוח שומר ב localStorage.
2. המשתמש בוחר יעד ב LocationSearch. נבחרים name, lat, lng.
3. המשתמש לוחץ תכנן מסלול. הלקוח שולח POST אל /api/trip/plan עם היעד וסוג הטיול.
4. השרת מייצר Waypoints בעזרת מודל LLM לפי כללי Hiking או Cycling.
5. השרת שולח את ה Waypoints ל OpenRouteService כדי לקבל מסלול GeoJSON ריאלי.
6. השרת מביא תחזית מזג אוויר אמיתית ל 3 ימים לפי קואורדינטות התחלה ומחזיר יחד עם תמונת יעד.
7. הלקוח(client) מציג מפה אינטראקטיבית, תחזית ותמונה. המשתמש יכול לשמור למסד הנתונים.
8. בדף מסלולים שמורים ניתן לטעון, לערוך או למחוק מסלול.

נקודות אינטגרציה חיצוניות
- OpenRouteService קצה /v2/directions פרופילים foot-hiking ו cycling-regular
- OpenWeatherMap קצה תחזית מעובד ל 3 ימים קדימה
- Unsplash חיפוש תמונה לפי מחרוזת יעד אופציונלי
- Groq Chat Completions יצירת Waypoints בפורמט JSON בלבד

 API צד שרת

אימות משתמשים
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me מחייב JWT
- PUT /api/auth/profile מחייב JWT
- PUT /api/auth/password מחייב JWT

מסלולים שמורים
- GET /api/routes מחזיר רשימת מסלולים למשתמש המחובר עם פאגינציה וסינון tripType
- GET /api/routes/:id מחזיר מסלול מפורט כולל geometry או dailyRoutes ו center
- POST /api/routes יוצר מסלול חדש לאחר נרמול נתונים
- PUT /api/routes/:id מעדכן שדות שנשלחו בלבד עם נרמול מחודש אם routeData הוחלף
- DELETE /api/routes/:id מוחק מסלול בבעלות המשתמש


תכנון מסלול
- POST /api/trip/plan מחייב JWT
  - גוף הבקשה:
json
    {
      "location": { "name": "Berlin Germany", "lat": 52.52, "lng": 13.405 },
      "tripType": "hiking" // או "cycling"
    }
    ```
  - תגובה:
   json
    {
      "route": { "geometry": {...}, "dailyRoutes": [...], "totalDistance": 12345, "totalDuration": 3600 },
      "weather": {“forecast": [ ... 3 ימים ...] },
      "image": { "url": "..." }
    }
    

מזג אוויר ותמונת יעד
•	תחזית מזג האוויר אינה נשמרת במסד הנתונים, אלא מחושבת בזמן אמת כחלק מהתגובה לקריאה POST /api/trip/plan באמצעות פונקציית השירות getWeatherData(lat, lng), ומוחזרת בשדה weather.
•	תמונת יעד: ניתן לשלוח בקשה אל GET /api/image?location= לקבלת תמונת יעד מתאימה. קריאה זו מבוצעת גם כחלק מ־/trip/plan והתוצאה מוחזרת בשדה image.


מודלים בבסיס הנתונים 
User:
•	name, email ייחודי
•	password (hash)
•	isActive
•	lastLogin
•	מתודות: matchPassword, getPublicProfile
Route:
•	user (ref)
•	name, description, tripType (hiking/cycling)
•	location: city, country, coordinates
•	routeData: geometry (GeoJSON) או dailyRoutes, totalDistance, totalDuration
•	image: נתוני תמונה
•	tags, notes
•	וירטואלים: הצגת מרחק וזמן בפורמט קריא











