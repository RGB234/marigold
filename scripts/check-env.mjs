import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFileSync(resolve(root, file), "utf8");
const walk = (dir) => readdirSync(resolve(root, dir), { withFileTypes: true })
  .flatMap((entry) => entry.isDirectory() ? walk(dir + "/" + entry.name) : [dir + "/" + entry.name]);
const mode = process.argv[2];
if (mode && !["development", "prod"].includes(mode)) {
  console.error("Usage: npm run check:env -- development|prod");
  process.exit(1);
}

const exampleBody = read(".env.example");
const required = [...exampleBody.matchAll(/^(VITE_[A-Z0-9_]+)=/gm)].map((match) => match[1]);
const example = new Set([...exampleBody.matchAll(/^\s*(?:#\s*)?([A-Z][A-Z0-9_]*)=/gm)].map((match) => match[1]));
const referenced = new Set();
for (const file of walk("src").filter((path) => /\.(ts|js|vue)$/.test(path))) {
  for (const match of read(file).matchAll(/import\.meta\.env\.(VITE_[A-Z0-9_]+)/g)) {
    referenced.add(match[1]);
  }
}

const errors = [];
for (const key of referenced) if (!example.has(key)) errors.push(".env.example: missing " + key);
for (const key of example) if (!referenced.has(key)) errors.push(".env.example: unused " + key);

if (mode) {
  const env = loadEnv(mode, root, "VITE_");
  const missing = required.filter((key) => !env[key]?.trim());
  if (missing.length) errors.push("Missing environment variables: " + missing.join(", "));
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(mode
  ? "Environment example and required variables are configured for " + mode + "."
  : "Environment example checks passed.");
