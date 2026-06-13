const express = require("express");
const router = express.Router();
const verificarToken = require("../middlewares/authMiddleware");
const sugestaoController = require("../controllers/sugestaoController");

router.get("/", verificarToken, sugestaoController.getSugestoes);
router.post("/", verificarToken, sugestaoController.addSugestao);
router.put("/:id/aprovar", verificarToken, sugestaoController.aprovarSugestao);
router.get("/:id/mensagens", verificarToken, sugestaoController.getMensagens);
router.post("/:id/mensagens", verificarToken, sugestaoController.addMensagem);
router.post("/:id/voto", verificarToken, sugestaoController.votarSugestao);
router.delete("/:id", verificarToken, sugestaoController.eliminarSugestao);

module.exports = router;
