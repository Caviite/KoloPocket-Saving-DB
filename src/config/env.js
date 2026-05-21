const dotenv = require('dotenv');
dotenv.config();

const env = {
  PORT: process.env.PORT ,  
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  EXPIRE_IN: process.env.EXPIRE_IN,
  APP_PASSWORD: process.env.APP_PASSWORD,
  APP_EMAIL: process.env.APP_EMAIL
}

module.exports = env;