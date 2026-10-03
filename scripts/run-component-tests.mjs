import { spawnSync } from "node:child_process";
import { readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const browser = process.argv.includes("--browser");
const files = (await readdir(new URL("../tests/", import.meta.url)))
  .filter((name) => name.endsWith(".test.mjs"))
  .filter((name) => browser === name.endsWith(".browser.test.mjs"))
  .filter(
    (name) =>
      !["package.test.mjs", "check-publish-registry.test.mjs"].includes(name),
  )
  .sort()
  .map((name) => `tests/${name}`);

if (!files.length) throw new Error("No component test files found.");
const result = spawnSync(
  process.execPath,
  ["--test", `--test-concurrency=${browser ? 1 : 2}`, ...files],
  { cwd: root, stdio: "inherit" },
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
