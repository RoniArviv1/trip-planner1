import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { routeService } from '../services/routeService';
import { weatherService } from '../services/weatherService';
import RouteMap from '../components/RouteMap';
import WeatherCard from '../components/WeatherCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { MapPin, Calendar, Eye, Filter, Plus, Trash2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const SavedRoutes = () => {
  // שומרים רק תקצירים בטעינה הראשונה; פרטים מלאים נטען לפי בחירה (Lazy load)
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);

  // נפריד בין "טוען רשימה" ל—"טוען פרטי מסלול נבחר" לצורך UX ברור
  const [loading, setLoading] = useState(true);
  const [selectLoading, setSelectLoading] = useState(false);

  // סינון בסיסי לפי סוג טיול; קל להרחבה בעתיד (שם/מדינה וכו')
  const [filter, setFilter] = useState({ tripType: '' });

  // מזג אוויר "לפי דרישה" ולא אוטומטי — חוסך קריאות API מיותרות
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  useEffect(() => {
    fetchRoutes();
  }, []);

  // טעינת תקצירי המסלולים (summary) מהשרת
  const fetchRoutes = async () => {
    try {
      const response = await routeService.getRoutes({}, { noCache: true }); // summaries
      setRoutes(response.routes);
    } catch (error) {
      toast.error('Failed to load routes');
    } finally {
      setLoading(false);
    }
  };

  // בחירת מסלול מהרשימה → טוענים פרטים מלאים בלבד למסלול הנבחר
  const handleSelectRoute = async (routeSummary) => {
    try {
      setSelectLoading(true);
      setWeatherData(null); // איפוס תחזית כשמחליפים מסלול
      const id = routeSummary.id ?? routeSummary._id;
      const payload = await routeService.getRoute(id, { noCache: true });
      const full = payload.route ?? payload; // תומך גם ב- { route } וגם באובייקט ישיר
      setSelectedRoute(full);
    } catch (e) {
      toast.error('Failed to load route details');
    } finally {
      setSelectLoading(false);
    }
  };

  // מחיקת מסלול: עדכון אופטימי של הרשימה, ותיקון מצב המסך אם המסלול שנצפה נמחק
  const handleDeleteRoute = async (routeId) => {
    if (!window.confirm('Are you sure you want to delete this route?')) return;
    try {
      await routeService.deleteRoute(routeId);
      setRoutes(prev => prev.filter(r => (r.id ?? r._id) !== routeId));
      if ((selectedRoute?.id ?? selectedRoute?._id) === routeId) {
        setSelectedRoute(null);
        setWeatherData(null);
      }
      toast.success('Route deleted successfully');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to delete route');
    }
  };

  // סינון בצד לקוח — פשוט ומהיר עבור רשימות קצרות
  const filteredRoutes = routes.filter(route => {
    if (filter.tripType && route.tripType !== filter.tripType) return false;
    return true;
  });

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const getTripTypeIcon = (tripType) => (tripType === 'hiking' ? '🥾' : '🚴');

  // הבאת תחזית לפי דרישה:
  // קודם ננסה center; אם אין, ניפול ל-location.coordinates — שומר על גמישות מבנה הנתונים
  const fetchWeather = async () => {
    if (!selectedRoute) return;
    let lat, lng;
    if (Array.isArray(selectedRoute?.center) && selectedRoute.center.length === 2) {
      lat = selectedRoute.center[0];
      lng = selectedRoute.center[1];
    } else {
      lat = selectedRoute?.location?.coordinates?.lat;
      lng = selectedRoute?.location?.coordinates?.lng;
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      toast.error('Missing start coordinates for weather lookup');
      return;
    }
    setWeatherLoading(true);
    try {
      const data = await weatherService.getForecast(lat, lng);
      setWeatherData(data); // צפוי אובייקט עם forecast
      toast.success('Weather loaded');
    } catch (err) {
      toast.error('Failed to load weather.');
    } finally {
      setWeatherLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading your routes..." />;

  return (
    <div className="max-w-7xl mx-auto">
      {/* כותרת ודחיפה לפעולה לתכנון מסלול חדש */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Routes</h1>
            <p className="text-gray-600">View and manage your saved trip routes</p>
          </div>
          {/* CTA ראשי לתכנון חדש — משאיר את הרשימה זמינה מימין */}
          <Link to="/plan" className="btn btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Plan New Trip
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* עמודה שמאלית — מסננים ורשימת מסלולים */}
        <div className="lg:col-span-1">
          {/* מסנן בסיסי: סוג טיול */}
          <div className="card mb-6">
            <div className="card-header">
              <div className="flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
              </div>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Trip Type</label>
                <select
                  value={filter.tripType}
                  onChange={(e) => setFilter(prev => ({ ...prev, tripType: e.target.value }))}
                  className="input"
                >
                  <option value="">All Types</option>
                  <option value="hiking">Hiking</option>
                  <option value="cycling">Cycling</option>
                </select>
              </div>
            </div>
          </div>

          {/* רשימת המסלולים (תקצירים) */}
          <div className="space-y-4">
            {filteredRoutes.length === 0 ? (
              <div className="card">
                <div className="card-body text-center py-8">
                  <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No routes found</h3>
                  <p className="text-gray-600 mb-4">
                    {routes.length === 0 ? "You haven't saved any routes yet." : "No routes match your current filters."}
                  </p>
                  {routes.length === 0 && <Link to="/plan" className="btn btn-primary">Plan Your First Trip</Link>}
                </div>
              </div>
            ) : (
              filteredRoutes.map(route => (
                <div
                  key={route.id ?? route._id}
                  className={`card cursor-pointer transition-all ${
                    (selectedRoute?.id ?? selectedRoute?._id) === (route.id ?? route._id)
                      ? 'ring-2 ring-blue-500 bg-blue-50' // מדגיש את המסלול הנבחר
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => handleSelectRoute(route)}
                >
                  <div className="card-body">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{getTripTypeIcon(route.tripType)}</span>
                        <h3 className="font-semibold text-gray-900">{route.name}</h3>
                      </div>
                      {/* כפתור מחיקה קטן בפינה — עוצר bubbling כדי לא לבחור את הכרטיס בטעות */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteRoute(route.id ?? route._id); }}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {route.description && <p className="text-gray-600 text-sm mb-3">{route.description}</p>}

                    {/* שורת מידע קצרה: מיקום + תאריך יצירה */}
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {route.location?.city}, {route.location?.country}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(route.createdAt)}
                      </div>
                    </div>

                    {/* מרחק וזמן בפורמט ידידותי מהשרת */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-blue-600 font-medium">{route.formattedDistance}</span>
                        <span className="text-green-600 font-medium">{route.formattedDuration}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* עמודה ימנית — פרטי המסלול הנבחר */}
        <div className="lg:col-span-2">
          {selectLoading && (
            <div className="card mb-4">
              <div className="card-body">Loading route…</div>
            </div>
          )}

          {selectedRoute ? (
            <div className="space-y-6">
              {/* כותרת פרטי מסלול */}
              <div className="card">
                <div className="card-header">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedRoute.name}</h2>
                      <p className="text-gray-600 mt-1">
                        {selectedRoute.location?.city}, {selectedRoute.location?.country}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  {selectedRoute.description && <p className="text-gray-700 mb-4">{selectedRoute.description}</p>}

                  {/* כרטיסי מדדים קטנים: מרחק, משך, ימים, תאריך יצירה */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedRoute.formattedDistance ?? '—'}
                      </div>
                      <div className="text-sm text-gray-600">Distance</div>

                      <div className="text-2xl font-bold text-green-600">
                        {selectedRoute.formattedDuration ?? '—'}
                      </div>
                      <div className="text-sm text-gray-600">Duration</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {selectedRoute.routeData?.dailyRoutes?.length || 1}
                      </div>
                      <div className="text-sm text-gray-600">Days</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {formatDate(selectedRoute.createdAt)}
                      </div>
                      <div className="text-sm text-gray-600">Created</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* מפה אינטראקטיבית של המסלול הנבחר */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Route Map</h3>
                </div>
                <div className="card-body p-0">
                  <RouteMap
                    routeData={selectedRoute.routeData}
                    center={
                      selectedRoute.center ??
                      (Number.isFinite(selectedRoute?.location?.coordinates?.lat) &&
                       Number.isFinite(selectedRoute?.location?.coordinates?.lng)
                        ? [selectedRoute.location.coordinates.lat, selectedRoute.location.coordinates.lng]
                        : undefined)
                    }
                    height="400px"
                    showMarkers
                    showRoute
                  />
                </div>
              </div>

              {/* תחזית מזג אוויר לפי לחיצה — לא "מרעישים" את ה-API שלא לצורך */}
              <div className="card">
                <div className="card-header flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Weather Forecast</h3>
                  <button
                    onClick={fetchWeather}
                    disabled={weatherLoading || selectLoading || !selectedRoute}
                    className="btn btn-secondary"
                  >
                    {weatherLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        {weatherData ? 'Refresh Weather' : 'Get Weather Forecast'}
                      </>
                    )}
                  </button>
                </div>
                <div className="card-body">
                  {weatherData ? (
                    <WeatherCard
                      weather={weatherData}
                      location={{
                        name: `${selectedRoute.location?.city || ''}${
                          selectedRoute.location?.country ? ', ' + selectedRoute.location.country : ''
                        }`
                      }}
                    />
                  ) : (
                    <p className="text-sm text-gray-500">
                      Click “Get Weather Forecast” to load a 3-day forecast for this route’s starting point.
                    </p>
                  )}
                </div>
              </div>

              {/* תמונת יעד אם קיימת */}
              {selectedRoute.image && (
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-semibold text-gray-900">Destination Image</h3>
                  </div>
                  <div className="card-body">
                    <img
                      src={selectedRoute.image.url}
                      alt={selectedRoute.image.alt}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            // מצב ריק — מדרבן לבחור מסלול
            <div className="card">
              <div className="card-body text-center py-16">
                <Eye className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Route</h3>
                <p className="text-gray-600">
                  Choose a route from the list to view its details, map, and weather forecast.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedRoutes;
