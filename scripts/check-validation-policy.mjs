import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const frontPolicyPath = resolve(scriptDir, "../src/global/validation/validation-policy.json");
const backPolicyPath = resolve(
  process.env.VALIDATION_POLICY_SOURCE ?? "../back/src/main/resources/validation-policy.json",
);

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const sortValue = (value) => {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nestedValue]) => [key, sortValue(nestedValue)]),
    );
  }

  return value;
};
const stableJson = (value) => JSON.stringify(sortValue(value), null, 2);

const frontPolicy = readJson(frontPolicyPath);
const backPolicy = readJson(backPolicyPath);

if (stableJson(frontPolicy) !== stableJson(backPolicy)) {
  console.error("validation-policy.json is out of sync with backend policy.");
  console.error(`front: ${frontPolicyPath}`);
  console.error(`back:  ${backPolicyPath}`);
  process.exit(1);
}
