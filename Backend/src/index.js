require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});
const express = require("express");
const cors = require("cors");

//Importação das rotas
const carroRoutes = require("./routes/carroRoutes");
const servicoRoutes = require("./routes/servicoRoutes");
const clienteRoutes = require("./routes/clienteRoutes");
const authRoutes = require("./routes/authRoutes");
const webhookRoutes = require("./routes/webhookRoutes");

const app = express();

app.set("trust proxy", 1);

const corsOptions = {
  origin: [
    "https://jjgarage.pt",
    "https://www.jjgarage.pt",
    "https://localhost:5173",
    "https://localhost:3001",
  ],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
};

//Middlewares
app.use(express.json()); //para identificar formato json
app.use(cors(corsOptions));

//Prefixes
app.use("/auth", authRoutes);
app.use("/carros", carroRoutes);
app.use("/clientes", clienteRoutes);
app.use("/servicos", servicoRoutes);
app.use("/webhooks", webhookRoutes);

const PORT = process.env.PORT || 3001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor na porta ${PORT} check`);
});
