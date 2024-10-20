const apiKey = 'e0405aa99888d8d4f506ec307c314a0f'; // Replace with your OpenWeather API key
const geminiApiKey = 'AIzaSyBw4hf3FhRK0EwM4mYUYkev8x0qkFQokaQ'; // Replace with your Gemini API key

// DOM Elements
const weatherInfo = document.getElementById('weather-info');
const getWeatherBtn = document.getElementById('get-weather-btn');
const cityInput = document.getElementById('city-input');
const latitudeInput = document.getElementById('latitude-input'); 
const longitudeInput = document.getElementById('longitude-input'); 
const videoSource = document.getElementById('video-source');
const forecastBody = document.getElementById('forecast-body');
const pagination = document.getElementById('pagination');
const sortAscBtn = document.getElementById('sort-asc-btn');
const sortDescBtn = document.getElementById('sort-desc-btn');
const filterRainBtn = document.getElementById('filter-rain-btn');
const highestTempBtn = document.getElementById('highest-temp-btn');
const chatInput = document.getElementById('chat-input');
const chatLog = document.getElementById('chat-log');
const chatSendBtn = document.getElementById('chat-send-btn');

// JavaScript to toggle between sections
const dashboardLink = document.getElementById('dashboard-link');
const tablesLink = document.getElementById('tables-link');
const dashboardSection = document.getElementById('dashboard-section');
const tableSection = document.getElementById('table-section');

// Show Dashboard Section
dashboardLink.addEventListener('click', (e) => {
    e.preventDefault();
    dashboardSection.classList.remove('d-none');
    tableSection.classList.add('d-none');
});

// Show Table Section
tablesLink.addEventListener('click', (e) => {
    e.preventDefault();
    dashboardSection.classList.add('d-none');
    tableSection.classList.remove('d-none');
});

let unit = 'metric'; // Default unit is Celsius
let currentCity = ''; // Track the currently searched city
let forecastData = []; // Store forecast data for pagination
let currentPage = 1;
let itemsPerPage = 2;
let filteredData = []; // Data to hold filtered results
let isRainFiltered = false; // Track whether rain filter is applied
let barChart, doughnutChart, lineChart;

// JavaScript to handle unit selection with dropdown
const unitSelect = document.getElementById('unit-select');

unitSelect.addEventListener('change', async () => {
    unit = unitSelect.value; // Get the selected unit value
    if (currentCity) {
        // Re-fetch data if a city has already been searched
        await getWeather({ city: currentCity });
    }
});

// Click event to fetch weather data
getWeatherBtn.addEventListener('click', async () => {
    const city = cityInput.value.trim();
    const latitude = latitudeInput.value.trim();
    const longitude = longitudeInput.value.trim();

    if (city) {
        currentCity = city; // Store the searched city
        await getWeather({ city });
    } else if (latitude && longitude) {
        await getWeather({ lat: latitude, lon: longitude }); // Search by latitude and longitude
    } else {
        alert('Please enter a city name or latitude and longitude');
    }
});

// Group forecast data by day
function groupForecastByDay(data) {
    const grouped = {};
    data.forEach(forecast => {
        const date = forecast.dt_txt.split(' ')[0];
        if (!grouped[date]) {
            grouped[date] = [];
        }
        grouped[date].push(forecast);
    });
    return Object.values(grouped); // Return an array of day groups
}

// Function to fetch current weather and 5-day forecast data
async function getWeather({ city, lat, lon }) {
    let weatherUrl = '';
    let forecastUrl = '';

    if (city) {
        weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${unit}&appid=${apiKey}`;
        forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=${unit}&appid=${apiKey}`;
    } else if (lat && lon) {
        weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${unit}&appid=${apiKey}`;
        forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${unit}&appid=${apiKey}`;
    }

    try {
        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();

        const forecastResponse = await fetch(forecastUrl);
        const forecastResult = await forecastResponse.json();

        if (weatherResponse.ok && forecastResponse.ok) {
            displayWeather(weatherData);
            updateVideo(weatherData.weather[0].main);
            forecastData = groupForecastByDay(forecastResult.list);
            filteredData = forecastData;
            currentPage = 1;
            renderPaginatedData(currentPage);

            // Update the charts after successfully fetching the forecast data
            updateCharts(forecastResult);
        } else {
            handleError(weatherData);
        }
    } catch (error) {
        weatherInfo.innerHTML = `<p>Unable to fetch weather data</p>`;
    }
}

