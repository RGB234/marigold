import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";

const root = fileURLToPath(new URL("../", import.meta.url));
const mode = process.argv[2];
if (!["dev", "prod"].includes(mode)) {
  console.error("Usage: npm run check:env -- dev|prod");
  process.exit(1);
}
const keys = [...readFileSync(new URL("../.env.example", import.meta.url), "utf8")
  .matchAll(/^(VITE_[A-Z0-9_]+)=/gm)].map((match) => match[1]);
const env = loadEnv(mode, root, "VITE_");
const missing = keys.filter((key) => !env[key]?.trim());
if (missing.length) {
  console.error("Missing environment variables: " + missing.join(", "));
  process.exit(1);
}
console.log("Required environment variables are configured for " + mode + ".");
