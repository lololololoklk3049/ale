// setup.js — run this after `npm install` to copy Scramjet/BareMux assets
import { copyFileSync, mkdirSync, existsSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const dirs = [
  "public/static/scramjet",
  "public/static/baremux",
];

for (const d of dirs) {
  mkdirSync(join(__dirname, d), { recursive: true });
}

const copyIfExists = (src, dest) => {
  if (existsSync(src)) {
    copyFileSync(src, dest);
    console.log(`  ✓ ${dest}`);
  } else {
    console.warn(`  ✗ Not found: ${src}`);
  }
};

console.log("\n🔴 RED Browser — Asset Setup\n");

// Copy BareMux worker
const baremuxDist = join(__dirname, "node_modules/@mercuryworkshop/bare-mux/dist");
if (existsSync(baremuxDist)) {
  const files = readdirSync(baremuxDist);
  files.forEach(f => {
    copyIfExists(join(baremuxDist, f), join(__dirname, `public/static/baremux/${f}`));
  });
} else {
  console.warn("  ✗ bare-mux not found — run npm install first");
}

// Copy Scramjet dist (check common locations)
const scramjetPaths = [
  join(__dirname, "node_modules/@mercuryworkshop/scramjet/dist"),
  join(__dirname, "node_modules/scramjet-core/dist"),
];

let scramjetFound = false;
for (const p of scramjetPaths) {
  if (existsSync(p)) {
    const files = readdirSync(p);
    files.forEach(f => {
      copyIfExists(join(p, f), join(__dirname, `public/static/scramjet/${f}`));
    });
    scramjetFound = true;
    break;
  }
}
if (!scramjetFound) {
  console.warn("  ✗ scramjet dist not found — install @mercuryworkshop/scramjet");
}

console.log("\n✅ Setup complete. Run: npm start\n");
