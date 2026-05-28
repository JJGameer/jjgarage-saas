const db = require("../config/db");
const cloudinary = require("../config/cloudinary");
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({});

const URL_PLACEHOLDER =
  "https://res.cloudinary.com/dbarynwaq/image/upload/q_auto/f_auto/v1778798808/89aa756a-fa83-433a-8142-bc5556129e3e_agbtzh.jpg";

exports.getCarros = (req, res) => {
  db.query(
    "SELECT * FROM Carro WHERE OficinaId = ?",
    [req.oficinaId],
    (err, results) => {
      if (err) return res.status(500).send("Erro ao carregar os carros");
      res.json(results);
    },
  );
};

exports.getCarrosPorStatus = (req, res) => {
  const sql = `
    SELECT DISTINCT Carro.*, Servico.Status, Servico.ServicoId, Servico.DataServico, Servico.DataConclusao
    FROM Carro 
    INNER JOIN Servico ON Carro.CarroId = Servico.CarroId 
    WHERE Carro.OficinaId = ?
    AND (
      Servico.Status IN ('Pendente', 'Em Reparação', 'À Espera de Peças')
      OR 
      (Servico.Status = 'Concluído' AND Servico.DataConclusao >= DATE_SUB(NOW(), INTERVAL 7 DAY))
    )
  `;

  db.query(sql, [req.oficinaId], (err, results) => {
    if (err) {
      console.error("Erro ao carregar dados por status:", err);
      return res.status(500).send("Erro ao carregar dados por status");
    }
    res.json(results);
  });
};

exports.getCarroPorMatricula = (req, res) => {
  const parametroPesquisa = req.params.id; //Extrai o ID que vem do url do frotnend

  const sql =
    "SELECT * From Carro WHERE (CarroId = ? OR MatriculaId = ?) AND OficinaId = ?";
  db.query(
    sql,
    [parametroPesquisa, parametroPesquisa, req.oficinaId],
    (err, results) => {
      if (err) {
        return res.status(500).send("Erro a carregar o carro");
      }
      if (results.length > 0) {
        res.json(results[0]);
      } else {
        return res.status(404).send("Erro ao encontrar");
      }
    },
  );
};

exports.addCarro = async (req, res) => {
  const {
    MatriculaId,
    Marca,
    Modelo,
    Ano,
    Vin,
    Cor,
    Motor,
    ClienteId,
    Segmento,
  } = req.body;
  const OficinaId = req.oficinaId;

  try {
    // 1. Verifica rápido se já existe imagem para reaproveitar (isso é rápido, mantemos await)
    const matriculaExiste = await new Promise((resolve, reject) => {
      db.query(
        "SELECT MatriculaId FROM Carro WHERE MatriculaId = ? AND OficinaId = ? LIMIT 1",
        [MatriculaId, OficinaId],
        (err, results) => {
          if (err) reject(err);
          else resolve(results?.length > 0);
        },
      );
    });

    // Se já existir, interrompe o processo e devolve um erro 409 (Conflict)
    if (matriculaExiste) {
      return res.status(409).json({
        erro: "Esta matrícula já se encontra registada no sistema.",
      });
    }
    const imagemExistente = await new Promise((resolve) => {
      db.query(
        "SELECT ImagemUrl FROM Carro WHERE Marca=? AND Modelo=? AND Ano=? AND Cor=? AND Segmento=? AND ImagemUrl IS NOT NULL LIMIT 1",
        [Marca, Modelo, Ano, Cor, Segmento],
        (err, results) =>
          resolve(results?.length > 0 ? results[0].ImagemUrl : null),
      );
    });

    let ImagemUrlFinal = imagemExistente || URL_PLACEHOLDER;

    // 2. Insere na Base de Dados IMEDIATAMENTE
    const sqlInsert =
      "INSERT INTO Carro (OficinaId, MatriculaId, Marca, Modelo, Ano, Vin, ClienteId, ImagemUrl, Cor, Motor, Segmento) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

    db.query(
      sqlInsert,
      [
        OficinaId,
        MatriculaId,
        Marca,
        Modelo,
        Ano,
        Vin,
        ClienteId,
        ImagemUrlFinal,
        Cor,
        Motor,
        Segmento,
      ],
      (err) => {
        if (err) return res.status(500).send("Erro ao salvar no MySQL");

        // 3. ENVIAR RESPOSTA LOGO! O utilizador já vê o carro na lista
        res
          .status(201)
          .json({ mensagem: "Veículo registado!", ImagemUrl: ImagemUrlFinal });

        // 4. Se não havia imagem para reaproveitar, dispara a IA em background sem await
        if (!imagemExistente) {
          processarImagemIA(req.body, MatriculaId, OficinaId);
        }
      },
    );
  } catch (error) {
    res.status(500).json({ erro: "Erro no servidor" });
  }
};

