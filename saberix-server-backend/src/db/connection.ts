import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

export const pool = mysql.createPool({
  host:               process.env.DB_HOST     ?? "turntable.proxy.rlwy.net",
  port:               Number(process.env.DB_PORT ?? "43192"),
  user:               process.env.DB_USER     ?? "root",
  password:           process.env.DB_PASS     ?? "taGDvOnVJTMCLdjicJdacZBaZRpECGLV",
  database:           process.env.DB_NAME     ?? "railway",
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  connectTimeout:     10_000,
});

export async function testConnection() {
  const conn = await pool.getConnection();
  console.log("✅ MySQL conectado");
  conn.release();
}
