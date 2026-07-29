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
  "icons/icon.svg",
  "assets/elevspor-logo.png"
];

fs.rmSync(dist, { recursive: true, force: true });
for (const file of files) {
  const source = path.join(root, file);
  const target = path.join(dist, file);
  if (!fs.existsSync(source)) throw new Error(`Mangler nødvendig fil: ${file}`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

// The visible timestamp must describe the artifact being published, not the
// last time index.html happened to be edited.
const publishedAt = new Date();
const dateTime = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Copenhagen",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false
}).formatToParts(publishedAt).reduce((parts, part) => {
  parts[part.type] = part.value;
  return parts;
}, {});
const offsetName = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Copenhagen",
  timeZoneName: "longOffset"
}).formatToParts(publishedAt).find(part => part.type === "timeZoneName")?.value;
const offsetMatch = offsetName?.match(/GMT([+-])(\d{2}):(\d{2})/);
if (!offsetMatch) throw new Error("Kunne ikke beregne dansk tidszone");
const isoOffset = `${offsetMatch[1]}${offsetMatch[2]}:${offsetMatch[3]}`;
const machineTimestamp =
  `${dateTime.year}-${dateTime.month}-${dateTime.day}T${dateTime.hour}:${dateTime.minute}:${dateTime.second}${isoOffset}`;
const danishTimestamp = new Intl.DateTimeFormat("da-DK", {
  timeZone: "Europe/Copenhagen",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false
}).format(publishedAt).replace(" kl. ", " kl. ").replace(":", ".");
const builtIndexPath = path.join(dist, "index.html");
const builtIndex = fs.readFileSync(builtIndexPath, "utf8");
const stampedIndex = builtIndex.replace(
  /<time datetime="[^"]+">[^<]+<\/time>/,
  `<time datetime="${machineTimestamp}">${danishTimestamp}</time>`
);
if (stampedIndex === builtIndex) throw new Error("Kunne ikke opdatere udgivelsestidspunktet");
fs.writeFileSync(builtIndexPath, stampedIndex, "utf8");

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
