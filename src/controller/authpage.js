const AuthPage = require('../model/authpage')
const bcrypt = require('bcrypt');
const saltRound = 10;
const jwt = require('jsonwebtoken');
const { sendMail } = require('../email/mailer');
const { validationResult } = require('express-validator');
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
        res.json({ message: 'An error occurred while registering the user' });
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

        const user = await AuthPage.findOne({ email });
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



module.exports = { register, logIn };