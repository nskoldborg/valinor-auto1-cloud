// scripts/extract_translations.js
import fs from "fs";
import path from "path";
import { globSync } from "glob";
import * as parser from "@babel/parser";
import traverseModule from "@babel/traverse";
import * as t from "@babel/types";

const traverse = traverseModule.default; // ✅ ESM fix

const ROOT = process.cwd();
const CANDIDATE_DIRS = ["src", "app", "pages", "components"]
  .map((d) => path.resolve(ROOT, d))
  .filter((p) => fs.existsSync(p));

const LANG_DIR = path.resolve(ROOT, "./src/languages");
const MASTER_FILE = path.join(LANG_DIR, "en-ENG-master.json");

const FILES = CANDIDATE_DIRS.flatMap((dir) =>
  globSync(`${dir}/**/*.{js,jsx,ts,tsx}`, {
    nodir: true,
    ignore: [
      "**/node_modules/**",
      "**/*.d.ts",
      "**/dist/**",
      "**/build/**",
      "**/.next/**",
      "**/__tests__/**",
      "**/*.spec.*",
      "**/*.test.*",
    ],
  })
);

console.log("🔍 Scanning for translation keys...");
console.log(
  `📂 Scanning ${FILES.length} files in: ${
    CANDIDATE_DIRS.map((d) => path.relative(ROOT, d)).join(", ") || "(none)"
  }`
);

const keys = new Set();
const perFile = [];

