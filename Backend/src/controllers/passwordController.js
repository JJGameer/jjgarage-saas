const crypto = require("crypto");
const bcrypt = require("bcrypt");
const db = require("../config/db.js");
const { sendEmail, emailRecuperacaoPassword } = require("../services/emailService.js");

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email é obrigatório." });
  }

  try {
    // Procurar oficina pelo email
    const [oficinas] = await db
      .promise()
      .query("SELECT OficinaId, NomeOficina FROM Oficina WHERE Email = ?", [
        email,
      ]);

    if (oficinas.length === 0) {
      // Não revelar se o email existe ou não (segurança)
      return res
        .status(200)
        .json({
          message: "Se o email existir na nossa base de dados, receberá um link para redefinir a palavra-passe.",
        });
    }

    const oficina = oficinas[0];

    // Gerar token seguro
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Guardar token na BD
    await db
      .promise()
      .query(
        "INSERT INTO PasswordReset (OficinaId, TokenHash, ExpiresAt) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE TokenHash = ?, ExpiresAt = ?",
        [oficina.OficinaId, hashedToken, expiresAt, hashedToken, expiresAt],
      );

    // Enviar email com link
    const resetLink = `${process.env.FRONTEND_URL || "https://jjgarage.pt"}/reset-password?token=${resetToken}`;
    const html = emailRecuperacaoPassword(oficina.NomeOficina, resetLink);

    try {
      await sendEmail(email, "Redefinir Palavra-passe JJGarage", html);
    } catch (emailError) {
      console.error("❌ Erro ao enviar email de reset:", emailError);
    }

    res.status(200).json({
      message: "Se o email existir na nossa base de dados, receberá um link para redefinir a palavra-passe.",
    });
  } catch (error) {
    console.error("❌ Erro ao procurar oficina:", error);
    res.status(500).json({ error: "Erro interno ao processar pedido." });
  }
};

const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res
      .status(400)
      .json({ error: "Token e nova palavra-passe são obrigatórios." });
  }

  if (newPassword.length < 8) {
    return res
      .status(400)
      .json({ error: "A palavra-passe deve ter no mínimo 8 caracteres." });
  }

  try {
    // Hash do token fornecido
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
    const now = new Date();

    // Procurar e validar token
    const [resets] = await db
      .promise()
      .query(
        "SELECT OficinaId FROM PasswordReset WHERE TokenHash = ? AND ExpiresAt > ? FOR UPDATE",
        [hashedToken, now],
      );

    if (resets.length === 0) {
      return res
        .status(400)
        .json({ error: "Token inválido ou expirado." });
    }

    const { OficinaId } = resets[0];

    // Hash da nova password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Atualizar password e remover token
    await db
      .promise()
      .query(
        "UPDATE Oficina SET PasswordHash = ? WHERE OficinaId = ?",
        [hashedPassword, OficinaId],
      );

    await db
      .promise()
      .query("DELETE FROM PasswordReset WHERE OficinaId = ?", [OficinaId]);

    res
      .status(200)
      .json({ message: "Palavra-passe atualizada com sucesso!" });
  } catch (error) {
    console.error("❌ Erro ao redefinir password:", error);
    res.status(500).json({ error: "Erro interno ao redefinir palavra-passe." });
  }
};

module.exports = { forgotPassword, resetPassword };
