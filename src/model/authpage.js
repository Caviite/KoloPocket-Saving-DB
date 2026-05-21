const mongoose = require('mongoose')

const authPageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },

    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
        required: true
    },

    password: {
        type: String,
        required: true,
        minlength: 8
    }
}, { timestamps: true });


module.exports = mongoose.model('AuthPage', authPageSchema, 'auth')