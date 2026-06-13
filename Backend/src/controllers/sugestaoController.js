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

const mapearVotoResposta = (tipoDb) => {
  if (tipoDb === "like") return "concordo";
  if (tipoDb === "dislike") return "nao_concordo";
  return null;
};

const mapearSugestao = (row, oficinaId) => ({
  Id: row.SugestaoId,
  Texto: row.Texto,
  Utilizador:
    row.OficinaId === ADMIN_OFICINA_ID ? "Admin" : row.NumeroAnonimo,
  Aprovada: Boolean(row.Aprovada),
  Concordo: Number(row.Concordo) || 0,
  NaoConcordo: Number(row.NaoConcordo) || 0,
  MeuVoto: mapearVotoResposta(row.MeuVoto),
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
        fa.NumeroAnonimo,
        COALESCE(SUM(CASE WHEN sv.Tipo = 'like' THEN 1 ELSE 0 END), 0) AS Concordo,
        COALESCE(SUM(CASE WHEN sv.Tipo = 'dislike' THEN 1 ELSE 0 END), 0) AS NaoConcordo,
        mv.Tipo AS MeuVoto
      FROM Sugestao s
      INNER JOIN ForumAnonimo fa ON s.OficinaId = fa.OficinaId
      LEFT JOIN SugestaoVoto sv ON s.SugestaoId = sv.SugestaoId
      LEFT JOIN SugestaoVoto mv ON s.SugestaoId = mv.SugestaoId AND mv.OficinaId = ?
      ${filtroAprovacao}
      GROUP BY s.SugestaoId, s.OficinaId, s.Texto, s.Aprovada, s.DataCriacao, fa.NumeroAnonimo, mv.Tipo
      ORDER BY s.DataCriacao DESC
    `;

    const [rows] = await db.promise().query(sql, [oficinaId]);

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

exports.votarSugestao = async (req, res) => {
  const oficinaId = req.oficinaId;
  const sugestaoId = req.params.id;
  const { Tipo } = req.body;

  const tipoDb =
    Tipo === "concordo" || Tipo === "like"
      ? "like"
      : Tipo === "nao_concordo" || Tipo === "dislike"
        ? "dislike"
        : null;

  if (!tipoDb) {
    return res.status(400).json({ erro: "Tipo de voto inválido." });
  }

  try {
    const [sugestao] = await db.promise().query(
      "SELECT Aprovada FROM Sugestao WHERE SugestaoId = ?",
      [sugestaoId],
    );

    if (!sugestao.length) {
      return res.status(404).json({ erro: "Sugestão não encontrada." });
    }

    if (!sugestao[0].Aprovada) {
      return res
        .status(400)
        .json({ erro: "Só é possível votar em sugestões aprovadas." });
    }

    await obterNumeroAnonimo(oficinaId);

    const [votoExistente] = await db.promise().query(
      "SELECT Tipo FROM SugestaoVoto WHERE SugestaoId = ? AND OficinaId = ?",
      [sugestaoId, oficinaId],
    );

    if (votoExistente.length && votoExistente[0].Tipo === tipoDb) {
      await db.promise().query(
        "DELETE FROM SugestaoVoto WHERE SugestaoId = ? AND OficinaId = ?",
        [sugestaoId, oficinaId],
      );
    } else if (votoExistente.length) {
      await db.promise().query(
        "UPDATE SugestaoVoto SET Tipo = ? WHERE SugestaoId = ? AND OficinaId = ?",
        [tipoDb, sugestaoId, oficinaId],
      );
    } else {
      await db.promise().query(
        "INSERT INTO SugestaoVoto (SugestaoId, OficinaId, Tipo) VALUES (?, ?, ?)",
        [sugestaoId, oficinaId, tipoDb],
      );
    }

    const [stats] = await db.promise().query(
      `SELECT
        COALESCE(SUM(CASE WHEN Tipo = 'like' THEN 1 ELSE 0 END), 0) AS Concordo,
        COALESCE(SUM(CASE WHEN Tipo = 'dislike' THEN 1 ELSE 0 END), 0) AS NaoConcordo
      FROM SugestaoVoto
      WHERE SugestaoId = ?`,
      [sugestaoId],
    );

    const [meuVoto] = await db.promise().query(
      "SELECT Tipo FROM SugestaoVoto WHERE SugestaoId = ? AND OficinaId = ?",
      [sugestaoId, oficinaId],
    );

    res.json({
      Concordo: Number(stats[0].Concordo) || 0,
      NaoConcordo: Number(stats[0].NaoConcordo) || 0,
      MeuVoto: mapearVotoResposta(meuVoto[0]?.Tipo),
    });
  } catch (error) {
    console.error("Erro ao registar voto:", error);
    res.status(500).json({ erro: "Erro ao registar o voto." });
  }
};
