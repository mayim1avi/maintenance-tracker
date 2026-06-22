import { Router } from "express";
import multer from "multer";
import path from "node:path";
import { db, UPLOAD_DIR, type Priority, type Status } from "../db.js";
import { requireAuth } from "../auth.js";

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype.startsWith("image/")),
});

const PRIORITIES: Priority[] = ["low", "medium", "urgent"];
const STATUSES: Status[] = ["open", "in_progress", "done", "cancelled"];

const router = Router();
router.use(requireAuth);

// Joined select used by list + detail.
const ISSUE_SELECT = `
  SELECT i.*,
         l.name AS location_name,
         c.name AS category_name,
         r.name AS reporter_name,
         a.name AS assignee_name
  FROM issues i
  LEFT JOIN locations l ON l.id = i.location_id
  LEFT JOIN categories c ON c.id = i.category_id
  LEFT JOIN employees r ON r.id = i.reported_by
  LEFT JOIN employees a ON a.id = i.assigned_to
`;

// GET /api/issues?status=&location_id=&category_id=&priority=&assigned_to=&mine=reported|assigned
router.get("/", (req, res) => {
  const { status, location_id, category_id, priority, assigned_to, mine } =
    req.query;
  const where: string[] = [];
  const vals: unknown[] = [];

  if (status) (where.push("i.status = ?"), vals.push(status));
  if (location_id) (where.push("i.location_id = ?"), vals.push(Number(location_id)));
  if (category_id) (where.push("i.category_id = ?"), vals.push(Number(category_id)));
  if (priority) (where.push("i.priority = ?"), vals.push(priority));
  if (assigned_to) (where.push("i.assigned_to = ?"), vals.push(Number(assigned_to)));
  if (mine === "reported") (where.push("i.reported_by = ?"), vals.push(req.user!.id));
  if (mine === "assigned") (where.push("i.assigned_to = ?"), vals.push(req.user!.id));

  const sql =
    ISSUE_SELECT +
    (where.length ? ` WHERE ${where.join(" AND ")}` : "") +
    // open/in_progress first, then by priority (urgent first), then newest
    ` ORDER BY
        CASE i.status WHEN 'open' THEN 0 WHEN 'in_progress' THEN 1 WHEN 'done' THEN 2 ELSE 3 END,
        CASE i.priority WHEN 'urgent' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
        i.created_at DESC`;
  res.json(db.prepare(sql).all(...vals));
});

router.get("/:id", (req, res) => {
  const issue = db.prepare(ISSUE_SELECT + " WHERE i.id = ?").get(Number(req.params.id));
  if (!issue) return res.status(404).json({ error: "קריאה לא נמצאה" });
  const comments = db
    .prepare(
      `SELECT cm.id, cm.body, cm.created_at, e.name AS author_name
       FROM issue_comments cm JOIN employees e ON e.id = cm.employee_id
       WHERE cm.issue_id = ? ORDER BY cm.created_at`
    )
    .all(Number(req.params.id));
  res.json({ ...(issue as object), comments });
});

// Anyone authenticated can open a call.
router.post("/", upload.single("photo"), (req, res) => {
  const { title, description, location_id, category_id, priority } = req.body ?? {};
  if (!title) return res.status(400).json({ error: "נא להזין כותרת" });
  const prio: Priority = PRIORITIES.includes(priority) ? priority : "medium";
  const photo_path = req.file ? `/uploads/${req.file.filename}` : null;

  const info = db
    .prepare(
      `INSERT INTO issues (title, description, location_id, category_id, priority, reported_by, photo_path)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      title,
      description || null,
      location_id ? Number(location_id) : null,
      category_id ? Number(category_id) : null,
      prio,
      req.user!.id,
      photo_path
    );
  res.status(201).json({ id: info.lastInsertRowid });
});

// Update status / assignment / fields.
router.patch("/:id", (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare("SELECT * FROM issues WHERE id = ?").get(id) as
    | { status: Status }
    | undefined;
  if (!existing) return res.status(404).json({ error: "קריאה לא נמצאה" });

  const { title, description, location_id, category_id, priority, status, assigned_to } =
    req.body ?? {};
  const role = req.user!.role;
  const sets: string[] = [];
  const vals: unknown[] = [];

  if (title !== undefined) (sets.push("title = ?"), vals.push(title));
  if (description !== undefined) (sets.push("description = ?"), vals.push(description || null));
  if (location_id !== undefined)
    (sets.push("location_id = ?"), vals.push(location_id ? Number(location_id) : null));
  if (category_id !== undefined)
    (sets.push("category_id = ?"), vals.push(category_id ? Number(category_id) : null));
  if (priority !== undefined) {
    if (!PRIORITIES.includes(priority))
      return res.status(400).json({ error: "עדיפות לא תקינה" });
    sets.push("priority = ?"), vals.push(priority);
  }

  // Assignment + status changes are restricted to maintenance/admin.
  if (assigned_to !== undefined) {
    if (role === "staff") return res.status(403).json({ error: "אין הרשאה לשייך קריאה" });
    sets.push("assigned_to = ?"), vals.push(assigned_to ? Number(assigned_to) : null);
  }
  if (status !== undefined) {
    if (!STATUSES.includes(status))
      return res.status(400).json({ error: "סטטוס לא תקין" });
    if (role === "staff")
      return res.status(403).json({ error: "אין הרשאה לשנות סטטוס" });
    sets.push("status = ?"), vals.push(status);
    // stamp / clear resolved_at based on the new status
    if (status === "done") sets.push("resolved_at = datetime('now')");
    else sets.push("resolved_at = NULL");
  }

  if (!sets.length) return res.status(400).json({ error: "אין שינויים" });
  sets.push("updated_at = datetime('now')");
  vals.push(id);
  db.prepare(`UPDATE issues SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
  res.json({ ok: true });
});

router.post("/:id/comments", (req, res) => {
  const id = Number(req.params.id);
  const { body } = req.body ?? {};
  if (!body?.trim()) return res.status(400).json({ error: "תגובה ריקה" });
  const issue = db.prepare("SELECT id FROM issues WHERE id = ?").get(id);
  if (!issue) return res.status(404).json({ error: "קריאה לא נמצאה" });
  const info = db
    .prepare("INSERT INTO issue_comments (issue_id, employee_id, body) VALUES (?, ?, ?)")
    .run(id, req.user!.id, body.trim());
  res.status(201).json({ id: info.lastInsertRowid });
});

// Lightweight stats for a dashboard header.
router.get("/stats/summary", (_req, res) => {
  const byStatus = db
    .prepare("SELECT status, COUNT(*) AS count FROM issues GROUP BY status")
    .all();
  const urgentOpen = db
    .prepare(
      "SELECT COUNT(*) AS c FROM issues WHERE priority = 'urgent' AND status IN ('open','in_progress')"
    )
    .get() as { c: number };
  res.json({ byStatus, urgentOpen: urgentOpen.c });
});

export default router;
