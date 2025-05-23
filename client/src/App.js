import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const [city, setCity] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const fetchCitySuggestions = async (query) => {
    if (!query) return;
    try {
      const response = await axios.get('https://wft-geo-db.p.rapidapi.com/v1/geo/cities', {
        headers: {
          'X-RapidAPI-Key': 'aada828500msh9da3cf876af46bap164e79jsn43ab78a0f732', 
          'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com',
        },
        params: {
          namePrefix: query,
          limit: 5,
          sort: '-population',
        },
      });

      const results = response.data.data.map(
        (city) => `${city.city}${city.region ? ', ' + city.region : ''}, ${city.country}`
      );
      setSuggestions(results);
    } catch (error) {
      console.error('City suggestions error:', error);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setCity(value);
    fetchCitySuggestions(value);
  };

  const handleSuggestionClick = (suggestion) => {
    setCity(suggestion);
    setSuggestions([]);
  };

  const getWeather = async () => {
    if (!city) {
      alert('❌ Please select a city.');
      return;
    }

    const parsedCity = city
      .split(',')[0]
      .replace(/\b(district|region|province)\b/gi, '')
      .trim();

    if (!parsedCity || parsedCity.length < 2) {
      alert('❌ Please select a valid city from suggestions.');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/weather/${parsedCity}`);

      if (response.status === 200) {
        setWeather(response.data);
        fetchHistory();
      } else {
        alert('⚠️ Could not retrieve weather data.');
      }
    } catch (err) {
      console.error('Weather fetch error:', err.response?.data || err.message);
      alert('❌ Could not fetch weather. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/history');
      setHistory(res.data);
    } catch (err) {
      console.error('History fetch error:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="container d-flex justify-content-center align-items-center flex-column text-center mt-5">
      <h1 className="mb-4">🌤️ Weather App</h1>

      <div className="mb-3 position-relative w-100" style={{ maxWidth: '400px' }}>
        <input
          className="form-control text-center"
          value={city}
          onChange={handleInputChange}
          placeholder="Enter city name"
        />
        {suggestions.length > 0 && (
          <ul className="list-group position-absolute w-100 z-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {suggestions.map((s, index) => (
              <li
                key={index}
                className="list-group-item list-group-item-action"
                onClick={() => handleSuggestionClick(s)}
                style={{ cursor: 'pointer' }}
              >
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>

      <button className="btn btn-primary mb-2" onClick={getWeather}>
        {loading ? 'Loading...' : 'Get Weather'}
      </button>

      {weather && (
        <div className="card mb-3 text-center" style={{ maxWidth: '400px' }}>
          <div className="card-body">
            <h3>{weather.name}</h3>
            <p>Temperature: {weather.main.temp} °C</p>
            <p>Condition: {weather.weather[0].description}</p>
            <img
              src={`http://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
              alt="Weather Icon"
            />
          </div>
        </div>
      )}

      <button
        className="btn btn-outline-secondary mb-3"
        onClick={() => setShowHistory(!showHistory)}
      >
        {showHistory ? 'Hide Search History' : 'Show Search History'}
      </button>

      {showHistory && (
        <div style={{ maxWidth: '500px' }}>
          <ul className="list-group">
            {history.map((item, index) => (
              <li key={index} className="list-group-item d-flex align-items-center justify-content-start">
                <img
                  src={`http://openweathermap.org/img/wn/${item.icon}@2x.png`}
                  alt={item.description}
                  style={{ width: 40, marginRight: 12 }}
                />
                <div>
                  <strong>{item.city}</strong> - {item.temperature} °C - {item.description}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
