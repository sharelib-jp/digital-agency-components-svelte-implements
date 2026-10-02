import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const registry = "https://npm.pkg.github.com";
const packageName = "@sharelib-jp/digital-agency-components-svelte-implements";
const repository =
  "https://github.com/sharelib-jp/digital-agency-components-svelte-implements.git";

function assertGitHubRegistry(value, label) {
  const message = `${label} must be ${registry}; refusing publication to npmjs.org or any other registry.`;
  if (typeof value !== "string") throw new Error(message);

  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(message);
  }
  if (
    url.origin !== registry ||
    url.pathname !== "/" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error(message);
  }
}

export function checkPublishRegistry(manifest, explicitRegistry) {
  if (manifest?.name !== packageName) {
    throw new Error(
      `package.json name must be ${packageName} (scope @sharelib-jp).`,
    );
  }

  const configuredRepository = manifest.repository;
  const repositoryUrl =
    typeof configuredRepository === "string"
      ? configuredRepository
      : configuredRepository?.url;
  if (
    repositoryUrl !== repository ||
    (typeof configuredRepository !== "string" &&
      configuredRepository?.type !== "git")
  ) {
    throw new Error(
      `package.json repository must identify the Git repository ${repository}.`,
    );
  }

  assertGitHubRegistry(
    manifest.publishConfig?.registry,
    "publishConfig.registry",
  );
  // An absent CLI/environment override falls back to publishConfig, not npm's default registry.
  if (explicitRegistry !== undefined) {
    assertGitHubRegistry(explicitRegistry, "npm_config_registry");
  }
  return registry;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    const manifest = JSON.parse(
      await readFile(new URL("../package.json", import.meta.url), "utf8"),
    );
    checkPublishRegistry(manifest, process.env.npm_config_registry);
    console.log(`Publish registry verified: ${registry}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
