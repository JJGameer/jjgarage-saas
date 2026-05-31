const express = require("express");
const {
  register,
  login,
  updatePassword,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController.js");
const verificarToken = require("../middlewares/authMiddleware.js");

const router = express.Router();

// Rota: POST /auth/register
router.post("/register", register);

// Rota: POST /auth/login
router.post("/login", login);

// Rota: PUT /auth/update-password
router.put("/update-password", verificarToken, updatePassword);

// Rota: POST /auth/forgot-password
router.post("/forgot-password", forgotPassword);

// Rota: POST /auth/reset-password
router.post("/reset-password", resetPassword);

module.exports = router;
