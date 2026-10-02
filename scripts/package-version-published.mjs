import { spawnSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const registry = "https://npm.pkg.github.com";

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

export function classifyNpmViewResult(result, version) {
  if (result.error) {
    throw new Error(`Could not execute npm view: ${result.error.message}`, {
      cause: result.error,
    });
  }
  if (result.signal || !Number.isInteger(result.status) || result.status < 0) {
    throw new Error(
      `npm view did not complete normally (signal: ${result.signal ?? "none"}).`,
    );
  }

  const stdout = parseJson(result.stdout);
  const stderr = parseJson(result.stderr);
  const errorCodes = [stdout?.error?.code, stderr?.error?.code].filter(
    (code) => code !== undefined,
  );

  const logCodes = (result.stderr ?? "")
    .split(/\r?\n/)
    .map((line) => /^npm (?:ERR!|error) code (\S+)\s*$/.exec(line)?.[1])
    .filter(Boolean);
  const codes = [...errorCodes, ...logCodes];

  if (result.status === 0) {
    if (codes.length || stdout !== version) {
      throw new Error(
        `npm view returned an unexpected response for ${version}.`,
      );
    }
    return true;
  }

  // Only structured npm errors count: a log mentioning 404 is not proof of absence.
  if (errorCodes.length > 0 && codes.every((code) => code === "E404")) {
    return false;
  }

  throw new Error(
    `npm view failed (exit ${result.status}; codes: ${codes.join(", ") || "unknown"}). Only JSON error.code=E404 means unpublished.`,
  );
}

export function isPackageVersionPublished(manifest, runNpm = spawnSync) {
  if (!/^@sharelib-jp\/[a-z0-9][a-z0-9._-]*$/.test(manifest.name ?? "")) {
    throw new Error(
      "package.json name must be an @sharelib-jp scoped package.",
    );
  }
  if (
    typeof manifest.version !== "string" ||
    !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(
      manifest.version,
    )
  ) {
    throw new Error("package.json must specify a package version.");
  }

  const result = runNpm(
    "npm",
    [
      "view",
      `${manifest.name}@${manifest.version}`,
      "version",
      "--json",
      `--registry=${registry}`,
      "--fetch-retries=0",
      "--fetch-timeout=30000",
    ],
    { encoding: "utf8", timeout: 45000, maxBuffer: 1024 * 1024 },
  );
  return classifyNpmViewResult(result, manifest.version);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    const manifest = JSON.parse(
      readFileSync(new URL("../package.json", import.meta.url), "utf8"),
    );
    const published = isPackageVersionPublished(manifest);
    if (process.env.GITHUB_OUTPUT) {
      appendFileSync(process.env.GITHUB_OUTPUT, `published=${published}\n`);
    }
    console.log(
      `${manifest.name}@${manifest.version} is ${published ? "already published" : "not published"} on ${registry}.`,
    );
  } catch (error) {
    console.error(`Package publication status check failed: ${error.message}`);
    process.exitCode = 1;
  }
}
