require("dotenv").config({ path: "./.env" }); // Isto obriga-o a ler o ficheiro na raiz
const express = require("express");
const cors = require("cors");

//Importação das rotas
const carroRoutes = require("./routes/carroRoutes");
const servicoRoutes = require("./routes/servicoRoutes");
const clienteRoutes = require("./routes/clienteRoutes");
const authRoutes = require("./routes/authRoutes");
const corsOptions = {
  origin: [
    "https://auto-gest-pt.vercel.app",
    "https://localhost:5173",
    "https://localhost:3001",
  ],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
};

const app = express();

//Middlewares
app.use(express.json()); //para identificar formato json
app.use(cors());

//Prefixes
app.use("/auth", authRoutes);
app.use("/carros", carroRoutes);
app.use("/clientes", clienteRoutes);
app.use("/servicos", servicoRoutes);

const PORT = process.env.PORT || 3001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor na porta ${PORT} check`);
});
