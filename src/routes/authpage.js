const express = require('express');
const router = express.Router();
const jwt = require("jsonwebtoken");
const { register, logIn } = require('../controller/authpage');
const { userValidators } = require('../validator/authpage');
const { validationResult } = require('express-validator')
const { googleAuth } = require("../controller/authpage");

router.post('/register', userValidators, register);
router.post('/login', userValidators, logIn);
router.post("/googleauth", googleAuth);
module.exports = router;