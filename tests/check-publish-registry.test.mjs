import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { checkPublishRegistry } from "../scripts/check-publish-registry.mjs";

const registry = "https://npm.pkg.github.com";
const repository =
  "https://github.com/sharelib-jp/digital-agency-components-svelte-implements.git";
const validManifest = {
  name: "@sharelib-jp/digital-agency-components-svelte-implements",
  repository: { type: "git", url: repository },
  publishConfig: { registry },
};
const directory = fileURLToPath(new URL("../", import.meta.url));
const guard = fileURLToPath(
  new URL("../scripts/check-publish-registry.mjs", import.meta.url),
);

function environment(explicitRegistry) {
  const env = { ...process.env };
  delete env.npm_config_registry;
  if (explicitRegistry !== undefined)
    env.npm_config_registry = explicitRegistry;
  return env;
}

function runGuard(explicitRegistry) {
  return spawnSync(process.execPath, [guard], {
    cwd: directory,
    env: environment(explicitRegistry),
    encoding: "utf8",
    timeout: 10000,
  });
}

test("absent explicit registry uses publishConfig", () => {
  assert.equal(checkPublishRegistry(validManifest, undefined), registry);
});

test("explicit GitHub Packages registry is accepted", () => {
  assert.equal(checkPublishRegistry(validManifest, registry), registry);
});

test("registry root with trailing slash is accepted", () => {
  const manifest = structuredClone(validManifest);
  manifest.publishConfig.registry += "/";
  assert.equal(checkPublishRegistry(manifest, registry + "/"), registry);
});

test("repository can use npm's string shorthand", () => {
  assert.equal(
    checkPublishRegistry({ ...validManifest, repository }),
    registry,
  );
});

for (const value of [
  "https://registry.npmjs.org",
  "https://registry.npmjs.org/",
  "http://npm.pkg.github.com",
  "https://npm.pkg.github.com.example.com",
  "https://npm.pkg.github.com:8443",
  "https://npm.pkg.github.com/other",
  "https://npm.pkg.github.com?registry=npmjs",
  "https://npm.pkg.github.com/#other",
  "https://user:password@npm.pkg.github.com",
  "",
  "not a URL",
  null,
]) {
  test(`explicit registry is rejected: ${JSON.stringify(value)}`, () => {
    assert.throws(
      () => checkPublishRegistry(validManifest, value),
      /npm_config_registry.*refusing publication/,
    );
  });
}

for (const value of [undefined, "https://registry.npmjs.org", "", null]) {
  test(`unsafe manifest registry is rejected even with GitHub override: ${JSON.stringify(value)}`, () => {
    const manifest = structuredClone(validManifest);
    manifest.publishConfig.registry = value;
    assert.throws(
      () => checkPublishRegistry(manifest, registry),
      /publishConfig.registry.*refusing publication/,
    );
  });
}

test("missing publishConfig is rejected", () => {
  const manifest = structuredClone(validManifest);
  delete manifest.publishConfig;
  assert.throws(() => checkPublishRegistry(manifest), /publishConfig.registry/);
});

for (const name of [
  undefined,
  "digital-agency-components-svelte-implements",
  "@another-owner/digital-agency-components-svelte-implements",
  "@sharelib-jp/another-package",
]) {
  test(`incorrect package identity is rejected: ${JSON.stringify(name)}`, () => {
    assert.throws(
      () => checkPublishRegistry({ ...validManifest, name }),
      /name.*scope @sharelib-jp/,
    );
  });
}

for (const value of [
  undefined,
  "https://github.com/another-owner/digital-agency-components-svelte-implements.git",
  "https://github.com/sharelib-jp/another-repository.git",
  { type: "svn", url: repository },
]) {
  test(`incorrect repository is rejected: ${JSON.stringify(value)}`, () => {
    assert.throws(
      () => checkPublishRegistry({ ...validManifest, repository: value }),
      /repository must identify the Git repository/,
    );
  });
}

test("actual manifest and CLI work without an explicit registry", () => {
  const manifest = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8"),
  );
  assert.equal(checkPublishRegistry(manifest), registry);
  const result = runGuard(undefined);
  assert.equal(result.status, 0, result.stderr);
  assert.match(
    result.stdout,
    /Publish registry verified: https:\/\/npm\.pkg\.github\.com/,
  );
});

test("CLI accepts explicit GitHub Packages registry", () => {
  const result = runGuard(registry);
  assert.equal(result.status, 0, result.stderr);
});

test("CLI rejects npmjs registry", () => {
  const result = runGuard("https://registry.npmjs.org");
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, /npm_config_registry.*refusing publication/);
});

test("CLI rejects an explicitly empty registry instead of falling back", () => {
  const result = runGuard("");
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, /npm_config_registry/);
});

test("prepublishOnly rejects npmjs before starting the build", () => {
  const result = spawnSync("pnpm", ["run", "prepublishOnly"], {
    cwd: directory,
    env: environment("https://registry.npmjs.org"),
    encoding: "utf8",
    timeout: 10000,
  });
  assert.ifError(result.error);
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, /npm_config_registry.*refusing publication/);
  assert.doesNotMatch(result.stdout, /\$ svelte-package|> svelte-package/);
});
