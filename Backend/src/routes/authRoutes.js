const express = require("express");
const {
  register,
  login,
  updatePassword,
} = require("../controllers/authController.js");
const verificarToken = require("../middlewares/authMiddleware.js");

const router = express.Router();

// Rota: POST /auth/register
router.post("/register", register);

// Rota: POST /auth/login
router.post("/login", login);

// Rota: PUT /auth/update-password
router.put("/update-password", verificarToken, updatePassword);

module.exports = router;
