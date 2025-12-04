const mariadb = require("mariadb");
const dotenv = require("dotenv");

dotenv.config();

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  connectionLimit: 5,
});

async function getConnection() {
  return pool.getConnection();
}

async function testQuery() {
  const conn = await getConnection();
  try {
    const rows = await conn.query("SELECT 'test' AS test");
    return rows;
  } finally {
    conn.release();
  }
}

module.exports = {
  getConnection,
  testQuery,
};