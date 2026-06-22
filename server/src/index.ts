import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { initDb, UPLOAD_DIR } from "./db.js";
import authRoutes from "./routes/auth.js";
import issuesRoutes from "./routes/issues.js";
import employeesRoutes from "./routes/employees.js";
import locationsRoutes from "./routes/locations.js";
import categoriesRoutes from "./routes/categories.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

initDb();

const app = express();
const PORT = Number(process.env.PORT) || 4000;

const origins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim());
app.use(cors({ origin: origins }));
app.use(express.json());

// Serve uploaded photos.
app.use("/uploads", express.static(UPLOAD_DIR));

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/issues", issuesRoutes);
app.use("/api/employees", employeesRoutes);
app.use("/api/locations", locationsRoutes);
app.use("/api/categories", categoriesRoutes);

// In production, serve the built client (client/dist) for any non-API route.
const clientDist = path.join(__dirname, "..", "..", "client", "dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api|\/uploads).*/, (_req, res) =>
    res.sendFile(path.join(clientDist, "index.html"))
  );
}

// Central error handler (e.g. multer file-size errors).
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || "שגיאת שרת" });
  }
);

app.listen(PORT, () => console.log(`[server] listening on http://localhost:${PORT}`));
