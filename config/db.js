// config/db.js
// ============================================================
//  Database Connection String – BIT3208
//  Uses mysql2 to connect to MySQL via the .env connection string
// ============================================================

const mysql = require('mysql2');
require('dotenv').config();

// Create connection pool (better than single connection for web apps)
const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

// Promisify so we can use async/await
const db = pool.promise();

// Test the connection on startup
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection FAILED:', err.message);
    return;
  }
  console.log('✅ Database connected successfully! (Host:', process.env.DB_HOST + ')');
  connection.release();
});

module.exports = db;
