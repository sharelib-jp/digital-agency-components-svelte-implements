import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkPublishRegistry } from "./check-publish-registry.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const manifest = JSON.parse(
  await readFile(path.join(root, "package.json"), "utf8"),
);
const registry = checkPublishRegistry(manifest);
const destination = path.join(root, ".svelte-kit", "published-package");
const specification = `${manifest.name}@${manifest.version}`;

function npmJson(args) {
  const result = spawnSync(
    "npm",
    [...args, "--json", `--registry=${registry}`],
    {
      cwd: root,
      encoding: "utf8",
      timeout: 120_000,
      maxBuffer: 8 * 1024 * 1024,
    },
  );
  if (result.error || result.status !== 0) {
    throw new Error(
      `npm ${args[0]} failed: ${result.error?.message ?? result.stderr}`,
    );
  }
  return JSON.parse(result.stdout);
}

const metadata = npmJson(["view", specification]);
if (
  metadata.name !== manifest.name ||
  metadata.version !== manifest.version ||
  !metadata.dist?.integrity
) {
  throw new Error("The registry returned unexpected package metadata.");
}
if (new URL(metadata.dist.tarball).origin !== registry) {
  throw new Error("The published archive must come from GitHub Packages.");
}

await mkdir(destination, { recursive: true });
const [archive] = npmJson([
  "pack",
  specification,
  "--pack-destination",
  destination,
]);
if (archive.integrity !== metadata.dist.integrity) {
  throw new Error(
    "The downloaded package integrity does not match the registry.",
  );
}
await writeFile(
  path.join(destination, "metadata.json"),
  `${JSON.stringify(metadata, null, 2)}\n`,
);
console.log(
  `Saved the verified GitHub Packages archive and metadata for ${specification}.`,
);
