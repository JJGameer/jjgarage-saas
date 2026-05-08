const db = require("../config/db");

exports.getClientes = (req, res) => {
  const sql = `
    SELECT 
      Cliente.*, 
      GROUP_CONCAT(Carro.MatriculaId SEPARATOR ', ') AS Matriculas
    FROM Cliente
    LEFT JOIN Carro ON Cliente.ClienteId = Carro.ClienteId
    WHERE Cliente.OficinaId = ?
    GROUP BY Cliente.ClienteId
  `;

  db.query(sql, [req.oficinaId], (err, results) => {
    if (err) {
      console.error("Erro ao carregar clientes e veículos:", err);
      return res.status(500).json({ erro: "Erro ao carregar os clientes" });
    }
    res.json(results);
  });
};

exports.addCliente = (req, res) => {
  const { Nome, Contacto, Morada } = req.body;
  const OficinaId = req.oficinaId;

  db.query(
    "INSERT INTO Cliente (OficinaId, Nome, Contacto, Morada) VALUES (?, ?, ?, ?)",
    [OficinaId, Nome, Contacto, Morada],
    (err, results) => {
      if (err) {
        return res.status(500).send("Erro a adicionar cliente", err);
      }
      res
        .status(201)
        .json({ id: results.insertId, OficinaId, Nome, Contacto, Morada });
    },
  );
};

exports.updateCliente = (req, res) => {
  const id = req.params.id;
  const { Nome, Contacto, Morada } = req.body;
  const OficinaId = req.oficinaId;

  const sql = `
    UPDATE Cliente 
    SET Nome = ?, Contacto = ?, Morada = ?
    WHERE ClienteId = ? AND OficinaId = ?
  `;

  db.query(sql, [Nome, Contacto, Morada, id, OficinaId], (err, results) => {
    if (err) {
      return res.status(500).send("Erro ao atualizar cliente");
    }
    res.json({ message: "Cliente Atualizado" });
  });
};

exports.deleteCliente = (req, res) => {
  const id = req.params.id;
  const OficinaId = req.oficinaId;

  // 1º PASSO: Perguntar à base de dados se este cliente tem carros
  const checkSql =
    "SELECT COUNT(*) AS totalCarros FROM Carro WHERE ClienteId = ?";

  db.query(checkSql, [id], (err, results) => {
    if (err) {
      console.error("Erro ao verificar veículos:", err);
      return res
        .status(500)
        .json({ erro: "Erro interno ao verificar o cliente." });
    }

    // Se o cliente tiver 1 ou mais carros, o BACKEND bloqueia logo a operação!
    if (results[0].totalCarros > 0) {
      return res.status(400).json({
        erro: "Não é possível eliminar este cliente porque ainda tem veículos associados. Remova os veículos primeiro.",
      });
    }

    // 2º PASSO: Se chegou aqui, é porque o totalCarros é 0. Podemos eliminar à vontade!
    const deleteSql =
      "DELETE FROM Cliente WHERE ClienteId = ? AND OficinaId = ?";

    db.query(deleteSql, [id, OficinaId], (err, deleteResults) => {
      if (err) {
        console.error("Erro ao eliminar cliente:", err);
        return res.status(500).json({ erro: "Erro ao eliminar o cliente." });
      }

      if (deleteResults.affectedRows === 0) {
        return res.status(404).json({ erro: "Cliente não encontrado." });
      }

      res.json({ message: "Cliente eliminado com sucesso." });
    });
  });
};
