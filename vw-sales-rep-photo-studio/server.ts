import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("history.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    dealer TEXT NOT NULL,
    showroom TEXT NOT NULL,
    image_front TEXT,
    image_side TEXT,
    image_full TEXT,
    background_type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // API Routes
  app.get("/api/history", (req, res) => {
    try {
      const rows = db.prepare("SELECT * FROM history ORDER BY created_at DESC").all();
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch history" });
    }
  });

  app.post("/api/history", (req, res) => {
    const { name, dealer, showroom, image_front, image_side, image_full, background_type } = req.body;
    try {
      const stmt = db.prepare(`
        INSERT INTO history (name, dealer, showroom, image_front, image_side, image_full, background_type)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      const info = stmt.run(name, dealer, showroom, image_front, image_side, image_full, background_type);
      res.json({ id: info.lastInsertRowid });
    } catch (error) {
      res.status(500).json({ error: "Failed to save history" });
    }
  });

  app.delete("/api/history/:id", (req, res) => {
    const { id } = req.params;
    console.log(`Attempting to delete history item with id: ${id}`);
    try {
      const result = db.prepare("DELETE FROM history WHERE id = ?").run(Number(id));
      if (result.changes > 0) {
        console.log(`Successfully deleted item ${id}`);
        res.json({ success: true });
      } else {
        console.warn(`No item found with id ${id}`);
        res.status(404).json({ error: "Item not found" });
      }
    } catch (error) {
      console.error(`Failed to delete item ${id}:`, error);
      res.status(500).json({ error: "Failed to delete item" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
