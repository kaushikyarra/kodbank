require('dotenv').config();
const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connected to database.');

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS KodUser (
        uid INT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        balance INT DEFAULT 100000,
        phone VARCHAR(20),
        role VARCHAR(20)
      );
    `);
    console.log("Table 'KodUser' created successfully.");

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS UserToken (
        tid INT AUTO_INCREMENT PRIMARY KEY,
        token TEXT NOT NULL,
        uid INT,
        expairy DATETIME,
        FOREIGN KEY (uid) REFERENCES KodUser(uid)
      );
    `);
    console.log("Table 'UserToken' created successfully.");

  } catch (err) {
    console.error('Error during database initialization:', err);
  } finally {
    await connection.end();
  }
}

main();