// Function to display weather data in the weather-info section
function displayWeather(data) {
    const { name, main, weather, wind } = data;
    const weatherHTML = `
        <h2>${name ? name : 'Location'}</h2>
        <p>Temperature: ${main.temp}° ${unit === 'metric' ? 'C' : 'F'}</p>
        <p>Humidity: ${main.humidity}%</p>
        <p>Wind Speed: ${wind.speed} ${unit === 'metric' ? 'm/s' : 'mph'}</p>
        <p>Weather: ${weather[0].description}</p>
    `;

    // Update weather info on Dashboard
    document.getElementById('weather-info').innerHTML = weatherHTML;
    
    // Update weather info on Table page
    document.getElementById('weather-info-table').innerHTML = weatherHTML;
}

// Function to update the background video based on the weather condition
function updateVideo(weatherCondition) {
    let videoFile;
    switch (weatherCondition.toLowerCase()) {
        case 'clear':
        case 'sunny':
            videoFile = 'sunny.mp4';
            break;
        case 'clouds':
        case 'cloudy':
            videoFile = 'cloudy.mp4';
            break;
        case 'rain':
        case 'rainy':
            videoFile = 'rain.mp4';
            break;
        case 'wind':
        case 'windy':
            videoFile = 'windy.mp4';
            break;
        case 'storm':
        case 'stormy':
            videoFile = 'thunder.mp4';
            break;
        
        default:
            videoFile = 'deafult.mp4';
            break;
    }
    videoSource.setAttribute('src', videoFile);
    document.getElementById('weather-video').load();
}

// Function to update the charts with real forecast data
function updateCharts(forecastData) {
    const tempData = [];
    const labels = [];
    const weatherCounts = { 'Clear': 0, 'Clouds': 0, 'Rain': 0 };

    // Loop through the forecast data and extract temperatures and weather conditions
    forecastData.list.forEach((forecast, index) => {
        if (index % 8 === 0) { // Assuming 8 data points per day for a 5-day forecast
            tempData.push(forecast.main.temp); // Temperature
            labels.push(new Date(forecast.dt_txt).toLocaleDateString()); // Date label
            const weatherType = forecast.weather[0].main;
            if (weatherCounts[weatherType] !== undefined) {
                weatherCounts[weatherType]++;
            }
        }
    });

    // Ensure that the canvas elements are present
    const barChartElement = document.getElementById('barChart');
    const doughnutChartElement = document.getElementById('doughnutChart');
    const lineChartElement = document.getElementById('lineChart');

    // Destroy previous charts if they exist to avoid overlapping
    if (barChart) barChart.destroy();
    if (doughnutChart) doughnutChart.destroy();
    if (lineChart) lineChart.destroy();

    // Initialize the bar chart for temperature
    barChart = new Chart(barChartElement, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: `Temperature (${unit === 'metric' ? 'Celsius' : 'Fahrenheit'})`,
                data: tempData,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#000' // Set legend text color to black for visibility
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: '#ddd' // Light grid color for x-axis
                    }
                },
                y: {
                    grid: {
                        color: '#ddd' // Light grid color for y-axis
                    }
                }
            }
        }
    });

    // Initialize the doughnut chart for weather conditions
    const weatherData = Object.values(weatherCounts);
    doughnutChart = new Chart(doughnutChartElement, {
        type: 'doughnut',
        data: {
            labels: Object.keys(weatherCounts),
            datasets: [{
                data: weatherData,
                backgroundColor: ['rgba(255, 206, 86, 0.2)', 'rgba(128, 128, 128, 0.2)', 'rgba(54, 162, 235, 0.2)'],
                borderColor: ['#FFCE56', '#808080', '#36A2EB'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#000' // Set legend text color to black for visibility
                    }
                }
            }
        }
    });

    // Initialize the line chart for temperature trend
    lineChart = new Chart(lineChartElement, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `Temperature (${unit === 'metric' ? 'Celsius' : 'Fahrenheit'})`,
                data: tempData,
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                borderColor: 'rgba(153, 102, 255, 1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#000' // Set legend text color to black for visibility
                    }
                }
            }
        }
    });
}



// Chatbot Functionality
chatSendBtn.addEventListener('click', handleChatInput);

// Check if the query is weather-related by matching keywords
function isWeatherQuery(query) {
    const weatherKeywords = ['weather', 'temperature', 'forecast', 'humidity', 'wind', 'rain', 'sunny', 'cloudy', 'storm'];
    return weatherKeywords.some(keyword => query.toLowerCase().includes(keyword));
}