function addKey(k) {
  const key = `${k}`.trim();
  if (!key) return false;
  if (key.length > 200) return false;
  if (/^https?:\/\//i.test(key)) return false;
  keys.add(key);
  return true;
}

function getLiteralArg(node) {
  if (t.isStringLiteral(node)) return node.value;
  if (t.isTemplateLiteral(node) && node.expressions.length === 0) {
    return node.quasis.map((q) => q.value.cooked || "").join("");
  }
  return null;
}

function isIdentifierNamed(node, name) {
  return t.isIdentifier(node, { name });
}

function isMemberNamed(node, propName) {
  return (
    t.isMemberExpression(node) &&
    ((t.isIdentifier(node.property) && node.property.name === propName) ||
      (t.isStringLiteral(node.property) && node.property.value === propName))
  );
}

function parseFile(code, filename) {
  try {
    return parser.parse(code, {
      sourceType: "module",
      plugins: [
        "jsx",
        "typescript",
        "classProperties",
        "objectRestSpread",
        "decorators-legacy",
        "dynamicImport",
        "optionalChaining",
        "nullishCoalescingOperator",
      ],
    });
  } catch (e) {
    console.warn(`⚠️  Parse error in ${filename}: ${e.message}`);
    return null;
  }
}

for (const file of FILES) {
  const code = fs.readFileSync(file, "utf8");
  const ast = parseFile(code, file);
  if (!ast) continue;

  const before = keys.size;

  traverse(ast, {
    // ===============================
    // Translation function calls
    // ===============================
    CallExpression(path) {
      const { node } = path;

      if (!node.arguments || node.arguments.length === 0) return;
      const literal = getLiteralArg(node.arguments[0]);
      if (literal == null) return;

      const callee = node.callee;

      // t("..."), __("..."), translate("...")
      if (
        isIdentifierNamed(callee, "t") ||
        isIdentifierNamed(callee, "__") ||
        isIdentifierNamed(callee, "translate")
      ) {
        addKey(literal);
        return;
      }

      // i18n.t("...") or obj.t("...")
      if (isMemberNamed(callee, "t")) {
        addKey(literal);
        return;
      }

      // react-intl: formatMessage({ id: "..." })
      if (isIdentifierNamed(callee, "formatMessage") || isMemberNamed(callee, "formatMessage")) {
        const arg = node.arguments[0];
        if (t.isObjectExpression(arg)) {
          const idProp = arg.properties.find(
            (p) =>
              t.isObjectProperty(p) &&
              ((t.isIdentifier(p.key) && p.key.name === "id") ||
                (t.isStringLiteral(p.key) && p.key.value === "id"))
          );
          if (idProp && getLiteralArg(idProp.value)) {
            addKey(getLiteralArg(idProp.value));
          }
        }
      }

      // react-intl: defineMessages({ x: { id: "..." }, ... })
      if (isIdentifierNamed(callee, "defineMessages")) {
        const arg = node.arguments[0];
        if (t.isObjectExpression(arg)) {
          for (const prop of arg.properties) {
            if (!t.isObjectProperty(prop) || !t.isObjectExpression(prop.value)) continue;
            const idProp = prop.value.properties.find(
              (p) =>
                t.isObjectProperty(p) &&
                ((t.isIdentifier(p.key) && p.key.name === "id") ||
                  (t.isStringLiteral(p.key) && p.key.value === "id"))
            );
            if (idProp) {
              const idVal = getLiteralArg(idProp.value);
              if (idVal) addKey(idVal);
            }
          }
        }
      }
    },

    // ===============================
    // <Trans i18nKey="...">...</Trans>
    // ===============================
    JSXElement(path) {
      const { node } = path;
      const opening = node.openingElement;

      const name =
        t.isJSXIdentifier(opening.name) ? opening.name.name :
        t.isJSXMemberExpression(opening.name) && t.isJSXIdentifier(opening.name.property)
          ? opening.name.property.name
          : null;

      // Only <Trans>
      if (name !== "Trans") {
        // Optional: extract visible text (for auto bootstrap)
        const visibleText = node.children
          .map((c) => (t.isJSXText(c) ? c.value.trim() : ""))
          .filter((v) => v && /\w/.test(v))
          .join(" ")
          .trim();
        if (visibleText && visibleText.length < 120) addKey(visibleText);
        return;
      }

      // <Trans i18nKey="..." />
      const keyAttr = opening.attributes.find(
        (a) =>
          t.isJSXAttribute(a) &&
          t.isJSXIdentifier(a.name, { name: "i18nKey" }) &&
          a.value &&
          (t.isStringLiteral(a.value) ||
            (t.isJSXExpressionContainer(a.value) && t.isStringLiteral(a.value.expression)))
      );

      if (keyAttr) {
        const v = t.isStringLiteral(keyAttr.value)
          ? keyAttr.value.value
          : keyAttr.value.expression.value;
        addKey(v);
        return;
      }

      // Otherwise use <Trans>Inner text</Trans>
      const text = node.children
        .map((c) => {
          if (t.isJSXText(c)) return c.value;
          if (t.isJSXExpressionContainer(c) && t.isStringLiteral(c.expression))
            return c.expression.value;
          return "";
        })
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      if (text) addKey(text);
    },

    // data-i18n="..."
    JSXAttribute(path) {
      const { node } = path;
      if (!t.isJSXIdentifier(node.name, { name: "data-i18n" })) return;
      if (t.isStringLiteral(node.value)) addKey(node.value.value);
      else if (t.isJSXExpressionContainer(node.value) && t.isStringLiteral(node.value.expression)) {
        addKey(node.value.expression.value);
      }
    },
  });

  const added = keys.size - before;
  if (added > 0) perFile.push({ file, added });
}

if (keys.size === 0) {
  console.warn("⚠️ No translation keys found.");
  process.exit(0);
}

fs.mkdirSync(LANG_DIR, { recursive: true });

// Merge with existing
let existing = {};
if (fs.existsSync(MASTER_FILE)) {
  try {
    existing = JSON.parse(fs.readFileSync(MASTER_FILE, "utf8"));
  } catch {
    console.warn(`⚠️ Could not parse ${MASTER_FILE}, recreating.`);
  }
}

const sortedNew = Array.from(keys).sort((a, b) => a.localeCompare(b));
const merged = { ...existing };
let newCount = 0;
for (const k of sortedNew) {
  if (!(k in merged)) {
    merged[k] = k;
    newCount++;
  }
}

const ordered = Object.fromEntries(Object.entries(merged).sort(([a], [b]) => a.localeCompare(b)));
fs.writeFileSync(MASTER_FILE, JSON.stringify(ordered, null, 2), "utf8");

console.log(`✅ Found ${sortedNew.length} unique literal keys.`);
console.log(`📘 Master file updated: ${MASTER_FILE}`);
console.log(`🧮 Totals — merged: ${Object.keys(merged).length}, new: ${newCount}`);

if (perFile.length) {
  console.log("\n🔎 Top files by matches:");
  perFile
    .sort((a, b) => b.added - a.added)
    .slice(0, 20)
    .forEach(({ file, added }) => console.log(`  +${added}  ${path.relative(ROOT, file)}`));
}