exports.updateCarro = async (req, res) => {
  const matriculaAtual = req.params.id; // A matrícula que está no URL
  // No updateCarro, podes forçar a geração se a imagem atual for o placeholder
  const OficinaId = req.oficinaId;
  const {
    MatriculaId,
    Marca,
    Modelo,
    Ano,
    Vin,
    Cor,
    Motor,
    ClienteId,
    Segmento,
  } = req.body;

  try {
    // 1. Procurar o carro atual (Necessário para comparar se houve mudança visual)
    const carroAntigo = await new Promise((resolve, reject) => {
      db.query(
        "SELECT * FROM Carro WHERE MatriculaId = ? AND OficinaId = ?",
        [matriculaAtual, OficinaId],
        (err, results) => {
          if (err) reject(err);
          else resolve(results.length > 0 ? results[0] : null);
        },
      );
    });

    const matriculaDuplicada = await new Promise((resolve, reject) => {
      db.query(
        "SELECT MatriculaId FROM Carro WHERE MatriculaId = ? AND OficinaId = ? AND CarroId != ? LIMIT 1",
        [MatriculaId, OficinaId, carroAntigo.CarroId],
        (err, results) => {
          if (err) reject(err);
          else resolve(results?.length > 0);
        },
      );
    });

    // Se outra pessoa/carro já tiver essa matrícula, bloqueia imediatamente!
    if (matriculaDuplicada) {
      return res.status(409).json({
        erro: "Não é possível atualizar. Esta nova matrícula já está atribuída a outro veículo no sistema.",
      });
    }

    if (!carroAntigo)
      return res.status(404).json({ erro: "Veículo não encontrado." });

    // 2. Verificar se mudou algo que exija nova imagem
    const mudouVisual =
      carroAntigo.Marca !== Marca ||
      carroAntigo.Modelo !== Modelo ||
      String(carroAntigo.Ano) !== String(Ano) ||
      carroAntigo.Cor !== Cor ||
      carroAntigo.Segmento !== Segmento;

    let ImagemUrlFinal = carroAntigo.ImagemUrl;
    let precisaGerarIA = false;

    if (mudouVisual) {
      // Tentar reaproveitar imagem da BD (operação rápida)
      const imagemExistente = await new Promise((resolve) => {
        db.query(
          "SELECT ImagemUrl FROM Carro WHERE Marca=? AND Modelo=? AND Ano=? AND Cor=? AND Segmento=? AND ImagemUrl IS NOT NULL LIMIT 1",
          [Marca, Modelo, Ano, Cor, Segmento],
          (err, results) =>
            resolve(results?.length > 0 ? results[0].ImagemUrl : null),
        );
      });

      if (imagemExistente) {
        ImagemUrlFinal = imagemExistente;
      } else {
        // Não há imagem igual na BD. Usamos o placeholder e marcamos para gerar em background
        ImagemUrlFinal = URL_PLACEHOLDER;
        precisaGerarIA = true;
      }
    } else if (carroAntigo.ImagemUrl === URL_PLACEHOLDER) {
      console.log(
        "O veículo ainda tem o placeholder. A tentar gerar imagem real...",
      );
      precisaGerarIA = true;
    }

    // 3. Atualizar a Base de Dados IMEDIATAMENTE (Texto e ImagemUrl atual/placeholder)
    const sqlUpdate = `
      UPDATE Carro 
      SET MatriculaId = ?, Marca = ?, Modelo = ?, Ano = ?, Vin = ?, ClienteId = ?, ImagemUrl = ?, Cor = ?, Motor = ?, Segmento = ?
      WHERE MatriculaId = ? AND OficinaId = ?
    `;

    db.query(
      sqlUpdate,
      [
        MatriculaId,
        Marca,
        Modelo,
        Ano,
        Vin,
        ClienteId,
        ImagemUrlFinal,
        Cor,
        Motor,
        Segmento,
        matriculaAtual,
        OficinaId,
      ],
      (err) => {
        if (err) return res.status(500).send("Erro ao atualizar no MySQL");

        // 4. RESPONDER AO CLIENTE AGORA!
        res.status(200).json({
          mensagem: "Veículo atualizado com sucesso!",
          ImagemUrl: ImagemUrlFinal,
          processandoImagem: precisaGerarIA, // Informação útil para o frontend se quiseres mostrar um "loading" na imagem
        });

        // 5. Se precisa de IA, dispara em background sem await
        if (precisaGerarIA) {
          processarImagemIA(req.body, MatriculaId, OficinaId);
        }
      },
    );
  } catch (error) {
    console.error("Erro no update", error);
    res.status(500).json({ erro: "Erro interno no servidor" });
  }
};

