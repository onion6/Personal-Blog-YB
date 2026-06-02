import mysql, { PoolConnection } from 'mysql2/promise';
import { AsyncLocalStorage } from 'async_hooks';

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = Number(process.env.DB_PORT) || 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'my_web_db';

const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
});

const transactionStorage = new AsyncLocalStorage<PoolConnection>();

function getConnection(): mysql.Pool | PoolConnection {
  return transactionStorage.getStore() || pool;
}

export async function initDatabasePromise(): Promise<void> {
  const tempPool = mysql.createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    waitForConnections: true,
    connectionLimit: 1,
  });
  await tempPool.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await tempPool.end();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      username VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      display_name VARCHAR(100),
      avatar_url TEXT,
      role VARCHAR(20) DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      user_id INT UNSIGNED,
      name VARCHAR(200) NOT NULL,
      description TEXT,
      cover_url TEXT,
      tech_stack TEXT,
      github_url TEXT,
      demo_url TEXT,
      status VARCHAR(50) DEFAULT '进行中',
      sort_order INT DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      user_id INT UNSIGNED,
      title VARCHAR(200) NOT NULL,
      content LONGTEXT NOT NULL,
      tags TEXT,
      likes INT DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS comments (
      id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      post_id INT UNSIGNED NOT NULL,
      author VARCHAR(100) DEFAULT '匿名',
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS resources (
      id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(200) NOT NULL,
      description TEXT,
      url TEXT NOT NULL,
      category VARCHAR(100) NOT NULL,
      icon_url TEXT,
      votes INT DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS settings (
      \`key\` VARCHAR(100) PRIMARY KEY,
      \`value\` TEXT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS invite_codes (
      id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      code VARCHAR(50) UNIQUE NOT NULL,
      created_by INT UNSIGNED,
      is_used TINYINT DEFAULT 0,
      used_by INT UNSIGNED,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS profile (
      id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      user_id INT UNSIGNED,
      name VARCHAR(100),
      title VARCHAR(200),
      bio TEXT,
      avatar_url TEXT,
      skills TEXT,
      timeline TEXT,
      hobbies TEXT,
      contacts TEXT,
      UNIQUE KEY uk_user_id (user_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  console.log('MySQL database tables initialized');

  await pool.query("UPDATE users SET role = 'admin' WHERE username = 'admin' AND role != 'admin'");
}

export async function queryAll(sql: string, params: any[] = []): Promise<any[]> {
  const conn = getConnection();
  const [rows] = await conn.query(sql, params);
  return rows as any[];
}

export async function queryOne(sql: string, params: any[] = []): Promise<any | undefined> {
  const rows = await queryAll(sql, params);
  return rows[0];
}

export async function queryCount(sql: string, params: any[] = []): Promise<number> {
  const result = await queryOne(sql, params);
  return result?.count || 0;
}

export async function run(sql: string, params: any[] = []): Promise<{ lastInsertRowid: number; changes: number }> {
  const conn = getConnection();
  const [result] = await conn.query(sql, params) as [mysql.ResultSetHeader, any];
  return { lastInsertRowid: result.insertId, changes: result.affectedRows };
}

export async function withTransaction<T>(fn: () => Promise<T>): Promise<T> {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    const result = await transactionStorage.run(connection, fn);
    await connection.commit();
    return result;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

export async function closeDatabase(): Promise<void> {
  await pool.end();
}
