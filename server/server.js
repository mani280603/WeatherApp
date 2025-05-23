require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.log('❌ MongoDB connection error:', err));

const WeatherSchema = new mongoose.Schema({
  city: String,
  temperature: Number,
  description: String,
  icon: String,
  date: { type: Date, default: Date.now }
});

const Weather = mongoose.model('Weather', WeatherSchema);

app.get('/api/weather/:city', async (req, res) => {
  const city = req.params.city;
  try {
    const apiKey = process.env.WEATHER_API_KEY;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    const response = await axios.get(url);
    const data = response.data;

    const weather = new Weather({
      city: data.name,
      temperature: data.main.temp,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
    });

    await weather.save();

    res.json({
      name: data.name,
      main: {
        temp: data.main.temp
      },
      weather: [
        {
          description: data.weather[0].description,
          icon: data.weather[0].icon
        }
      ]
    });
  } catch (error) {
    console.error('Weather fetch error:', error);
    res.status(500).json({ message: 'Error fetching weather data' });
  }
});

app.get('/api/history', async (req, res) => {
  try {
    const history = await Weather.find().sort({ date: -1 });
    res.json(history);
  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({ message: 'Error fetching history' });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