// Extract city name from the query dynamically
function extractCityFromQuery(query) {
    const words = query.toLowerCase().split(" ");
    const inIndex = words.indexOf("in");
    if (inIndex !== -1 && inIndex < words.length - 1) {
        // The word after "in" is considered a city name
        return words.slice(inIndex + 1).join(" ").trim();
    }
    return null;
}

// Fetch weather data for the identified city
async function fetchWeatherData(city) {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${unit}&appid=${apiKey}`;
    try {
        const response = await fetch(weatherUrl);
        if (response.ok) {
            return await response.json();
        } else {
            console.error("City not found:", city);
        }
    } catch (error) {
        console.error("Error fetching weather data:", error);
    }
    return null;
}

// Handle chat input event
async function handleChatInput() {
    const query = chatInput.value.trim();
    if (!query) return;

    addChatMessage('user', query);

    if (isWeatherQuery(query)) {
        const city = extractCityFromQuery(query);
        if (city) {
            const weatherData = await fetchWeatherData(city);
            if (weatherData) {
                const weatherDescription = weatherData.weather[0].description;
                const temperature = weatherData.main.temp;
                const temperatureUnit = unit === 'metric' ? 'C' : 'F';
                addChatMessage('bot', `The weather in ${city} is ${weatherDescription} (${temperature}°${temperatureUnit})`);
            } else {
                addChatMessage('bot', `I couldn't fetch weather data for "${city}". Please check the city name.`);
            }
        } else {
            addChatMessage('bot', "Please specify a city to get the weather information.");
        }
    } else {
        const response = await getGeminiResponse(query);
        addChatMessage('bot', response);
    }

    chatInput.value = '';
}

// Add chat message to chat log
function addChatMessage(sender, message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
    messageElement.textContent = message;
    chatLog.appendChild(messageElement);
    chatLog.scrollTop = chatLog.scrollHeight;
}

