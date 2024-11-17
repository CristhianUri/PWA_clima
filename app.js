// Registro del service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .then(() => {
        console.log('Service Worker registrado correctamente.');
      })
      .catch(error => {
        console.log('Error al registrar el Service Worker:', error);
      });
  }
  
  const apiKey = '9718a547ba4eebf82c023734b09fa8c3';
  const weatherForm = document.getElementById('weatherForm');
  const cityInput = document.getElementById('cityInput');
  const weatherDataDiv = document.getElementById('weatherData');
  const locationsDiv = document.getElementById('locations');
  
  const savedLocations = JSON.parse(localStorage.getItem('locations')) || [];
  
  function renderSavedLocations() {
      locationsDiv.innerHTML = '';
      savedLocations.forEach(location => {
          const locationButton = document.createElement('button');
          locationButton.textContent = location;
          locationButton.onclick = () => fetchWeather(location);
          locationsDiv.appendChild(locationButton);
      });
  }
  
  async function fetchWeather(city) {
      try {
          const encodedCity = encodeURIComponent(city.trim());
          const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodedCity}&units=metric&appid=${apiKey}&lang=es`);
  
          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(`Ciudad no encontrada: ${errorData.message}`);
          }
  
          const data = await response.json();
  
          // Guardar los datos de la ciudad en localStorage
          localStorage.setItem(`weatherData_${city}`, JSON.stringify(data)); 
          localStorage.setItem('lastCity', city); // Guardar también la última ciudad consultada
  
          displayWeather(data);
      } catch (error) {
          console.error('Error al buscar la información del clima', error);
          alert('No se pudo obtener la información del clima en línea. Mostrando los últimos datos guardados.');
  
          // Recuperar los datos guardados para la ciudad en localStorage
          const savedData = localStorage.getItem(`weatherData_${city}`);
          if (savedData) {
              const data = JSON.parse(savedData);
              displayWeather(data); // Mostrar los últimos datos guardados
          } else {
              alert(`No hay datos guardados disponibles para ${city}.`);
          }
      }
  }
  
  function displayWeather(data) {
      weatherDataDiv.innerHTML = '';
  
      if (data.list.length === 0) {
          weatherDataDiv.classList.remove('has-data');
          return;
      }
  
      weatherDataDiv.classList.add('has-data'); // Muestra el fondo cuando hay datos
  
      const cityHeader = document.createElement('h2');
      cityHeader.textContent = `${data.city.name}, ${data.city.country}`;
      weatherDataDiv.appendChild(cityHeader);
  
      const dailyForecast = {};
  
      data.list.forEach(forecast => {
          const forecastDate = new Date(forecast.dt_txt);
          const dateKey = forecastDate.toISOString().split('T')[0];
  
          if (!dailyForecast[dateKey] || forecastDate.getUTCHours() === 12) {
              dailyForecast[dateKey] = forecast;
          }
      });
  
      Object.values(dailyForecast).slice(0, 5).forEach(day => {
          const card = document.createElement('div');
          card.classList.add('weather-card');
  
          const dateText = document.createElement('p');
          dateText.textContent = new Date(day.dt_txt).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'long',
          });
  
          const tempText = document.createElement('p');
          tempText.textContent = `${Math.round(day.main.temp)}°C`;
  
          const descText = document.createElement('p');
          descText.textContent = day.weather[0].description;
  
          const icon = document.createElement('img');
          icon.src = `http://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`;
  
          card.appendChild(dateText);
          card.appendChild(tempText);
          card.appendChild(descText);
          card.appendChild(icon);
  
          weatherDataDiv.appendChild(card);
      });
  
      // Muestra el contenedor si tiene contenido
      if (weatherDataDiv.innerHTML.trim() !== '') {
          weatherDataDiv.classList.add('has-content');
      } else {
          weatherDataDiv.classList.remove('has-content');
      }
  }
  
  weatherForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const city = cityInput.value;
  
      // Si no hay conexión, intentar cargar los últimos datos guardados de la ciudad
      if (!navigator.onLine) {
          const savedData = localStorage.getItem(`weatherData_${city}`);
          if (savedData) {
              alert(`No tienes conexión. Mostrando los últimos datos guardados para ${city}.`);
              const data = JSON.parse(savedData);
              displayWeather(data);
          } else {
              alert(`No tienes conexión y no hay datos guardados para ${city}.`);
          }
      } else {
          // Si tiene conexión, hacer la solicitud a la API
          if (!savedLocations.includes(city)) {
              savedLocations.push(city);
              localStorage.setItem('locations', JSON.stringify(savedLocations));
          }
          fetchWeather(city);
          renderSavedLocations();
      }
  });
  
  document.getElementById('clearStorage').addEventListener('click', () => {
      localStorage.clear();
      savedLocations.length = 0;
      renderSavedLocations();
      weatherDataDiv.innerHTML = '';
      alert('Se ha eliminado toda la información almacenada.');
  });
  
  renderSavedLocations();
  