// Função que corre "em silêncio" no servidor
const processarImagemIA = async (
  dados,
  MatriculaId,
  OficinaId,
  tentativa = 1,
) => {
  const { Marca, Modelo, Ano, Cor, Segmento } = dados;

  try {
    console.log(`[Background] Tentativa ${tentativa} para ${MatriculaId}...`);

    const prompt = `Crie uma fotografia fotorrealista de um carro ${Marca} ${Modelo} ${Segmento} do ano ${Ano} com a cor ${Cor}. O veículo deve estar bem visível, com vista frontal de 3/4. O carro deve estar completamente isolado num fundo branco puro e sólido (pure white background), sem sombras projetadas no chão, com iluminação de estúdio neutra e difusa. Estilo recorte (cut-out) perfeito para conversão em PNG transparente.`;

    // Adicionamos um tempo de espera maior para a IA
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: prompt,
      // Configuração de segurança para evitar timeouts precoces
      requestOptions: { timeout: 120000 }, // 2 minutos
    });

    const part = response.candidates[0].content.parts.find((p) => p.inlineData);
    if (!part) throw new Error("IA não devolveu dados");

    const base64Image = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;

    const uploadResult = await cloudinary.uploader.upload(base64Image, {
      folder: "oficina_carros",
      public_id: MatriculaId,
      overwrite: true, // Garante que substitui se houver lixo
    });

    db.query(
      "UPDATE Carro SET ImagemUrl = ? WHERE MatriculaId = ? AND OficinaId = ?",
      [uploadResult.secure_url, MatriculaId, OficinaId],
    );

    console.log(`[Background] Sucesso total para ${MatriculaId}`);
  } catch (error) {
    console.error(
      `[Background Error] Falha na tentativa ${tentativa}:`,
      error.message,
    );

    // Se falhou por timeout ou erro de rede e ainda não tentámos 3 vezes...
    if (tentativa < 3) {
      console.log(`[Background] A reententar em 5 segundos...`);
      setTimeout(
        () => processarImagemIA(dados, MatriculaId, OficinaId, tentativa + 1),
        5000,
      );
    } else {
      console.log(
        `[Background] Desistência após 3 tentativas para ${MatriculaId}.`,
      );
      // Opcional: Aqui podias mandar um email para ti próprio ou marcar na BD que a imagem falhou.
    }
  }
};
