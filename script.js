const els = {
  plant: document.getElementById("plantImg"),
  title: document.getElementById("stateTitle"),
  advice: document.getElementById("advice"),
  rain: document.getElementById("rainValue"),
  temp: document.getElementById("tempValue"),
  topTemp: document.getElementById("topTemp"),
  humidity: document.getElementById("humidityValue"),
  wateringAdvice: document.getElementById("wateringAdvice"),
  wateringDetail: document.getElementById("wateringDetail"),
  weatherSummary: document.getElementById("weatherSummary"),
  locationText: document.getElementById("locationText"),
  updated: document.getElementById("updatedAt"),
  lat: document.getElementById("latInput"),
  lon: document.getElementById("lonInput"),
  refresh: document.getElementById("refreshBtn"),
  geo: document.getElementById("geoBtn"),
  pin: document.getElementById("pinBtn")
};

function apiUrl(lat, lon) {
  return `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code&hourly=precipitation&forecast_days=2&timezone=auto`;
}

function sumNext24(hours) {
  if (!Array.isArray(hours)) return 0;
  return hours.slice(0, 24).reduce((a, b) => a + (Number(b) || 0), 0);
}

function weatherCodeSummary(code) {
  if ([0].includes(code)) return "Clear sky";
  if ([1,2,3].includes(code)) return "Partly cloudy";
  if ([45,48].includes(code)) return "Foggy";
  if ([51,53,55,61,63,65,80,81,82].includes(code)) return "Rain nearby";
  if ([71,73,75,77,85,86].includes(code)) return "Snowy";
  if ([95,96,99].includes(code)) return "Stormy";
  return "Weather signal";
}

function classify({ rain24, temp, humidity }) {
  if (rain24 >= 4) {
    return {
      img: "assets/plant-rain.svg",
      title: "Rain is helping",
      advice: "Sky watering may be enough today.",
      wateringAdvice: "No need to water today.",
      wateringDetail: "Rain should help naturally."
    };
  }

  if (humidity >= 70 && temp < 25) {
    return {
      img: "assets/plant-happy.svg",
      title: "Probably fine",
      advice: "Soil should stay good for now.",
      wateringAdvice: "No need to water today.",
      wateringDetail: "Check again tomorrow."
    };
  }

  if (rain24 < 1 && temp >= 28) {
    return {
      img: "assets/plant-desert.svg",
      title: "Desert mode",
      advice: "Hot and dry signal. Check soil.",
      wateringAdvice: "Water if soil feels dry.",
      wateringDetail: "Heat increases water need."
    };
  }

  if (rain24 < 1 && humidity < 55) {
    return {
      img: "assets/plant-thirsty.svg",
      title: "Water soon?",
      advice: "Dry air and little rain ahead.",
      wateringAdvice: "Consider watering soon.",
      wateringDetail: "Especially for small pots."
    };
  }

  return {
    img: "assets/plant-happy.svg",
    title: "Probably fine",
    advice: "No plant emergency detected.",
    wateringAdvice: "Probably no watering now.",
    wateringDetail: "Use soil feel as final check."
  };
}

async function fetchWeather() {
  const lat = Number(els.lat.value || 48.63);
  const lon = Number(els.lon.value || -2.26);
  els.refresh.textContent = "Checking...";

  try {
    const res = await fetch(apiUrl(lat, lon), { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const current = data.current || {};
    const hourly = data.hourly || {};
    const rain24 = sumNext24(hourly.precipitation);
    const temp = Math.round(Number(current.temperature_2m));
    const humidity = Math.round(Number(current.relative_humidity_2m));
    const code = Number(current.weather_code);

    const state = classify({ rain24, temp, humidity });

    els.plant.src = state.img;
    els.title.textContent = state.title;
    els.advice.textContent = state.advice;
    els.wateringAdvice.textContent = state.wateringAdvice;
    els.wateringDetail.textContent = state.wateringDetail;

    els.rain.textContent = `${rain24.toFixed(1)}mm`;
    els.temp.textContent = Number.isFinite(temp) ? `${temp}°C` : "—";
    els.topTemp.textContent = Number.isFinite(temp) ? `${temp}°C` : "—°C";
    els.humidity.textContent = Number.isFinite(humidity) ? `${humidity}%` : "—";
    els.weatherSummary.textContent = weatherCodeSummary(code);
    els.locationText.textContent = `${lat.toFixed(3)}, ${lon.toFixed(3)}`;
    els.updated.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch (err) {
    console.warn(err);
    els.plant.src = "assets/plant-thirsty.svg";
    els.title.textContent = "Signal lost";
    els.advice.textContent = "Check soil manually today.";
    els.wateringAdvice.textContent = "Manual check needed.";
    els.wateringDetail.textContent = "Touch the soil before watering.";
    els.rain.textContent = "—";
    els.temp.textContent = "—";
    els.topTemp.textContent = "—°C";
    els.humidity.textContent = "—";
    els.weatherSummary.textContent = "Offline";
    els.updated.textContent = "offline";
  }

  els.refresh.textContent = "↻ Refresh";
}

els.refresh.addEventListener("click", fetchWeather);

els.geo.addEventListener("click", () => {
  if (!navigator.geolocation) {
    els.advice.textContent = "Geolocation unavailable. Use coordinates.";
    return;
  }

  els.geo.textContent = "Locating...";
  navigator.geolocation.getCurrentPosition(
    pos => {
      els.lat.value = pos.coords.latitude.toFixed(4);
      els.lon.value = pos.coords.longitude.toFixed(4);
      els.geo.textContent = "📍 Location";
      fetchWeather();
    },
    () => {
      els.geo.textContent = "📍 Location";
      els.advice.textContent = "Location permission denied. Coordinates still work.";
    }
  );
});

document.getElementById("closeBtn").addEventListener("click", () => window.plantWidget?.close());
document.getElementById("minBtn").addEventListener("click", () => window.plantWidget?.minimize());

els.pin.addEventListener("click", async () => {
  const pinned = await window.plantWidget?.togglePin();
  els.pin.textContent = pinned ? "📍" : "📌";
});

fetchWeather();
setInterval(fetchWeather, 30 * 60 * 1000);
