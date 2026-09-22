import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFileSync(resolve(root, file), "utf8");
const walk = (dir) => readdirSync(resolve(root, dir), { withFileTypes: true })
  .flatMap((entry) => entry.isDirectory() ? walk(dir + "/" + entry.name) : [dir + "/" + entry.name]);
const errors = [];
const docs = ["README.md", ...walk("docs").filter((p) => p.endsWith(".md"))];
if (existsSync(resolve(root, "load-test/README.md"))) docs.push("load-test/README.md");
for (const file of docs) {
  const body = read(file).replace(/\x60\x60\x60[^]*?\x60\x60\x60/g, "");
  for (const match of body.matchAll(/!?\[[^\]]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)) {
    const target = match[1].replace(/^<|>$/g, "");
    if (/^(?:[a-z]+:|#|\/)/i.test(target)) continue;
    const path = decodeURIComponent(target.split(/[?#]/)[0]);
    if (path && !existsSync(resolve(root, dirname(file), path))) errors.push(file + ": broken link " + path);
  }
}
const index = read("docs/README.md");
for (const file of walk("docs").filter((p) => /\.(md|mmd)$/.test(p) && p !== "docs/README.md")) {
  const path = relative(resolve(root, "docs"), resolve(root, file)).replaceAll("\\", "/");
  if (!index.includes("(" + path + ")")) errors.push("docs/README.md: missing " + path);
}
const example = new Set([...read(".env.example").matchAll(/^\s*(?:#\s*)?([A-Z][A-Z0-9_]*)=/gm)].map((m) => m[1]));
const backend = existsSync(resolve(root, "src/main/resources/application.yml"));
const files = backend
  ? walk("src/main/resources").filter((p) => /application[^/]*\.ya?ml$/.test(p))
  : walk("src").filter((p) => /\.(ts|js|vue)$/.test(p));
const referenced = new Set();
for (const file of files) {
  const pattern = backend ? /\$\{([A-Z][A-Z0-9_]*)(?=[:}])/g : /import\.meta\.env\.(VITE_[A-Z0-9_]+)/g;
  for (const match of read(file).matchAll(pattern)) referenced.add(match[1]);
}
for (const key of referenced) if (!example.has(key)) errors.push(".env.example: missing " + key);
for (const key of example) if (!referenced.has(key)) errors.push(".env.example: unused " + key);
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Documentation links, index and environment example checks passed.");
}
