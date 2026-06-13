const db = require("../config/db");

const ADMIN_OFICINA_ID = 1;

const obterNumeroAnonimo = async (oficinaId) => {
  const [existente] = await db
    .promise()
    .query("SELECT NumeroAnonimo FROM ForumAnonimo WHERE OficinaId = ?", [
      oficinaId,
    ]);

  if (existente.length) {
    return existente[0].NumeroAnonimo;
  }

  const [proximoResult] = await db
    .promise()
    .query(
      "SELECT COALESCE(MAX(NumeroAnonimo), 0) + 1 AS Proximo FROM ForumAnonimo",
    );

  const proximo = proximoResult[0].Proximo;

  await db
    .promise()
    .query(
      "INSERT INTO ForumAnonimo (OficinaId, NumeroAnonimo) VALUES (?, ?)",
      [oficinaId, proximo],
    );

  return proximo;
};

const mapearSugestao = (row, oficinaId) => ({
  Id: row.SugestaoId,
  Texto: row.Texto,
  Utilizador:
    row.OficinaId === ADMIN_OFICINA_ID ? "Admin" : row.NumeroAnonimo,
  Aprovada: Boolean(row.Aprovada),
  Minha: row.OficinaId === oficinaId,
  DataCriacao: row.DataCriacao,
});

exports.getSugestoes = async (req, res) => {
  const oficinaId = req.oficinaId;
  const isAdmin = oficinaId === ADMIN_OFICINA_ID;

  try {
    const meuNumeroAnonimo = await obterNumeroAnonimo(oficinaId);

    const filtroAprovacao = isAdmin ? "" : "WHERE s.Aprovada = 1";

    const sql = `
      SELECT
        s.SugestaoId,
        s.OficinaId,
        s.Texto,
        s.Aprovada,
        s.DataCriacao,
        fa.NumeroAnonimo
      FROM Sugestao s
      INNER JOIN ForumAnonimo fa ON s.OficinaId = fa.OficinaId
      ${filtroAprovacao}
      ORDER BY s.DataCriacao DESC
    `;

    const [rows] = await db.promise().query(sql);

    res.json({
      sugestoes: rows.map((row) => mapearSugestao(row, oficinaId)),
      meuNumeroAnonimo,
      isAdmin,
    });
  } catch (error) {
    console.error("Erro ao carregar sugestões:", error);
    res.status(500).json({ erro: "Erro ao carregar as sugestões." });
  }
};

exports.addSugestao = async (req, res) => {
  const oficinaId = req.oficinaId;
  const { Texto } = req.body;

  if (!Texto || !String(Texto).trim()) {
    return res.status(400).json({ erro: "A sugestão não pode estar vazia." });
  }

  const textoLimpo = String(Texto).trim();

  if (textoLimpo.length > 500) {
    return res
      .status(400)
      .json({ erro: "A sugestão não pode exceder 500 caracteres." });
  }

  try {
    await obterNumeroAnonimo(oficinaId);

    const [result] = await db.promise().query(
      "INSERT INTO Sugestao (OficinaId, Texto, Aprovada) VALUES (?, ?, 0)",
      [oficinaId, textoLimpo],
    );

    res.status(201).json({ id: result.insertId });
  } catch (error) {
    console.error("Erro ao criar sugestão:", error);
    res.status(500).json({ erro: "Erro ao publicar a sugestão." });
  }
};

exports.aprovarSugestao = async (req, res) => {
  if (req.oficinaId !== ADMIN_OFICINA_ID) {
    return res.status(403).json({ erro: "Acesso negado." });
  }

  const sugestaoId = req.params.id;

  try {
    const [result] = await db.promise().query(
      "UPDATE Sugestao SET Aprovada = 1 WHERE SugestaoId = ?",
      [sugestaoId],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: "Sugestão não encontrada." });
    }

    res.json({ message: "Sugestão aprovada." });
  } catch (error) {
    console.error("Erro ao aprovar sugestão:", error);
    res.status(500).json({ erro: "Erro ao aprovar a sugestão." });
  }
};

exports.eliminarSugestao = async (req, res) => {
  if (req.oficinaId !== ADMIN_OFICINA_ID) {
    return res.status(403).json({ erro: "Acesso negado." });
  }

  const sugestaoId = req.params.id;

  try {
    const [result] = await db.promise().query(
      "DELETE FROM Sugestao WHERE SugestaoId = ?",
      [sugestaoId],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: "Sugestão não encontrada." });
    }

    res.json({ message: "Sugestão eliminada." });
  } catch (error) {
    console.error("Erro ao eliminar sugestão:", error);
    res.status(500).json({ erro: "Erro ao eliminar a sugestão." });
  }
};
