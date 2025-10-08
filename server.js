import http from "http";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import url from "url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4173;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

function resolveFilePath(requestPath) {
  if (requestPath === "/" || requestPath === "") {
    return path.join(__dirname, "index.html");
  }
  if (["/pos", "/kds", "/call"].includes(requestPath)) {
    return path.join(__dirname, `${requestPath.slice(1)}.html`);
  }
  const filePath = path.join(__dirname, requestPath);
  if (existsSync(filePath) && !filePath.endsWith("/")) {
    return filePath;
  }
  return null;
}

async function serveFile(filePath, res) {
  try {
    const data = await readFile(filePath);
    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  } catch (error) {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Internal Server Error");
  }
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const filePath = resolveFilePath(parsedUrl.pathname);
  if (filePath) {
    await serveFile(filePath, res);
  } else {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not Found");
  }
});

server.listen(PORT, () => {
  console.log(`POS system dev server running at http://localhost:${PORT}`);
});
