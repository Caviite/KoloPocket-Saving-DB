const express = require('express');
const connectDB = require('./src/config/db');
const app = express();
const cors = require('cors');
const authpageRoute = require('./src/routes/authpage');

const allowedOrigins = [
  'http://localhost:5173',
  'https://kolopocket.vercel.app'
];

app.use(cors({ 
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());
app.use("/auth", authpageRoute);

app.get('/', (req, res) => {
  res.json('Welcome to kolo pocket where contribution saves lives!');
});

connectDB()

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));