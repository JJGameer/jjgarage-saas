const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db.js");

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
      oficina: { id: oficina.OficinaId, nome: oficina.NomeOficina },
    });
  } catch (error) {
    console.error("Erro no Login:", error);
    res.status(500).json({ error: "Erro interno ao fazer login." });
  }
};

module.exports = { register, login };
