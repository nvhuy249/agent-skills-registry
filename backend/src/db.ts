import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

// Path to SQLite file. DATABASE_PATH lets tests and deployments use an isolated DB.
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, "..", "db", "database.sqlite");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

// Create (or open) database
const db = new Database(dbPath);

// Enable foreign keys
db.pragma("foreign_keys = ON");

export default db;
