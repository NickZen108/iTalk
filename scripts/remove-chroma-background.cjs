const fs = require("node:fs");
const { PNG } = require("pngjs");

const [input, output, key = "255,0,255"] = process.argv.slice(2);
if (!input || !output) throw new Error("Usage: node remove-chroma-background.cjs input.png output.png [r,g,b]");
const [keyR, keyG, keyB] = key.split(",").map(Number);

const png = PNG.sync.read(fs.readFileSync(input));
for (let i = 0; i < png.data.length; i += 4) {
  const r = png.data[i];
  const g = png.data[i + 1];
  const b = png.data[i + 2];
  const distance = Math.sqrt((keyR - r) ** 2 + (keyG - g) ** 2 + (keyB - b) ** 2);
  const alpha = Math.max(0, Math.min(255, Math.round((distance - 45) * 5)));
  if (alpha < 255) {
    png.data[i + 3] = alpha;
  }
}
fs.writeFileSync(output, PNG.sync.write(png));
