// backend/db.js
const { Pool } = require("pg");
require("dotenv").config();

// Kiểm tra các biến môi trường
const requiredEnvVars = [
  "DB_HOST",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME",
  "DB_PORT",
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(
      `Thiếu biến môi trường: ${envVar}. Vui lòng kiểm tra file .env.`
    );
  }
}

// Đảm bảo DB_PASSWORD là chuỗi
if (typeof process.env.DB_PASSWORD !== "string") {
  throw new Error(
    "DB_PASSWORD phải là một chuỗi. Hiện tại: " + typeof process.env.DB_PASSWORD
  );
}

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

module.exports = pool;
