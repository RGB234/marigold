import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const source = resolve(
  process.env.VALIDATION_POLICY_SOURCE ?? resolve(scriptDir, "../../back/src/main/resources/validation-policy.json"),
);
const target = resolve(scriptDir, "../src/shared/validation/validation-policy.json");
const command = process.argv[2];
if (!["--check", "--write"].includes(command)) {
  console.error("Usage: node scripts/sync-validation-policy.mjs --check|--write");
  process.exit(1);
}

const contents = readFileSync(source, "utf8");
const sourcePolicy = JSON.parse(contents);

if (command === "--check") {
  const targetPolicy = JSON.parse(readFileSync(target, "utf8"));
  if (JSON.stringify(sourcePolicy) !== JSON.stringify(targetPolicy)) {
    console.error("validation-policy.json is out of sync with backend policy.");
    console.error(`front: ${target}`);
    console.error(`back:  ${source}`);
    process.exit(1);
  }
  console.log("Validation policy is synchronized with the backend.");
} else {
  writeFileSync(target, contents.endsWith("\n") ? contents : contents + "\n", "utf8");
  console.log(`Synchronized validation policy from ${source}`);
}
