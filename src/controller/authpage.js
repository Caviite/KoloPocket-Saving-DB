const AuthPage = require('../model/authpage')
const bcrypt = require('bcrypt');
const saltRound = 10;
const jwt = require('jsonwebtoken');
const { sendMail } = require('../email/mailer');
const { validationResult } = require('express-validator');
const { OAuth2Client } = require("google-auth-library");

// ---------------Google Authentication------------------

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// --------------- Google Authentication ------------------

const googleAuth = async (req, res) => {
    const { credential } = req.body;
    console.log("Incoming request body:", req.body);

    if (!credential) {
        return res.status(400).json({
            success: false,
            message: "The verifyIdToken method requires an ID Token. Check frontend payload."
        });
    }

    try {
        // 1. Verify the Google ID token
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { email, name, sub: googleId } = payload;

        // 2. Check if user already exists
        let user = await AuthPage.findOne({ email });
        let isNewUser = false;

        if (!user) {
            // ─── NEW USER SIGNUP DETECTED VIA GOOGLE ───
            isNewUser = true;
            user = await AuthPage.create({
                name,
                email,
                googleId,
                isVerified: true // Google accounts are pre-verified
            });

            // 🚀 TRIGGER WELCOME EMAIL FOR NEW GOOGLE SIGNUPS
            try {
                await sendMail(email, name);
                console.log(`Welcome email successfully sent to Google user: ${email}`);
            } catch (mailError) {
                // We catch the error here so that if the email server times out, 
                // it doesn't crash the entire login flow for the user.
                console.error("Failed to send welcome email to Google user:", mailError.message);
            }
        }

        // 3. Generate your application's JWT token
        const token = jwt.sign(
            { email: user.email, id: user._id, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: process.env.EXPIRE_IN }
        );

        res.status(200).json({
            success: true,
            token,
            user: { id: user._id, name: user.name, email: user.email },
            isNewUser,
        });
    } catch (error) {
        console.error("Google Auth Error:", error);
        res.status(400).json({ success: false, message: "Google authentication failed" });
    }
};

const register = async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg })
    }
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const existingUser = await AuthPage.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = bcrypt.genSaltSync(saltRound);
        const hashedPassword = bcrypt.hashSync(password, salt);

        const auth = {
            name,
            email,
            password: hashedPassword,
        };

        await AuthPage.create(auth);
        await sendMail(email, name);

        return res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: 'An error occurred while registering the user' });
    }
};

const logIn = async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg })
    }
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const user = await AuthPage.findOne({ email }).select('+password');
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const comparePassword = bcrypt.compareSync(password, user.password);
        if (!comparePassword) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { email: user.email, id: user._id, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: process.env.EXPIRE_IN }
        );

        const users = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        }
        return res.status(200).json({ message: 'User logged in successfully', user: users, token });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: 'An error occurred while logging in the user' });
    }
}



module.exports = { register, logIn, googleAuth };