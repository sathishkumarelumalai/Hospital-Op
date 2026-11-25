import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import zlib from "zlib";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALLOWED_ROOT_FILES = [
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "vite.config.ts",
  "index.html",
  "server.ts",
  "metadata.json",
  "README.md",
  ".env.example",
  ".gitignore",
  "example_data.csv",
];

const ALLOWED_DIRS = ["src"];

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

interface ZipEntry {
  name: string;
  data: Buffer;
  mtime: Date;
}

function buildZipBuffer(entries: ZipEntry[]): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name, "utf8");
    const compressed = zlib.deflateRawSync(entry.data);
    const crc = crc32(entry.data);

    const d = entry.mtime;
    const dosTime =
      ((d.getHours() & 0x1f) << 11) |
      ((d.getMinutes() & 0x3f) << 5) |
      ((d.getSeconds() >> 1) & 0x1f);
    const dosDate =
      (((Math.max(d.getFullYear(), 1980) - 1980) & 0x7f) << 9) |
      (((d.getMonth() + 1) & 0x0f) << 5) |
      (d.getDate() & 0x1f);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(8, 8);
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(entry.data.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, nameBuf, compressed);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(8, 10);
    centralHeader.writeUInt16LE(dosTime, 12);
    centralHeader.writeUInt16LE(dosDate, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(compressed.length, 20);
    centralHeader.writeUInt32LE(entry.data.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralParts.push(centralHeader, nameBuf);
    offset += localHeader.length + nameBuf.length + compressed.length;
  }

  const centralDir = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralDir.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDir, eocd]);
}

function collectProjectEntries(projectRoot: string): ZipEntry[] {
  const realRoot = fs.realpathSync(projectRoot);
  const entries: ZipEntry[] = [];

  const addFileIfSafe = (fullPath: string, relZipPath: string) => {
    if (!fs.existsSync(fullPath)) return;
    const lstat = fs.lstatSync(fullPath);
    if (lstat.isSymbolicLink() || !lstat.isFile()) return;
    const resolved = fs.realpathSync(fullPath);
    if (!resolved.startsWith(realRoot + path.sep)) return;
    entries.push({
      name: `carepredict-os/${relZipPath.replace(/\\/g, "/")}`,
      data: fs.readFileSync(resolved),
      mtime: lstat.mtime,
    });
  };

  for (const filename of ALLOWED_ROOT_FILES) {
    addFileIfSafe(path.join(realRoot, filename), filename);
  }

  const walkDir = (dirPath: string, relBase: string) => {
    if (!fs.existsSync(dirPath)) return;
    const lstat = fs.lstatSync(dirPath);
    if (lstat.isSymbolicLink() || !lstat.isDirectory()) return;
    const resolvedDir = fs.realpathSync(dirPath);
    if (!resolvedDir.startsWith(realRoot + path.sep)) return;

    const items = fs.readdirSync(resolvedDir, { withFileTypes: true });
    for (const item of items) {
      if (item.name.startsWith(".") || item.name === "node_modules" || item.name === "dist") {
        continue;
      }
      const nextFull = path.join(resolvedDir, item.name);
      const nextRel = path.posix.join(relBase, item.name);
      if (item.isDirectory()) {
        walkDir(nextFull, nextRel);
      } else if (item.isFile()) {
        addFileIfSafe(nextFull, nextRel);
      }
    }
  };

  for (const dir of ALLOWED_DIRS) {
    walkDir(path.join(realRoot, dir), dir);
  }

  return entries;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "CarePredict Operational API is active" });
  });

  app.get("/api/download-project", (req, res) => {
    try {
      const entries = collectProjectEntries(process.cwd());
      const zipBuffer = buildZipBuffer(entries);
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", 'attachment; filename="carepredict-os-project.zip"');
      res.setHeader("Content-Length", zipBuffer.length.toString());
      res.setHeader("Cache-Control", "no-store");
      res.send(zipBuffer);
    } catch (err) {
      console.error("Failed to package project archive:", err);
      res.status(500).json({ error: "Failed to create project archive" });
    }
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
