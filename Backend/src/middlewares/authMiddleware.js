const jwt = require("jsonwebtoken");

const verificarToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return res
      .status(401)
      .json({ error: "Acesso negado. Nenhuma conta autenticada" });
  }
  //extrarir só a parte do token(cortar a palavra "bearer")
  const token = authHeader.split(" ")[1];

  try {
    //
    const decodificado = jwt.verify(token, process.env.JWT_SECRET);

    req.oficinaId = decodificado.OficinaId;

    next();
  } catch (error) {
    return res.status(403).json({ error: "Token inválido ou expirado." });
  }
};

module.exports = verificarToken;
