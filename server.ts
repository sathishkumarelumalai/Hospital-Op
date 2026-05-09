import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "CarePredict Operational API is active" });
  });

  // Mock data storage (In a real app, this would be Firebase/DB)
  let historicalData: any[] = [];
  
  // Generating 30 days of data
  const departments = ["General Medicine", "Pediatrics", "Orthopedics", "Dermatology"];
  const startDate = new Date("2024-04-08");
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    departments.forEach(dept => {
      // Random walk for data
      const baseValue = dept === "General Medicine" ? 45 : dept === "Pediatrics" ? 30 : 20;
      const visitorCount = Math.round(baseValue + (Math.random() * 15) + (Math.sin(i * 0.5) * 10));
      historicalData.push({ 
        date: dateStr, 
        department: dept, 
        visitorCount 
      });
    });
  }
  
  // Sort by date ascending
  historicalData.sort((a, b) => a.date.localeCompare(b.date));

  app.get("/api/data", (req, res) => {
    res.json(historicalData);
  });

  app.post("/api/upload", (req, res) => {
    const newData = req.body;
    if (Array.isArray(newData)) {
      historicalData = [...historicalData, ...newData];
      res.json({ success: true, count: newData.length });
    } else {
      res.status(400).json({ error: "Invalid data format" });
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
