import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';

// Ensure the data directory exists
const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Database file path (use environment variable if provided)
const dbPath = process.env.DB_PATH || path.join(dataDir, 'agentify.db');

// Database connection
let db: Database<sqlite3.Database> | null = null;

// Initialize database
export const initDatabase = async () => {
  try {
    // Open database connection
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    // Enable foreign keys
    await db.exec('PRAGMA foreign_keys = ON');
    
    // Create chat_sessions table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        metadata TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create chat_messages table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('user', 'ai')),
        type TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
      )
    `);
    
    // Create trigger to update the updated_at timestamp
    await db.exec(`
      CREATE TRIGGER IF NOT EXISTS update_chat_sessions_timestamp
      AFTER UPDATE ON chat_sessions
      FOR EACH ROW
      BEGIN
        UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
      END;
    `);
    
    console.log('SQLite database initialized at:', dbPath);
  } catch (error) {
    console.error('Error initializing SQLite database:', error);
    throw error;
  }
};

// Define types for database results
interface SelectResult {
  [key: string]: string | number | boolean | null;
}

// Define types for database results
type RunResultType = {
  changes: number;
  lastID: number;
};

// Define return types for query function
type QueryResult<T extends string> = 
  T extends string ? (
    T extends `SELECT ${string}` ? SelectResult[] :
    T extends `INSERT ${string}` ? { insertId: number } :
    T extends `UPDATE ${string}` ? RunResultType :
    T extends `DELETE ${string}` ? RunResultType :
    RunResultType
  ) : never;

// Query helper functions
export const query = async <T extends string>(sql: T, params?: unknown): Promise<QueryResult<T>> => {
  if (!db) {
    await initDatabase();
  }
  
  try {
    // Handle different query types
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      const result = await db!.all(sql, params);
      return result as SelectResult[] as QueryResult<T>;
    } else if (sql.trim().toUpperCase().startsWith('INSERT')) {
      const result = await db!.run(sql, params);
      return { insertId: result.lastID } as QueryResult<T>;
    } else if (sql.trim().toUpperCase().startsWith('UPDATE')) {
      const result = await db!.run(sql, params);
      return { changes: result.changes, lastID: result.lastID } as QueryResult<T>;
    } else if (sql.trim().toUpperCase().startsWith('DELETE')) {
      const result = await db!.run(sql, params);
      return { changes: result.changes, lastID: result.lastID } as QueryResult<T>;
    } else {
      const result = await db!.run(sql, params);
      return { changes: result.changes, lastID: result.lastID } as QueryResult<T>;
    }
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Close database connection
export const closeDatabase = async () => {
  if (db) {
    await db.close();
    db = null;
    console.log('Database connection closed');
  }
};

export const dbService = {
  query,
  initDatabase,
  closeDatabase
};

export default dbService;
