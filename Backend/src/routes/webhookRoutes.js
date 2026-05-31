const express = require("express");
const { handleWhopWebhook } = require("../controllers/webhookController.js");
const validateWhopWebhook = require("../middlewares/validateWebhook.js");

const router = express.Router();

// Rota: POST /api/webhooks/whop
// Middleware validateWhopWebhook é opcional (ativar quando secret estiver configurado)
router.post("/whop", validateWhopWebhook, handleWhopWebhook);

module.exports = router;
