const axios = require('axios');
const { asyncHandler } = require('../middleware/errorHandler');

// מביא תחזית 3 ימים קדימה לפי קואורדינטות
const getWeatherData = async (startLat, startLng) => {
  try {
    // מפתח API של OpenWeatherMap נדרש לקריאה תקינה
    if (!process.env.WEATHER_API_KEY) {
      return { forecast: [] };
    }


    // קריאה ל־forecast (כל 3 שעות) – 24 רשומות ≈ 3 ימים
    const response = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
      params: {
        lat: startLat,
        lon: startLng,
        appid: process.env.WEATHER_API_KEY,
        units: 'metric',
        cnt: 24
      },
      timeout: 15000
    });

    if (!response.data || !response.data.list) {
      return { forecast: [] };
    }

    const forecastData = response.data.list;
    const dailyData = {};

    // קיבוץ נקודות מדידה לפי יום (yyyy-mm-dd)
    forecastData.forEach(forecast => {
      const date = new Date(forecast.dt * 1000);
      const dayKey = date.toISOString().split('T')[0];

      if (!dailyData[dayKey]) {
        dailyData[dayKey] = {
          date,
          temperatures: [],
          descriptions: [],
          icons: [],
          humidity: [],
          windSpeed: [],
          precipitation: []
        };
      }

      dailyData[dayKey].temperatures.push(forecast.main.temp);
      dailyData[dayKey].descriptions.push(forecast.weather[0].description);
      dailyData[dayKey].icons.push(forecast.weather[0].icon);
      dailyData[dayKey].humidity.push(forecast.main.humidity);
      dailyData[dayKey].windSpeed.push(forecast.wind.speed);
      dailyData[dayKey].precipitation.push(forecast.pop * 100);
    });

    // בחירה של 3 ימים קרובים (ממחר ואילך)
    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const forecasts = Object.keys(dailyData)
      .filter(dayKey => new Date(dayKey) >= tomorrow)
      .slice(0, 3)
      .map(dayKey => {
        const day = dailyData[dayKey];
        return {
          date: day.date,
          temperature: {
            min: Math.min(...day.temperatures),
            max: Math.max(...day.temperatures),
            current: day.temperatures[0]
          },
          description: getMostFrequent(day.descriptions),
          icon: day.icons[0],
          humidity: Math.round(day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length),
          windSpeed: Math.round((day.windSpeed.reduce((a, b) => a + b, 0) / day.windSpeed.length) * 10) / 10,
          precipitation: Math.round(day.precipitation.reduce((a, b) => a + b, 0) / day.precipitation.length)
        };
      });
    return { forecast: forecasts };
  } catch (error) {
    // שגיאה בזמן הקריאה/עיבוד – מחזירים מבנה ריק כדי לא לשבור את ה־API
    return { forecast: [] };
  }
};

// עוטף ל־Express: מחזיר תחזית עדכנית לפי lat/lng מה־params
const getForecastByCoords = asyncHandler(async (req, res) => {
  const lat = Number(req.params.lat);
  const lng = Number(req.params.lng);

  // ולידציה בסיסית לפרמטרים נומריים
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ success: false, message: 'Invalid coordinates' });
  }

  const data = await getWeatherData(lat, lng);
  return res.json({ success: true, data });
});

// מחזיר את הערך השכיח במערך (לצורך תיאור יומי "מייצג")
const getMostFrequent = (arr) => {
  const frequency = {};
  let maxFreq = 0;
  let mostFrequent = arr[0];

  arr.forEach(item => {
    frequency[item] = (frequency[item] || 0) + 1;
    if (frequency[item] > maxFreq) {
      maxFreq = frequency[item];
      mostFrequent = item;
    }
  });

  return mostFrequent;
};

module.exports = {
  getWeatherData,
  getForecastByCoords
};
