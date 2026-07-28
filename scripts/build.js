const fs = require("node:fs");
const path = require("node:path");
const { buildSync } = require("esbuild");

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

const runtimeConfig = {
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY || ""
};
fs.writeFileSync(
  path.join(dist, "runtime-config.js"),
  `globalThis.ELEVSPOR_CONFIG=${JSON.stringify(runtimeConfig)};\n`,
  "utf8"
);
buildSync({
  entryPoints: [path.join(root, "src", "supabase-client.js")],
  outfile: path.join(dist, "supabase-client.js"),
  bundle: true,
  format: "iife",
  platform: "browser",
  minify: true,
  sourcemap: false
});
console.log(`Elevspor bygget: ${path.relative(root, dist)}`);
