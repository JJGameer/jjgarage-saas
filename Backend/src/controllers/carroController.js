const db = require("../config/db");
const cloudinary = require("../config/cloudinary");
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({});

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
  const { MatriculaId, Marca, Modelo, Ano, Vin, Cor, Motor, ClienteId } =
    req.body;
  const OficinaId = req.oficinaId;

  try {
    //Este carro já existe na Base de Dados?
    // Usamos uma Promise para o código esperar pelo MySQL antes de avançar
    const imagemExistente = await new Promise((resolve, reject) => {
      const sqlBusca =
        "SELECT ImagemUrl FROM Carro WHERE Marca = ? AND Modelo = ? AND Ano = ? AND Cor = ? AND ImagemUrl IS NOT NULL LIMIT 1";
      db.query(sqlBusca, [Marca, Modelo, Ano, Cor], (err, results) => {
        if (err) reject(err);
        else resolve(results.length > 0 ? results[0].ImagemUrl : null);
      });
    });

    let ImagemUrl = "";

    if (imagemExistente) {
      console.log(
        `Imagem reaproveitada da Base de Dados para: ${Marca} ${Modelo} ${Ano} ${Cor}`,
      );
      ImagemUrl = imagemExistente;
    } else {
      console.log(
        `A gerar nova imagem com IA para: ${Marca} ${Modelo} ${Ano} ${Cor}`,
      );

      const prompt = `Crie uma fotografia fotorrealista de um carro ${Marca} ${Modelo} do ano ${Ano} com a cor ${Cor}. O veículo deve estar bem visível, com vista frontal de 3/4. O carro deve estar completamente isolado num fundo branco puro e sólido (pure white background), sem sombras projetadas no chão, com iluminação de estúdio neutra e difusa. Estilo recorte (cut-out) perfeito para conversão em PNG transparente.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-image-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const part = response.candidates[0].content.parts.find(
        (p) => p.inlineData,
      );
      if (!part || !part.inlineData) {
        throw new Error("A IA não conseguiu gerar a imagem do véiculo");
      }

      const mimeType = part.inlineData.mimeType || "image/png";
      const base64Image = `data:${mimeType};base64,${part.inlineData.data}`;

      console.log("A enviar imagem nova para o Cloudinary...");
      const uploadResult = await cloudinary.uploader.upload(base64Image, {
        folder: "oficina_carros",
        public_id: MatriculaId,
      });

      ImagemUrl = uploadResult.secure_url;
    }

    const sqlInsert =
      "INSERT INTO Carro (OficinaId, MatriculaId, Marca, Modelo, Ano, Vin, ClienteId, ImagemUrl, Cor, Motor) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

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
        ImagemUrl,
        Cor,
        Motor,
      ],
      (err) => {
        if (err) {
          console.log("Erro no MySQL", err);
          return res.status(500).send("Erro ao adicionar o carro");
        }
        res.status(201).json({
          OficinaId,
          MatriculaId,
          Marca,
          Modelo,
          Ano,
          Vin,
          ClienteId,
          ImagemUrl,
          Cor,
          Motor,
        });
      },
    );
  } catch (error) {
    console.error("Erro no processo de IA ou Upload", error);
    res
      .status(500)
      .json({ erro: "Erro ao processar a imagem do veículo", error });
  }
};

exports.updateCarro = async (req, res) => {
  const matriculaAtual = req.params.id; // O ID (Matrícula) que vem no URL da rota
  const OficinaId = req.oficinaId;
  const { MatriculaId, Marca, Modelo, Ano, Vin, Cor, Motor, ClienteId } =
    req.body;

  try {
    // 1. Procurar o carro atual para comparar os dados
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

    if (!carroAntigo) {
      return res.status(404).json({ erro: "Veículo não encontrado." });
    }

    let ImagemUrl = carroAntigo.ImagemUrl;

    // 2. Verificar se mudou alguma característica visual que exija nova imagem
    const mudouVisual =
      carroAntigo.Marca !== Marca ||
      carroAntigo.Modelo !== Modelo ||
      String(carroAntigo.Ano) !== String(Ano) || // String para evitar bugs de tipos (int vs string)
      carroAntigo.Cor !== Cor;

    if (mudouVisual) {
      console.log(
        "Características visuais alteradas. A processar nova imagem...",
      );

      // Verifica se já existe uma imagem igual na BD para reaproveitar
      const imagemExistente = await new Promise((resolve, reject) => {
        const sqlBusca =
          "SELECT ImagemUrl FROM Carro WHERE Marca = ? AND Modelo = ? AND Ano = ? AND Cor = ? AND ImagemUrl IS NOT NULL LIMIT 1";
        db.query(sqlBusca, [Marca, Modelo, Ano, Cor], (err, results) => {
          if (err) reject(err);
          else resolve(results.length > 0 ? results[0].ImagemUrl : null);
        });
      });

      if (imagemExistente) {
        console.log(`Imagem atualizada reaproveitada da BD.`);
        ImagemUrl = imagemExistente;
      } else {
        console.log(`A gerar nova imagem com IA para a atualização...`);
        const prompt = `Crie uma fotografia fotorrealista de um carro ${Marca} ${Modelo} do ano ${Ano} com a cor ${Cor}. O veículo deve estar bem visível, com vista frontal de 3/4. O carro deve estar completamente isolado num fundo branco puro e sólido (pure white background), sem sombras projetadas no chão, com iluminação de estúdio neutra e difusa. Estilo recorte (cut-out) perfeito para conversão em PNG transparente.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-image-preview",
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
          },
        });

        const part = response.candidates[0].content.parts.find(
          (p) => p.inlineData,
        );
        if (!part || !part.inlineData) {
          throw new Error(
            "A IA não conseguiu gerar a imagem para a atualização",
          );
        }

        const mimeType = part.inlineData.mimeType || "image/png";
        const base64Image = `data:${mimeType};base64,${part.inlineData.data}`;

        console.log("A enviar a nova imagem para o Cloudinary...");
        const uploadResult = await cloudinary.uploader.upload(base64Image, {
          folder: "oficina_carros",
          public_id: MatriculaId, // Ao usar a mesma matrícula, o Cloudinary substitui a imagem antiga automaticamente
        });

        ImagemUrl = uploadResult.secure_url;
      }
    }

    // 3. Atualizar os dados na Base de Dados MySQL
    const sqlUpdate = `
      UPDATE Carro 
      SET MatriculaId = ?, Marca = ?, Modelo = ?, Ano = ?, Vin = ?, ClienteId = ?, ImagemUrl = ?, Cor = ?, Motor = ?
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
        ImagemUrl,
        Cor,
        Motor,
        matriculaAtual,
        OficinaId,
      ],
      (err) => {
        if (err) {
          console.error("Erro no MySQL ao atualizar", err);
          return res.status(500).send("Erro ao atualizar o carro");
        }
        res.status(200).json({
          mensagem: "Veículo atualizado com sucesso!",
          ImagemUrl,
        });
      },
    );
  } catch (error) {
    console.error("Erro no processo de IA ou Update", error);
    res
      .status(500)
      .json({ erro: "Erro ao processar a atualização do veículo", error });
  }
};
