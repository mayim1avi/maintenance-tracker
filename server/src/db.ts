import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// In production (e.g. Render) point DATA_DIR at a mounted persistent disk so the
// SQLite file and uploaded photos survive restarts/redeploys. Defaults to the
// server folder for local dev.
export const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "..");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, "data.sqlite");

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export type Role = "staff" | "maintenance" | "admin";
export type Priority = "low" | "medium" | "urgent";
export type Status = "open" | "in_progress" | "done" | "cancelled";

function init() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('staff','maintenance','admin')),
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      zone TEXT,
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS issues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      location_id INTEGER REFERENCES locations(id),
      category_id INTEGER REFERENCES categories(id),
      priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','urgent')),
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','done','cancelled')),
      reported_by INTEGER NOT NULL REFERENCES employees(id),
      assigned_to INTEGER REFERENCES employees(id),
      photo_path TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      resolved_at TEXT
    );

    CREATE TABLE IF NOT EXISTS issue_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      issue_id INTEGER NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      body TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
    CREATE INDEX IF NOT EXISTS idx_issues_assigned ON issues(assigned_to);
    CREATE INDEX IF NOT EXISTS idx_comments_issue ON issue_comments(issue_id);
  `);
}

function seed() {
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const adminName = process.env.ADMIN_NAME || "מנהל מערכת";

  const adminExists = db
    .prepare("SELECT COUNT(*) AS c FROM employees WHERE role = 'admin'")
    .get() as { c: number };

  if (adminExists.c === 0) {
    db.prepare(
      "INSERT INTO employees (name, username, password_hash, role) VALUES (?, ?, ?, 'admin')"
    ).run(adminName, adminUsername, bcrypt.hashSync(adminPassword, 10));
    console.log(`[seed] created admin user "${adminUsername}"`);
  }

  const catCount = db.prepare("SELECT COUNT(*) AS c FROM categories").get() as {
    c: number;
  };
  if (catCount.c === 0) {
    const cats = ["אינסטלציה", "חשמל", "ריהוט", "ניקיון", "מיזוג אוויר", "אחר"];
    const ins = db.prepare("INSERT INTO categories (name) VALUES (?)");
    for (const c of cats) ins.run(c);
    console.log(`[seed] created ${cats.length} categories`);
  }

  const locCount = db.prepare("SELECT COUNT(*) AS c FROM locations").get() as {
    c: number;
  };
  if (locCount.c === 0) {
    const locs: Array<[string, string]> = [
      ["חדר 101", "חדרים"],
      ["חדר 102", "חדרים"],
      ["לובי", "כללי"],
      ["מטבח", "כללי"],
      ["בריכה", "חוץ"],
    ];
    const ins = db.prepare("INSERT INTO locations (name, zone) VALUES (?, ?)");
    for (const [name, zone] of locs) ins.run(name, zone);
    console.log(`[seed] created ${locs.length} locations`);
  }
}

export function initDb() {
  init();
  seed();
}
