const nodemailer = require('nodemailer');
const env = require('../config/env.js');

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { 
        user: env.APP_EMAIL,
        pass: env.APP_PASSWORD
    }
});

const mailOption = (email, subject, html) => {
    return {
        from: env.app_email,
        to: email,
        subject: subject,
        html: html
    };
};

const sendMail = (email, name) => {
    const option = mailOption(
        email,
         'Welcome to KoloPocket — Your Journey Starts Here! 🎉', 
        `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1a1a1a;">Welcome to KoloPocket! 🎉</h1>
        
        <p style="color: #444; line-height: 1.8;">
            Hi <strong>${name}</strong>, we're thrilled to have you join the KoloPocket family!
        </p>

        <p style="color: #444; line-height: 1.8;">
            KoloPocket is your personal savings hub — built to help you save smarter, 
            contribute consistently, and achieve your financial goals one step at a time. 
            Whether you're saving for something big or building a habit, we've got you covered.
        </p>

        <p style="color: #444; line-height: 1.8;">
            Here's what you can do to get started:
        </p>

        <ul style="color: #444; line-height: 2;">
            <li>Set up your savings goal</li>
            <li>Make your first contribution</li>
            <li>Track your progress on your dashboard</li>
        </ul>

        <p style="color: #444; line-height: 1.8;">
            If you ever need help or have any questions, our support team is always 
            here for you. Simply reply to this email and we'll get back to you.
        </p>

        <p style="color: #444; line-height: 1.8;">
            Here's to building a better financial future — one kolo at a time. 💰
        </p>

        <p style="color: #444;">
            Warm regards,<br/>
            <strong>The KoloPocket Team</strong>
        </p>
        </div>`

    );
    transporter.sendMail(option, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent successfully:', info.response);
        }
    });
}

module.exports = { sendMail, transporter };