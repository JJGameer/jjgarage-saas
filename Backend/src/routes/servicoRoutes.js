const express = require("express");
const upload = require("../middlewares/upload");
const router = express.Router();
const multer = require("multer");
const servicoController = require("../controllers/servicoController");
const verificarToken = require("../middlewares/authMiddleware");

const uploadComVerificacao = (req, res, next) => {
  // Chamamos o multer manualmente aqui (máximo 5 ficheiros)
  const executarUpload = upload.array("ficheiros", 5);

  executarUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          erro: "Ficheiro demasiado grande! Por favor, garanta que cada vídeo ou imagem tem no máximo 50MB.",
        });
      }

      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({
          erro: "Limite de anexos excedido! Só pode enviar um máximo de 5 ficheiros de cada vez.",
        });
      }

      return res.status(400).json({
        erro: `Erro no anexo: verifique se os ficheiros são válidos.`,
      });
    } else if (err) {
      if (err.message === "TIPO_INVALIDO") {
        return res.status(400).json({
          erro: "Formato não suportado! Por favor, anexe apenas Imagens (JPG, PNG, etc), Vídeos ou documentos PDF.",
        });
      }

      return res.status(500).json({
        erro: "Ocorreu um erro inesperado ao ler os seus ficheiros. Tente novamente.",
      });
    }

    next();
  });
};

router.get("/", verificarToken, servicoController.getServicos);
router.get(
  "/carros/:id",
  verificarToken,
  servicoController.getServicosPorCarro,
);
router.get("/editar/:id", verificarToken, servicoController.getServicosPorId);
router.post(
  "/",
  verificarToken,
  uploadComVerificacao,
  servicoController.addServico,
);
router.put(
  "/editar/:id",
  verificarToken,
  uploadComVerificacao,
  servicoController.updateServico,
);

module.exports = router;
