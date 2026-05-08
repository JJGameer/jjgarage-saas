const mysql = require("mysql2");
require("dotenv").config();

//configurar conexão com bd
const db = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

db.getConnection((err, connection) => {
  if (err) {
    console.error("Erro a conectar à base de dados:", err);
  } else {
    console.log("Conexão feita à base de dados");
    connection.release();
  }
});

module.exports = db;
