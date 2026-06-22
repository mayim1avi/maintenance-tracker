import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, type Role } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";

const router = Router();
const ROLES: Role[] = ["staff", "maintenance", "admin"];

// Any authenticated user can read the employee list (needed for assignment UI),
// but only safe fields are returned.
router.get("/", requireAuth, (_req, res) => {
  const rows = db
    .prepare(
      "SELECT id, name, username, role, active FROM employees ORDER BY active DESC, name"
    )
    .all();
  res.json(rows);
});

// Mutations are admin-only.
router.use(requireAuth, requireRole("admin"));

router.post("/", (req, res) => {
  const { name, username, password, role } = req.body ?? {};
  if (!name || !username || !password || !role)
    return res.status(400).json({ error: "חסרים שדות חובה" });
  if (!ROLES.includes(role))
    return res.status(400).json({ error: "תפקיד לא תקין" });

  try {
    const info = db
      .prepare(
        "INSERT INTO employees (name, username, password_hash, role) VALUES (?, ?, ?, ?)"
      )
      .run(name, username, bcrypt.hashSync(password, 10), role);
    res.status(201).json({ id: info.lastInsertRowid });
  } catch (e: any) {
    if (String(e.message).includes("UNIQUE"))
      return res.status(409).json({ error: "שם המשתמש כבר קיים" });
    throw e;
  }
});

router.patch("/:id", (req, res) => {
  const id = Number(req.params.id);
  const { name, role, active, password } = req.body ?? {};
  const sets: string[] = [];
  const vals: unknown[] = [];
  if (name !== undefined) (sets.push("name = ?"), vals.push(name));
  if (role !== undefined) {
    if (!ROLES.includes(role))
      return res.status(400).json({ error: "תפקיד לא תקין" });
    sets.push("role = ?"), vals.push(role);
  }
  if (active !== undefined) (sets.push("active = ?"), vals.push(active ? 1 : 0));
  if (password) (sets.push("password_hash = ?"), vals.push(bcrypt.hashSync(password, 10)));
  if (!sets.length) return res.status(400).json({ error: "אין שינויים" });
  vals.push(id);
  db.prepare(`UPDATE employees SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
  res.json({ ok: true });
});

export default router;
