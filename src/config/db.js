const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async () => {
    try {
        const connect = await mongoose.connect(env.MONGO_URI);
        if (connect) {
            console.log('Connected to MongoDB');
        }
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
}

module.exports = connectDB; 