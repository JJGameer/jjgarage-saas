const express = require("express");
const router = express.Router();
const clienteController = require("../controllers/clienteController");
const verificarToken = require("../middlewares/authMiddleware");

router.get("/", verificarToken, clienteController.getClientes);
router.post("/", verificarToken, clienteController.addCliente);
router.put("/editar/:id", verificarToken, clienteController.updateCliente);
router.delete("/:id", verificarToken, clienteController.deleteCliente);

module.exports = router;
