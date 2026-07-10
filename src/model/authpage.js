const mongoose = require('mongoose')

const authPageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        unique: true,
        sparse: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: function () {
            // 'this' refers to the user document being saved.
            // It returns true (required) ONLY if googleId does not exist.
            return !this.googleId;
        },
        minlength: 8,
        select: false, // don't return password by default
    },
    role: {
        type: String,
        enum: ['alajo', 'contributor'],
        default: 'alajo',
        required: true
    },

    googleId: {
        type: String,
        unique: true,
        sparse: true // Allows multiple users to have 'undefined' if they sign up normally
    },

    // ── NEW: Groups created by this Alajo ──
    groupsCreated: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Group',
        }
    ],

    // ── NEW: If this user is a contributor, who added them? ──
    alajo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AuthPage',
        default: null,
    },

    // ── Optional profile fields ──
    avatar: {
        type: String,
        default: null,
    },
    address: {
        type: String,
        default: null,
    },

}, { timestamps: true });

module.exports = mongoose.model('AuthPage', authPageSchema, 'auth')