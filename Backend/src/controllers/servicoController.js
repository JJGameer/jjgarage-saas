const db = require("../config/db");
const cloudinary = require("../config/cloudinary");

const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const mimetype = file.mimetype;

    const isRawFile =
      mimetype === "application/pdf" ||
      (!mimetype.startsWith("image/") && !mimetype.startsWith("video/"));

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "oficina_servicos",
        resource_type: isRawFile ? "raw" : "auto",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      },
    );
    uploadStream.end(fileBuffer);
  });
};

exports.getServicos = (req, res) => {
  db.query(
    "SELECT * FROM Servico WHERE OficinaId = ? AND (Status != 'Concluído' OR (Status = 'Concluído' AND DataConclusao >= DATE_SUB(NOW(), INTERVAL 1 DAY)))",
    [req.oficinaId],
    (err, results) => {
      if (err) return res.status(500).send("Erro ao carregar serviços");
      res.json(results);
    },
  );
};

exports.getServicosPorCarro = (req, res) => {
  const carroId = req.params.id;
  const sql = "SELECT * FROM Servico WHERE CarroId = ? AND OficinaId = ?";
  db.query(sql, [carroId, req.oficinaId], (err, results) => {
    if (err) return res.status(500).send("Erro ao carregar serviços do carro");
    res.json(results);
  });
};

exports.getServicosPorId = (req, res) => {
  const { id } = req.params;
  db.query(
    `SELECT Servico.*, Carro.MatriculaId
    FROM Servico
    INNER JOIN Carro ON Servico.CarroId = Carro.CarroId
    WHERE Servico.ServicoId = ? AND Servico.OficinaId = ?`,
    [id, req.oficinaId],
    (err, results) => {
      if (err) {
        console.error("Erro SQL:", err);
        return res.status(500).send("Erro ao carregar o serviço");
      }

      if (results.length === 0) {
        return res.status(404).send("Serviço não encontrado");
      }
      res.json(results[0]);
    },
  );
};

