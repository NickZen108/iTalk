const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const files = [
  "index.html",
  "styles.css",
  "app.js",
  "service-worker.js",
  "manifest.webmanifest",
  "icons/icon.svg"
];

fs.rmSync(dist, { recursive: true, force: true });
for (const file of files) {
  const source = path.join(root, file);
  const target = path.join(dist, file);
  if (!fs.existsSync(source)) throw new Error(`Mangler nødvendig fil: ${file}`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}
console.log(`iTalk bygget: ${path.relative(root, dist)}`);
