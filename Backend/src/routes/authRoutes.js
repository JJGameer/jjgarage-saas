const express = require("express");
const { register, login } = require("../controllers/authController.js");

const router = express.Router();

// Rota: POST /auth/register
router.post("/register", register);

// Rota: POST /auth/login
router.post("/login", login);

module.exports = router;
