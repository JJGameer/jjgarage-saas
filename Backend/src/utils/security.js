const crypto = require("crypto");

// Validar assinatura do webhook Whop
const validateWhopSignature = (payload, signature, secret) => {
  if (!secret) {
    console.warn("⚠️ WHOP_WEBHOOK_SECRET não configurado");
    return true; // Aceitar se não estiver configurado (desenvolvimento)
  }

  const hash = crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(payload))
    .digest("hex");

  const hashBuffer = Buffer.from(hash, "hex");
  const signatureBuffer = Buffer.from(signature, "hex");

  // Verificar tamanho antes de usar timingSafeEqual
  if (hashBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(hashBuffer, signatureBuffer);
};

// Gerar token seguro para reset de password
const generateSecureToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// Hash de token
const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

module.exports = {
  validateWhopSignature,
  generateSecureToken,
  hashToken,
};