exports.addServico = async (req, res) => {
  const {
    DataServico,
    Observacao,
    Status,
    Artigos,
    TipoServico,
    Kilometros,
    CarroId,
    PrecoFinal,
  } = req.body;
  const OficinaId = req.oficinaId;
  const dataConclusao = Status === "Concluído" ? new Date() : null;

  try {
    // 1. Verificar se o carro já tem serviço pendente
    const checkSql =
      "SELECT * FROM Servico WHERE CarroId = ? AND Status != 'Concluído'";
    const servicosPendentes = await new Promise((resolve, reject) => {
      db.query(checkSql, [CarroId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (servicosPendentes.length > 0) {
      return res.status(400).json({
        erro: "Este veículo já tem um serviço em curso. Conclua-o primeiro!",
      });
    }

    // 2. Processar uploads de anexos, se existirem
    let anexosUrls = [];
    if (req.files && req.files.length > 0) {
      console.log(`Processando ${req.files.length} anexos...`);
      const uploadPromises = req.files.map((file) =>
        uploadToCloudinary(file.buffer),
      );
      anexosUrls = await Promise.all(uploadPromises);
    }

    // Transformar o array JavaScript num JSON válido para o MySQL
    const anexosJSON =
      anexosUrls.length > 0 ? JSON.stringify(anexosUrls) : null;

    // 3. Inserir na Base de Dados
    const sql =
      "INSERT INTO Servico (OficinaId, CarroId, DataServico, Observacao, Status, Artigos, TipoServico, Kilometros, PrecoFinal, DataConclusao, Anexos) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

    db.query(
      sql,
      [
        OficinaId,
        CarroId,
        DataServico,
        Observacao,
        Status,
        Artigos,
        TipoServico,
        Kilometros,
        PrecoFinal,
        dataConclusao,
        anexosJSON,
      ],
      (err, results) => {
        if (err) {
          console.error("Erro SQL:", err);
          return res.status(500).send("Erro ao adicionar serviço");
        }
        res.status(201).json({
          id: results.insertId,
          message: "Serviço criado com sucesso",
        });
      },
    );
  } catch (error) {
    console.error("Erro no processamento:", error);
    res.status(500).json({ erro: "Erro ao processar o pedido" });
  }
};

exports.updateServico = async (req, res) => {
  const servicoId = req.params.id;
  const OficinaId = req.oficinaId;
  const {
    DataServico,
    Observacao,
    Status,
    Artigos,
    TipoServico,
    Kilometros,
    PrecoFinal,
    AnexosAntigos, // NOVO: Vem do FormData do Frontend
  } = req.body;

  const dataConclusao = Status === "Concluído" ? new Date() : null;

  try {
    // 1. Lemos os anexos antigos que o Frontend mandou manter
    // O FormData envia tudo como string, por isso fazemos o JSON.parse
    let listaAnexosMantidos = [];
    if (AnexosAntigos) {
      listaAnexosMantidos = JSON.parse(AnexosAntigos);
    }

    // 2. Fazemos o Upload de novos ficheiros para a Nuvem
    let novosAnexosUrls = [];
    if (req.files && req.files.length > 0) {
      console.log(`Processando ${req.files.length} novos anexos na edição...`);
      const uploadPromises = req.files.map((file) =>
        uploadToCloudinary(file.buffer),
      );
      novosAnexosUrls = await Promise.all(uploadPromises);
    }

    // 3. Juntamos os antigos que sobreviveram com os recém-carregados
    const anexosFinais = [...listaAnexosMantidos, ...novosAnexosUrls];

    // Converte o Array final para JSON antes de guardar no MySQL
    const anexosJSON =
      anexosFinais.length > 0 ? JSON.stringify(anexosFinais) : null;

    // 4. Guardar as alterações
    const sql = `
      UPDATE Servico 
      SET DataServico = ?, Observacao = ?, Status = ?, Artigos = ?, TipoServico = ?, Kilometros = ?, PrecoFinal = ?, DataConclusao = ?, Anexos = ?
      WHERE ServicoId = ? AND OficinaId = ?
    `;

    db.query(
      sql,
      [
        DataServico,
        Observacao,
        Status,
        Artigos,
        TipoServico,
        Kilometros,
        PrecoFinal,
        dataConclusao,
        anexosJSON, // Array completo e correto
        servicoId,
        OficinaId,
      ],
      (err, results) => {
        if (err) {
          console.error("Erro ao atualizar:", err);
          return res.status(500).send("Erro ao atualizar serviço");
        }
        res.json({ message: "Serviço Atualizado com Anexos" });
      },
    );
  } catch (error) {
    console.error("Erro na edição:", error);
    res.status(500).json({ erro: "Erro ao processar a atualização" });
  }
};

exports.getDashboardStats = async (req, res) => {
  const OficinaId = req.oficinaId;
  const currentYear = new Date().getFullYear();

  try {
    // Total de serviços concluídos
    const [completedServices] = await db
      .promise()
      .query(
        "SELECT COUNT(*) as total FROM Servico WHERE OficinaId = ? AND Status = 'Concluído'",
        [OficinaId],
      );

    // Total de serviços pendentes (À Espera de Peças, Pendentes, Em Reparação)
    const [pendingServices] = await db
      .promise()
      .query(
        "SELECT COUNT(*) as total FROM Servico WHERE OficinaId = ? AND Status IN ('À Espera de Peças', 'Pendentes', 'Em Reparação')",
        [OficinaId],
      );

    // Custo total de serviços concluídos
    const [totalCost] = await db
      .promise()
      .query(
        "SELECT COALESCE(SUM(PrecoFinal), 0) as total FROM Servico WHERE OficinaId = ? AND Status = 'Concluído'",
        [OficinaId],
      );

    // Serviços do ano atual
    const [servicesThisYear] = await db.promise().query(
      `SELECT COUNT(*) as total FROM Servico
         WHERE OficinaId = ? AND Status = 'Concluído'
         AND YEAR(DataConclusao) = ?`,
      [OficinaId, currentYear],
    );

    // Serviços por mês do ano atual
    const [servicesByMonth] = await db.promise().query(
      `SELECT MONTH(DataConclusao) as mes, COUNT(*) as total
         FROM Servico
         WHERE OficinaId = ? AND Status = 'Concluído' AND YEAR(DataConclusao) = ?
         GROUP BY MONTH(DataConclusao)
         ORDER BY mes`,
      [OficinaId, currentYear],
    );

    // Custo total do ano atual
    const [costThisYear] = await db.promise().query(
      `SELECT COALESCE(SUM(PrecoFinal), 0) as total FROM Servico
         WHERE OficinaId = ? AND Status = 'Concluído' AND YEAR(DataConclusao) = ?`,
      [OficinaId, currentYear],
    );

    // Total de serviços (todos)
    const [totalServices] = await db
      .promise()
      .query("SELECT COUNT(*) as total FROM Servico WHERE OficinaId = ?", [
        OficinaId,
      ]);

    res.json({
      completed: completedServices[0].total,
      pending: pendingServices[0].total,
      totalCost: totalCost[0].total,
      servicesThisYear: servicesThisYear[0].total,
      costThisYear: costThisYear[0].total,
      totalServices: totalServices[0].total,
      servicesByMonth: servicesByMonth,
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    res.status(500).json({ erro: "Erro ao buscar estatísticas da dashboard" });
  }
};
