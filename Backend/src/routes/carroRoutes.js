const express = require("express");
const router = express.Router();
const carroController = require("../controllers/carroController");
const servicoController = require("../controllers/servicoController");
const rateLimit = require("express-rate-limit");
const verificarToken = require("../middlewares/authMiddleware");

const criarLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: {
    erro: "Atingiste o limite de criação de veículos. Aguarda uns minutos",
  },
});

const matriculaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    erro: "Atingiste o limite de consultas de matrícula. Aguarda uns minutos.",
  },
});

router.get("/status", verificarToken, carroController.getCarrosPorStatus);
router.get("/", verificarToken, carroController.getCarros);
router.post(
  "/matricula",
  verificarToken,
  matriculaLimiter,
  carroController.buscarDadosMatricula,
);
router.get("/:id", verificarToken, carroController.getCarroPorMatricula);
router.get(
  "/:id/servicos",
  verificarToken,
  servicoController.getServicosPorCarro,
);

router.post("/", verificarToken, criarLimiter, carroController.addCarro);
router.put("/editar/:id", verificarToken, carroController.updateCarro);

module.exports = router;
