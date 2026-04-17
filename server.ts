import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import multer from "multer";
import cors from "cors";
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  const upload = multer({ storage: multer.memoryStorage() });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/extract-text", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const dataBuffer = req.file.buffer;
      const data = await pdf(dataBuffer);

      res.json({
        text: data.text,
        info: data.info,
        numpages: data.numpages,
      });
    } catch (error) {
      console.error("PDF Extraction Error:", error);
      res.status(500).json({ error: "Failed to extract text from PDF" });
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
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
