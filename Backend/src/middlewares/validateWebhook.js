const { validateWhopSignature } = require("../utils/security.js");

const validateWhopWebhook = (req, res, next) => {
  const signature = req.headers["x-whop-signature"];
  const secret = process.env.WHOP_WEBHOOK_SECRET;

  // Se não estiver configurado, aceitar (desenvolvimento)
  if (!secret) {
    console.warn(
      "⚠️ Webhook Whop não validado (WHOP_WEBHOOK_SECRET não configurado)",
    );
    return next();
  }

  if (!signature) {
    return res
      .status(400)
      .json({ error: "Assinatura do webhook não fornecida" });
  }

  try {
    const isValid = validateWhopSignature(req.body, signature, secret);
    if (!isValid) {
      return res.status(401).json({ error: "Assinatura do webhook inválida" });
    }
    return next();
  } catch (error) {
    console.error("❌ Erro ao validar webhook:", error);
    return res.status(500).json({ error: "Erro ao validar webhook" });
  }
};

module.exports = validateWhopWebhook;
