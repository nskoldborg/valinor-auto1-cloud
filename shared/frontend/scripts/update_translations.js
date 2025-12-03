import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";

// --- Fix __dirname for ESM ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Correct paths for Docker ---
const FRONTEND_ROOT = path.resolve(__dirname, "..");          // /app/frontend
const SRC_DIR = path.join(FRONTEND_ROOT, "src");              // /app/frontend/src
const LANG_DIR = path.join(FRONTEND_ROOT, "src/languages");
const MASTER_FILE = path.join(LANG_DIR, "en-ENG-master.json");

console.log("📁 FRONTEND_ROOT:", FRONTEND_ROOT);
console.log("📁 SRC_DIR:", SRC_DIR);
console.log("📁 LANG_DIR:", LANG_DIR);
console.log("📄 MASTER_FILE:", MASTER_FILE);

function getAllFiles(dir, ext = [".js", ".jsx"]) {
  if (!fs.existsSync(dir)) {
    console.log(`⚠️ Directory does not exist: ${dir}`);
    return [];
  }

  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...getAllFiles(fullPath, ext));
    else if (ext.includes(path.extname(entry.name))) files.push(fullPath);
  }
  return files;
}

function extractTranslationKeys(content) {
  const regex = /t\(["'`]([^"'`]+)["'`]\)/g;
  const keys = [];
  let match;
  while ((match = regex.exec(content))) keys.push(match[1]);
  return keys;
}

async function runUpdate() {
  console.log("\n🔍 Scanning project for translation keys...");

  const allFiles = getAllFiles(SRC_DIR);
  console.log(`📄 Files scanned: ${allFiles.length}`);

  const usedKeys = new Set();

  for (const file of allFiles) {
    const content = fs.readFileSync(file, "utf8");
    extractTranslationKeys(content).forEach((k) => usedKeys.add(k));
  }

  console.log(`✅ Found ${usedKeys.size} unique translation keys in code.`);

  if (!fs.existsSync(MASTER_FILE)) {
    console.error(`❌ Master file not found: ${MASTER_FILE}`);
    process.exit(1);
  }

  const masterData = JSON.parse(fs.readFileSync(MASTER_FILE, "utf8"));
  let updated = false;

  // Add missing keys
  for (const key of usedKeys) {
    if (!masterData[key]) {
      masterData[key] = key;
      console.log(`➕ Added missing key: "${key}"`);
      updated = true;
    }
  }

  // Unused keys (no interactive CLI allowed)
  const unusedKeys = Object.keys(masterData).filter((k) => !usedKeys.has(k));
  if (unusedKeys.length > 0) {
    console.log(`⚠️ Found ${unusedKeys.length} unused keys (skipped, no CLI allowed).`);
  }

  if (updated) {
    fs.writeFileSync(MASTER_FILE, JSON.stringify(masterData, null, 2));
    console.log("💾 Saved updated master file.");
  } else {
    console.log("✨ No changes needed.");
  }

  console.log("✅ Translation sync complete.\n");
}

// --- Execute ---
(async () => {
  try {
    await runUpdate();
  } catch (err) {
    console.error("❌ Script fatal error:", err);
    process.exit(1);
  }
})();