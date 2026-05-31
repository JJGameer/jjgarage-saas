const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("../config/db.js");
const { sendEmail, emailRecuperacaoPassword } = require("../services/emailService.js");

const register = async (req, res) => {
  const { NomeOficina, Email, Password, CodigoAcesso } = req.body;

  try {
    const [codigos] = await db
      .promise()
      .query("SELECT * FROM CodigoConvite WHERE Codigo = ? AND Usado = FALSE", [
        CodigoAcesso,
      ]);

    if (codigos.length === 0) {
      return res
        .status(400)
        .json({ error: "Código de acesso inválido ou já utilizado." });
    }

    //Guardar o Id código para "queimar" depois
    const codigoId = codigos[0].CodigoId;

    const [existing] = await db
      .promise()
      .query("SELECT * FROM Oficina WHERE Email = ?", [Email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: "Este email já está registado." });
    }

    //encriptação
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(Password, salt);

    //guardar o registo
    const [result] = await db
      .promise()
      .query(
        "INSERT INTO Oficina (NomeOficina, Email, PasswordHash) VALUES (?, ?, ?)",
        [NomeOficina, Email, hashedPassword],
      );

    //"queimar" para que nunca mais possa ser usado
    await db
      .promise()
      .query("UPDATE CodigoConvite SET Usado = TRUE WHERE CodigoId= ?", [
        codigoId,
      ]);

    res.status(201).json({
      message: "Registo concluído com sucesso!",
      OficinaId: result.insertId,
    });
  } catch (error) {
    console.error("Erro no registo", error);
    res.status(500).json({ error: "Erro interno ao registar oficina." });
  }
};

const login = async (req, res) => {
  const { Email, Password } = req.body;

  try {
    //procurar oficina por email
    const [oficinas] = await db
      .promise()
      .query("SELECT * FROM Oficina WHERE Email = ?", [Email]);
    if (oficinas.length === 0) {
      return res.status(404).json({ error: "Conta não encontrada." });
    }

    const oficina = oficinas[0];

    // Verificar se a subscrição está ativa
    if (oficina.Status === 0) {
      return res.status(403).json({
        error: "A sua subscrição está suspensa. Por favor, regularize o pagamento no Whop.",
      });
    }

    const validPassword = await bcrypt.compare(Password, oficina.PasswordHash);
    if (!validPassword) {
      return res.status(401).json({ error: "Palavra-passe incorreta." });
    }

    //gerar o token JWT
    const token = jwt.sign(
      { OficinaId: oficina.OficinaId },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    //devolver o token e os dados para o frontend
    res.status(200).json({
      message: "Login efetuado com sucesso!",
      token: token,
      oficina: {
        id: oficina.OficinaId,
        nome: oficina.NomeOficina,
        email: oficina.Email,
      },
    });
  } catch (error) {
    console.error("Erro no Login:", error);
    res.status(500).json({ error: "Erro interno ao fazer login." });
  }
};

const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const oficiaId = req.oficinaId;

  try {
    const [oficinas] = await db
      .promise()
      .query("SELECT * FROM Oficina WHERE OficinaId = ?", [oficiaId]);

    if (oficinas.length === 0) {
      return res.status(404).json({ error: "Oficina não encontrada." });
    }

    const oficina = oficinas[0];

    const validPassword = await bcrypt.compare(
      currentPassword,
      oficina.PasswordHash,
    );
    if (!validPassword) {
      return res.status(401).json({ error: "Palavra-passe atual incorreta." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db
      .promise()
      .query("UPDATE Oficina SET PasswordHash = ? WHERE OficinaId = ?", [
        hashedPassword,
        oficiaId,
      ]);

    res.status(200).json({ message: "Palavra-passe atualizada com sucesso!" });
  } catch (error) {
    console.error("Erro ao atualizar palavra-passe:", error);
    res.status(500).json({ error: "Erro interno ao atualizar palavra-passe." });
  }
};

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
      return res.status(200).json({
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
      return res.status(400).json({ error: "Token inválido ou expirado." });
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

module.exports = { register, login, updatePassword, forgotPassword, resetPassword };
