const express = require('express');
const router = express.Router();
const { register, logIn } = require('../controller/authpage');
const { userValidators } = require('../validator/authpage');
const { validationResult } = require('express-validator')
router.post('/register', userValidators, register);
router.post('/login', userValidators, logIn);

module.exports = router;