// Placeholder for external API response handling
async function getGeminiResponse(query) {
    try {
        const response = await fetch('https://api.gemini.example/v1/query', { // Replace with Gemini API endpoint
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${geminiApiKey}`
            },
            body: JSON.stringify({ query: query, user_id: 'user_123' })
        });

        const data = await response.json();
        return data.reply || "I'm not sure how to answer that.";
    } catch (error) {
        return "I am currently able to answer weather-related queries.";
    }
}


async function handleChatInput() {
    const query = chatInput.value.trim();
    if (!query) return;

    addChatMessage('user', query);

    if (isWeatherQuery(query)) {
        const city = extractCityFromQuery(query);
        if (city) {
            await getWeather({ city });
            const weatherData = await fetchWeatherData(city);
            if (weatherData) {
                const weatherDescription = weatherData.weather[0].description;
                const temperature = weatherData.main.temp;
                const temperatureUnit = unit === 'metric' ? 'C' : 'F';
                addChatMessage('bot', `The weather in ${city} is ${weatherDescription} (${temperature}°${temperatureUnit})`);
            } else {
                addChatMessage('bot', "I couldn't fetch the weather data right now.");
            }
        } else {
            addChatMessage('bot', "I am currently able to answer weather-related queries.");
        }
    } else {
        const response = await getGeminiResponse(query);
        addChatMessage('bot', response);
    }

    chatInput.value = '';
}

async function fetchWeatherData(city) {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${unit}&appid=${apiKey}`;
    try {
        const response = await fetch(weatherUrl);
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.error("Error fetching weather data:", error);
    }
    return null;
}

function addChatMessage(sender, message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
    messageElement.textContent = message;
    chatLog.appendChild(messageElement);
    chatLog.scrollTop = chatLog.scrollHeight;
}

// Sort, Filter, and Paginate Table Functions
function renderPaginatedData(page) {
    forecastBody.innerHTML = ''; // Clear previous rows

    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    paginatedData.forEach(day => {
        day.forEach(forecast => {
            const date = forecast.dt_txt.split(' ')[0];
            const temp = forecast.main.temp;
            const condition = forecast.weather[0].description;

            const row = `
                <tr>
                    <td>${date}</td>
                    <td>${formatTemperature(temp)}</td>
                    <td>${condition}</td>
                </tr>
            `;
            forecastBody.innerHTML += row;
        });
    });

    updatePagination(filteredData.length);
}


function updatePagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    pagination.innerHTML = ''; // Clear previous pagination buttons

    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.classList.add('page-btn');
        if (i === currentPage) pageButton.classList.add('active');
        pageButton.addEventListener('click', () => {
            currentPage = i;
            renderPaginatedData(i);
        });
        pagination.appendChild(pageButton);
    }
}


// Sort ascending
sortAscBtn.addEventListener('click', () => {
    filteredData.forEach(day => {
        day.sort((a, b) => a.main.temp - b.main.temp);
    });
    renderPaginatedData(currentPage);
});

// Sort descending
sortDescBtn.addEventListener('click', () => {
    filteredData.forEach(day => {
        day.sort((a, b) => b.main.temp - a.main.temp);
    });
    renderPaginatedData(currentPage);
});

// Filter days without rain
filterRainBtn.addEventListener('click', () => {
    isRainFiltered = !isRainFiltered;
    if (isRainFiltered) {
        filteredData = forecastData.filter(day => day.every(forecast => !forecast.weather[0].description.includes('rain')));
        alert('Filtered out days with rain.');
    } else {
        filteredData = forecastData;
    }
    currentPage = 1; // Reset to first page after filter
    renderPaginatedData(currentPage);
});
// Find the day with the highest temperature
highestTempBtn.addEventListener('click', () => {
    let highestTempForecast = null;
    let highestTemp = -Infinity;

    // Loop through all forecast data to find the forecast with the highest temperature
    forecastData.forEach(day => {
        day.forEach(forecast => {
            if (forecast.main.temp > highestTemp) {
                highestTemp = forecast.main.temp;
                highestTempForecast = forecast;
            }
        });
    });

    if (highestTempForecast) {
        // Clear the table
        forecastBody.innerHTML = ''; 

        // Display only the row with the highest temperature
        const date = highestTempForecast.dt_txt.split(' ')[0];
        const temp = highestTempForecast.main.temp;
        const condition = highestTempForecast.weather[0].description;

        const row = `
            <tr style="background-color: rgba(255, 0, 0, 0.3); font-weight: bold;">
                <td>${date}</td>
                <td>${formatTemperature(temp)}</td>
                <td>${condition}</td>
            </tr>
        `;
        forecastBody.innerHTML = row;
    } else {
        alert("No data available to find the highest temperature.");
    }
});

// Add event listener for the table search button
const searchTableBtn = document.getElementById('search-table-btn');
const citySearch = document.getElementById('city-search');
const latitudeSearch = document.getElementById('latitude-search');
const longitudeSearch = document.getElementById('longitude-search');

// Filter table data based on the search input values
searchTableBtn.addEventListener('click', () => {
    const cityValue = citySearch.value.trim().toLowerCase();
    const latitudeValue = parseFloat(latitudeSearch.value.trim());
    const longitudeValue = parseFloat(longitudeSearch.value.trim());

    // Filter based on city name, latitude, or longitude
    filteredData = forecastData.filter(day =>
        day.some(forecast => {
            const cityMatch = cityValue ? forecast.city.toLowerCase().includes(cityValue) : true;
            const latitudeMatch = !isNaN(latitudeValue) ? forecast.coord.lat === latitudeValue : true;
            const longitudeMatch = !isNaN(longitudeValue) ? forecast.coord.lon === longitudeValue : true;
            return cityMatch && latitudeMatch && longitudeMatch;
        })
    );

    // Reset to first page after filtering
    currentPage = 1;
    renderPaginatedData(currentPage);
});

// Find the day with the highest temperature
highestTempBtn.addEventListener('click', () => {
    let highestTempForecast = null;
    let highestTemp = -Infinity;

    // Loop through all forecast data to find the forecast with the highest temperature
    forecastData.forEach(day => {
        day.forEach(forecast => {
            if (forecast.main.temp > highestTemp) {
                highestTemp = forecast.main.temp;
                highestTempForecast = forecast;
            }
        });
    });

    if (highestTempForecast) {
        // Clear the table
        forecastBody.innerHTML = ''; 

        // Display only the row with the highest temperature
        const date = highestTempForecast.dt_txt.split(' ')[0];
        const temp = highestTempForecast.main.temp;
        const condition = highestTempForecast.weather[0].description;

        const row = `
            <tr style="background-color: rgba(255, 0, 0, 0.3); font-weight: bold;">
                <td>${date}</td>
                <td>${formatTemperature(temp)}</td>
                <td>${condition}</td>
            </tr>
        `;
        forecastBody.innerHTML = row;
    } else {
        alert("No data available to find the highest temperature.");
    }
});


function formatTemperature(temp) {
    return unit === 'metric' ? `${temp.toFixed(2)}°C` : `${((temp * 9) / 5 + 32).toFixed(2)}°F`;
}

function handleError(data) {
    weatherInfo.innerHTML = `<p>${data.message}</p>`;
}
