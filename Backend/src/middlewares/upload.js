const multer = require("multer");

// Usamos a memória (buffer) em vez do disco rígido para enviar diretamente para a nuvem
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype.startsWith("image/") ||
    file.mimetype.startsWith("video/") ||
    file.mimetype === "application/pdf"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Formato de ficheiro não suportado."), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // Limite de 50MB por ficheiro
  },
});

module.exports = upload;
