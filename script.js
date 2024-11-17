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

    const cityHeader = document.createElement('h2');
    cityHeader.textContent = `${data.city.name}, ${data.city.country}`;
    weatherDataDiv.appendChild(cityHeader);

    const dailyForecast = {};

    // Agrupar pronósticos por fecha y guardar el más cercano a las 12:00 (o cualquier hora disponible)
    data.list.forEach(forecast => {
        const forecastDate = new Date(forecast.dt_txt);
        const dateKey = forecastDate.toISOString().split('T')[0];

        // Guardar el pronóstico del día de hoy lo más cerca posible de la hora actual
        const currentHour = new Date().getHours();
        const forecastHour = forecastDate.getUTCHours();

        if (forecastDate.toISOString().split('T')[0] === new Date().toISOString().split('T')[0] && 
            Math.abs(forecastHour - currentHour) < 3) { // Pronóstico más cercano a la hora actual para hoy
            dailyForecast[dateKey] = forecast;
        } else if (!dailyForecast[dateKey] || forecastHour === 12) { // O pronóstico para las 12:00 para otros días
            dailyForecast[dateKey] = forecast;
        }
    });

    // Obtener pronósticos para hoy y los próximos cuatro días
    const today = new Date().toISOString().split('T')[0];
    const forecastArray = Object.values(dailyForecast)
        .filter(day => new Date(day.dt_txt).toISOString().split('T')[0] >= today)
        .slice(0, 5); // Limitar a 5 días, incluido el de hoy

    // Renderizar el pronóstico
    forecastArray.forEach(day => {
        const card = document.createElement('div');
        card.classList.add('weather-card');

        card.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        card.style.padding = '15px';
        card.style.borderRadius = '8px';
        card.style.textAlign = 'center';
        card.style.margin = '10px';
        card.style.boxShadow = '0px 4px 6px rgba(0, 0, 0, 0.1)';

        const options = { day: 'numeric', month: 'long' };
        const dateString = new Date(day.dt_txt).toLocaleDateString('es-ES', options);

        const dateText = document.createElement('p');
        dateText.textContent = dateString;
        dateText.style.fontSize = '16px';
        dateText.style.color = '#333';
        dateText.style.margin = '5px 0';

        const tempText = document.createElement('p');
        tempText.textContent = `${Math.round(day.main.temp)}°C`;
        tempText.style.fontSize = '16px';
        tempText.style.color = '#333';
        tempText.style.margin = '5px 0';

        const descText = document.createElement('p');
        descText.textContent = day.weather[0].description;
        descText.style.fontSize = '16px';
        descText.style.color = '#333';
        descText.style.margin = '5px 0';

        const icon = document.createElement('img');
        icon.src = `http://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`;
        icon.alt = 'Weather icon';
        icon.style.width = '80px';
        icon.style.height = '80px';
        icon.style.display = 'block';
        icon.style.margin = '0 auto';

        card.appendChild(dateText);
        card.appendChild(tempText);
        card.appendChild(descText);
        card.appendChild(icon);

        weatherDataDiv.appendChild(card);
    });
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
