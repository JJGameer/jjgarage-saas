const db = require("../config/db");

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
  Utilizador: row.NumeroAnonimo,
  Likes: Number(row.Likes) || 0,
  Dislikes: Number(row.Dislikes) || 0,
  MeuVoto: row.MeuVoto || null,
  Minha: row.OficinaId === oficinaId,
  DataCriacao: row.DataCriacao,
});

exports.getSugestoes = async (req, res) => {
  const oficinaId = req.oficinaId;
  const ordenar = req.query.ordenar === "populares" ? "populares" : "recentes";

  try {
    const meuNumeroAnonimo = await obterNumeroAnonimo(oficinaId);

    const orderBy =
      ordenar === "populares"
        ? "(Likes - Dislikes) DESC, s.DataCriacao DESC"
        : "s.DataCriacao DESC";

    const sql = `
      SELECT
        s.SugestaoId,
        s.OficinaId,
        s.Texto,
        s.DataCriacao,
        fa.NumeroAnonimo,
        COALESCE(SUM(CASE WHEN sv.Tipo = 'like' THEN 1 ELSE 0 END), 0) AS Likes,
        COALESCE(SUM(CASE WHEN sv.Tipo = 'dislike' THEN 1 ELSE 0 END), 0) AS Dislikes,
        mv.Tipo AS MeuVoto
      FROM Sugestao s
      INNER JOIN ForumAnonimo fa ON s.OficinaId = fa.OficinaId
      LEFT JOIN SugestaoVoto sv ON s.SugestaoId = sv.SugestaoId
      LEFT JOIN SugestaoVoto mv ON s.SugestaoId = mv.SugestaoId AND mv.OficinaId = ?
      GROUP BY s.SugestaoId, s.OficinaId, s.Texto, s.DataCriacao, fa.NumeroAnonimo, mv.Tipo
      ORDER BY ${orderBy}
    `;

    const [rows] = await db.promise().query(sql, [oficinaId]);

    res.json({
      sugestoes: rows.map((row) => mapearSugestao(row, oficinaId)),
      meuNumeroAnonimo,
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
      "INSERT INTO Sugestao (OficinaId, Texto) VALUES (?, ?)",
      [oficinaId, textoLimpo],
    );

    res.status(201).json({ id: result.insertId });
  } catch (error) {
    console.error("Erro ao criar sugestão:", error);
    res.status(500).json({ erro: "Erro ao publicar a sugestão." });
  }
};

exports.votarSugestao = async (req, res) => {
  const oficinaId = req.oficinaId;
  const sugestaoId = req.params.id;
  const { Tipo } = req.body;

  if (!["like", "dislike"].includes(Tipo)) {
    return res.status(400).json({ erro: "Tipo de voto inválido." });
  }

  try {
    const [sugestao] = await db
      .promise()
      .query("SELECT SugestaoId FROM Sugestao WHERE SugestaoId = ?", [
        sugestaoId,
      ]);

    if (!sugestao.length) {
      return res.status(404).json({ erro: "Sugestão não encontrada." });
    }

    await obterNumeroAnonimo(oficinaId);

    const [votoExistente] = await db.promise().query(
      "SELECT Tipo FROM SugestaoVoto WHERE SugestaoId = ? AND OficinaId = ?",
      [sugestaoId, oficinaId],
    );

    if (votoExistente.length && votoExistente[0].Tipo === Tipo) {
      await db.promise().query(
        "DELETE FROM SugestaoVoto WHERE SugestaoId = ? AND OficinaId = ?",
        [sugestaoId, oficinaId],
      );
    } else if (votoExistente.length) {
      await db.promise().query(
        "UPDATE SugestaoVoto SET Tipo = ? WHERE SugestaoId = ? AND OficinaId = ?",
        [Tipo, sugestaoId, oficinaId],
      );
    } else {
      await db.promise().query(
        "INSERT INTO SugestaoVoto (SugestaoId, OficinaId, Tipo) VALUES (?, ?, ?)",
        [sugestaoId, oficinaId, Tipo],
      );
    }

    const [stats] = await db.promise().query(
      `SELECT
        COALESCE(SUM(CASE WHEN Tipo = 'like' THEN 1 ELSE 0 END), 0) AS Likes,
        COALESCE(SUM(CASE WHEN Tipo = 'dislike' THEN 1 ELSE 0 END), 0) AS Dislikes
      FROM SugestaoVoto
      WHERE SugestaoId = ?`,
      [sugestaoId],
    );

    const [meuVoto] = await db.promise().query(
      "SELECT Tipo FROM SugestaoVoto WHERE SugestaoId = ? AND OficinaId = ?",
      [sugestaoId, oficinaId],
    );

    res.json({
      Likes: Number(stats[0].Likes) || 0,
      Dislikes: Number(stats[0].Dislikes) || 0,
      MeuVoto: meuVoto[0]?.Tipo || null,
    });
  } catch (error) {
    console.error("Erro ao registar voto:", error);
    res.status(500).json({ erro: "Erro ao registar o voto." });
  }
};
