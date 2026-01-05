import Database from "better-sqlite3";
import path from "path";

// Path to SQLite file
const dbPath = path.join(__dirname, "..", "db", "database.sqlite");

// Create (or open) database
const db = new Database(dbPath);

// Enable foreign keys
db.pragma("foreign_keys = ON");

export default db;
