import { Router } from "express";
import { db } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";

const router = Router();

router.get("/", requireAuth, (_req, res) => {
  const rows = db
    .prepare("SELECT id, name, active FROM categories ORDER BY active DESC, name")
    .all();
  res.json(rows);
});

router.use(requireAuth, requireRole("admin"));

router.post("/", (req, res) => {
  const { name } = req.body ?? {};
  if (!name) return res.status(400).json({ error: "נא להזין שם קטגוריה" });
  const info = db.prepare("INSERT INTO categories (name) VALUES (?)").run(name);
  res.status(201).json({ id: info.lastInsertRowid });
});

router.patch("/:id", (req, res) => {
  const id = Number(req.params.id);
  const { name, active } = req.body ?? {};
  const sets: string[] = [];
  const vals: unknown[] = [];
  if (name !== undefined) (sets.push("name = ?"), vals.push(name));
  if (active !== undefined) (sets.push("active = ?"), vals.push(active ? 1 : 0));
  if (!sets.length) return res.status(400).json({ error: "אין שינויים" });
  vals.push(id);
  db.prepare(`UPDATE categories SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
  res.json({ ok: true });
});

export default router;
