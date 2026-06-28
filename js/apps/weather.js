"use strict";

const WEATHER_API_KEY = '40bd4c16f527362a400534db42b97c53';
const WEATHER_LOCATION = 'New York,US';

function buildWeather() {
  return `
    <div class="weather-app">
      <div class="weather-header">
        <div class="weather-location">
          <i class="ti ti-map-pin"></i>
          <span id="weather-location-text">New York, NY</span>
        </div>
        <div class="weather-date" id="weather-date">Monday, January 1</div>
      </div>
      
      <div class="weather-main">
        <div class="weather-icon">
          <i class="ti ti-sun" id="weather-icon"></i>
        </div>
        <div class="weather-temp">
          <span class="temp-value" id="temp-value">--</span>
          <span class="temp-unit">°C</span>
        </div>
        <div class="weather-desc" id="weather-desc">Loading...</div>
      </div>
      
      <div class="weather-details">
        <div class="weather-detail">
          <i class="ti ti-droplet"></i>
          <div class="detail-info">
            <span class="detail-label">Humidity</span>
            <span class="detail-value" id="humidity">--%</span>
          </div>
        </div>
        <div class="weather-detail">
          <i class="ti ti-wind"></i>
          <div class="detail-info">
            <span class="detail-label">Wind</span>
            <span class="detail-value" id="wind">-- m/s</span>
          </div>
        </div>
        <div class="weather-detail">
          <i class="ti ti-eye"></i>
          <div class="detail-info">
            <span class="detail-label">Visibility</span>
            <span class="detail-value" id="visibility">-- km</span>
          </div>
        </div>
      </div>
      
      <div class="weather-forecast">
        <div class="forecast-title">5-Day Forecast</div>
        <div class="forecast-list" id="forecast-list">
          <div class="forecast-item">
            <span class="forecast-day">Loading...</span>
            <i class="ti ti-sun forecast-icon"></i>
            <span class="forecast-temp">--°</span>
          </div>
        </div>
      </div>
      
      <div class="weather-refresh">
        <button class="refresh-btn" onclick="weatherRefresh()">
          <i class="ti ti-refresh"></i>
          <span>Refresh</span>
        </button>
      </div>
    </div>
  `;
}

function weatherInit(wid) {
  updateWeatherDate();
  fetchWeatherData();
}

function updateWeatherDate() {
  const dateEl = document.getElementById('weather-date');
  if (dateEl) {
    const now = new Date();
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    dateEl.textContent = now.toLocaleDateString('en-US', options);
  }
}

async function fetchWeatherData() {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(WEATHER_LOCATION)}&appid=${WEATHER_API_KEY}&units=metric`
    );
    
    if (!response.ok) {
      throw new Error('Weather data fetch failed');
    }
    
    const data = await response.json();
    updateWeatherDisplay(data);
    
    // Fetch 5-day forecast
    fetchForecast();
  } catch (error) {
    console.error('Weather error:', error);
    notify('Failed to load weather data');
  }
}

async function fetchForecast() {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(WEATHER_LOCATION)}&appid=${WEATHER_API_KEY}&units=metric`
    );
    
    if (!response.ok) {
      throw new Error('Forecast fetch failed');
    }
    
    const data = await response.json();
    updateForecast(data);
  } catch (error) {
    console.error('Forecast error:', error);
  }
}

function updateWeatherDisplay(data) {
  const weatherData = {
    temp: Math.round(data.main.temp),
    description: data.weather[0].main,
    humidity: data.main.humidity,
    wind: Math.round(data.wind.speed * 3.6),
    visibility: Math.round((data.visibility || 10000) / 1000),
    icon: getWeatherIcon(data.weather[0].main, data.weather[0].icon)
  };
  
  const tempEl = document.getElementById('temp-value');
  const descEl = document.getElementById('weather-desc');
  const humidEl = document.getElementById('humidity');
  const windEl = document.getElementById('wind');
  const visEl = document.getElementById('visibility');
  const iconEl = document.getElementById('weather-icon');
  
  if (tempEl) tempEl.textContent = weatherData.temp;
  if (descEl) descEl.textContent = weatherData.description;
  if (humidEl) humidEl.textContent = weatherData.humidity + '%';
  if (windEl) windEl.textContent = weatherData.wind + ' km/h';
  if (visEl) visEl.textContent = weatherData.visibility + ' km';
  if (iconEl) {
    iconEl.className = 'ti ' + weatherData.icon;
  }
  
  updateWeatherWidget(weatherData);
}

function updateForecast(data) {
  const forecastList = document.getElementById('forecast-list');
  if (!forecastList) return;
  
  const dailyData = {};
  data.list.forEach(item => {
    const date = new Date(item.dt * 1000).toDateString();
    if (!dailyData[date]) {
      dailyData[date] = item;
    }
  });
  
  const forecastDays = Object.values(dailyData).slice(0, 5);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  forecastList.innerHTML = forecastDays.map(day => {
    const date = new Date(day.dt * 1000);
    const dayName = dayNames[date.getDay()];
    const icon = getWeatherIcon(day.weather[0].main, day.weather[0].icon);
    const temp = Math.round(day.main.temp);
    
    return `
      <div class="forecast-item">
        <span class="forecast-day">${dayName}</span>
        <i class="ti ${icon} forecast-icon"></i>
        <span class="forecast-temp">${temp}°</span>
      </div>
    `;
  }).join('');
}

function getWeatherIcon(weatherMain, iconCode) {
  if (iconCode.includes('01')) return 'ti-sun';
  if (iconCode.includes('02')) return 'ti-cloud-sun';
  if (iconCode.includes('03') || iconCode.includes('04')) return 'ti-cloud';
  if (iconCode.includes('09') || iconCode.includes('10')) return 'ti-cloud-rain';
  if (iconCode.includes('11')) return 'ti-lightning';
  if (iconCode.includes('13')) return 'ti-snowflake';
  if (iconCode.includes('50')) return 'ti-wind';
  return 'ti-cloud';
}

function weatherRefresh() {
  const refreshBtn = document.querySelector('.refresh-btn');
  if (refreshBtn) {
    refreshBtn.classList.add('spinning');
    fetchWeatherData();
    setTimeout(() => {
      refreshBtn.classList.remove('spinning');
    }, 1000);
  }
}

function updateWeatherWidget(weatherData) {
  const widgetInstances = document.querySelectorAll('.dw-weather-temp, .dw-weather-desc, .dw-weather-icon');
  widgetInstances.forEach(instance => {
    if (instance.classList.contains('dw-weather-temp')) {
      instance.textContent = weatherData.temp + '°';
    } else if (instance.classList.contains('dw-weather-desc')) {
      instance.textContent = weatherData.description;
    } else if (instance.classList.contains('dw-weather-icon')) {
      instance.className = 'ti ' + weatherData.icon + ' dw-weather-icon';
    }
  });
}
