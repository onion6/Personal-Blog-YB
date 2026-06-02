import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'database.sqlite');

let db: SqlJsDatabase;
let saveTimeout: NodeJS.Timeout | null = null;
let isSaving = false;
let transactionDepth = 0;

function saveDatabase(): void {
  if (isSaving) {
    return;
  }

  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(() => {
    isSaving = true;
    try {
      const data = db.export();
      fs.writeFile(dbPath, Buffer.from(data), (err) => {
        if (err) {
          console.error('Failed to save database:', err);
        }
        isSaving = false;
      });
    } catch (err) {
      console.error('Failed to export database:', err);
      isSaving = false;
    }
  }, 100);
}

export async function initDatabasePromise(): Promise<void> {
  const SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON');

  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      name TEXT NOT NULL,
      description TEXT,
      cover_url TEXT,
      tech_stack TEXT,
      github_url TEXT,
      demo_url TEXT,
      status TEXT DEFAULT '进行中',
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      tags TEXT,
      likes INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      author TEXT DEFAULT '匿名',
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      url TEXT NOT NULL,
      category TEXT NOT NULL,
      icon_url TEXT,
      votes INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      display_name TEXT,
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS invite_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      created_by INTEGER,
      is_used INTEGER DEFAULT 0,
      used_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      name TEXT,
      title TEXT,
      bio TEXT,
      avatar_url TEXT,
      skills TEXT,
      timeline TEXT,
      hobbies TEXT,
      contacts TEXT,
      UNIQUE(user_id)
    )
  `);

  migrateProfileUserId();
  migrateProjectsUserId();
  migrateUserRole();

  saveDatabase();
}

function hasColumn(table: string, column: string): boolean {
  const result = queryOne(`PRAGMA table_info(${table})`);
  if (!result) return false;
  const columns = queryAll(`PRAGMA table_info(${table})`);
  return columns.some((c: any) => c.name === column);
}

function migrateProfileUserId(): void {
  if (!hasColumn('profile', 'user_id')) {
    console.log('Migration: adding user_id to profile table');
    db.run('ALTER TABLE profile ADD COLUMN user_id INTEGER REFERENCES users(id)');
  }
}

function migrateProjectsUserId(): void {
  if (!hasColumn('projects', 'user_id')) {
    console.log('Migration: adding user_id to projects table');
    db.run('ALTER TABLE projects ADD COLUMN user_id INTEGER REFERENCES users(id)');
  }
}

function migrateUserRole(): void {
  if (!hasColumn('users', 'role')) {
    console.log('Migration: adding role to users table');
    db.run("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'");
    db.run("UPDATE users SET role = 'admin' WHERE username = 'admin'");
  }
}

export function getDb(): SqlJsDatabase {
  return db;
}

export function queryAll(sql: string, params: any[] = []): any[] {
  const stmt = db.prepare(sql);
  if (params.length > 0) {
    stmt.bind(params);
  }
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

export function queryOne(sql: string, params: any[] = []): any | undefined {
  const results = queryAll(sql, params);
  return results[0];
}

export function queryCount(sql: string, params: any[] = []): number {
  const result = queryOne(sql, params);
  return result?.count || 0;
}

function extractTableName(sql: string): string | null {
  const match = sql.match(/INSERT\s+INTO\s+(\w+)/i);
  return match ? match[1] : null;
}

export function run(sql: string, params: any[] = []): { lastInsertRowid: number; changes: number } {
  db.run(sql, params);

  const tableName = extractTableName(sql);
  if (tableName) {
    const maxIdResult = db.exec(`SELECT MAX(id) as maxId FROM ${tableName}`);
    const lastId = maxIdResult.length > 0 ? Number(maxIdResult[0].values[0][0]) || 0 : 0;
    if (transactionDepth === 0) {
      saveDatabase();
    }
    return { lastInsertRowid: lastId, changes: 1 };
  }

  if (transactionDepth === 0) {
    saveDatabase();
  }
  return { lastInsertRowid: 0, changes: 0 };
}

export function withTransaction<T>(fn: () => T): T {
  db.run('BEGIN TRANSACTION');
  transactionDepth++;
  try {
    const result = fn();
    db.run('COMMIT');
    transactionDepth--;
    saveDatabase();
    return result;
  } catch (err) {
    db.run('ROLLBACK');
    transactionDepth--;
    throw err;
  }
}