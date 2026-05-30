const mysql = require("mysql2");

console.log("🔧 DB Config Debug:");
console.log(`  Host: ${process.env.MYSQLHOST}`);
console.log(`  User: ${process.env.MYSQLUSER}`);
console.log(`  Port: ${process.env.MYSQLPORT || 3306}`);
console.log(`  Database: ${process.env.MYSQLDATABASE}`);
console.log(`  Password length: ${process.env.MYSQLPASSWORD?.length || 0}`);

//configurar conexão com bd
const db = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Erro a conectar à base de dados:", err.message);
  } else {
    console.log("✅ Conexão feita à base de dados");
    connection.release();
  }
});

module.exports = db;
