import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "../db.js";
import { requireAuth, signToken, type AuthUser } from "../auth.js";

const router = Router();

router.post("/login", (req, res) => {
  const { username, password } = req.body ?? {};
  if (!username || !password)
    return res.status(400).json({ error: "נא להזין שם משתמש וסיסמה" });

  const row = db
    .prepare(
      "SELECT id, name, username, password_hash, role, active FROM employees WHERE username = ?"
    )
    .get(username) as
    | {
        id: number;
        name: string;
        username: string;
        password_hash: string;
        role: AuthUser["role"];
        active: number;
      }
    | undefined;

  if (!row || !row.active || !bcrypt.compareSync(password, row.password_hash))
    return res.status(401).json({ error: "שם משתמש או סיסמה שגויים" });

  const user: AuthUser = {
    id: row.id,
    username: row.username,
    name: row.name,
    role: row.role,
  };
  res.json({ token: signToken(user), employee: user });
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ employee: req.user });
});

export default router;
