import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  classifyNpmViewResult,
  isPackageVersionPublished,
  registry,
} from "./package-version-published.mjs";

const version = "0.0.1";
const manifest = {
  name: "@sharelib-jp/digital-agency-components-svelte-implements",
  version,
};
const npmError = (code) => JSON.stringify({ error: { code } });
const result = (overrides = {}) => ({
  status: 1,
  signal: null,
  stdout: "",
  stderr: "",
  ...overrides,
});

for (const publishedVersion of [
  version,
  "1.2.3",
  "1.2.3-rc.1",
  "1.2.3+build.1",
]) {
  test(`exact version ${publishedVersion} is already published`, () => {
    assert.equal(
      classifyNpmViewResult(
        result({ status: 0, stdout: JSON.stringify(publishedVersion) }),
        publishedVersion,
      ),
      true,
    );
  });
}

for (const stream of ["stdout", "stderr"]) {
  test(`structured E404 on ${stream} means unpublished`, () => {
    assert.equal(
      classifyNpmViewResult(result({ [stream]: npmError("E404") }), version),
      false,
    );
  });
}

test("E404 JSON with ordinary npm error logs means unpublished", () => {
  assert.equal(
    classifyNpmViewResult(
      result({
        stdout: npmError("E404"),
        stderr:
          "npm error code E404\nnpm error 404 No match found for version\n",
      }),
      version,
    ),
    false,
  );
});

for (const code of [
  "E401",
  "E403",
  "E429",
  "E500",
  "E503",
  "ENOTFOUND",
  "ECONNRESET",
  "ETIMEDOUT",
  "EAI_AGAIN",
]) {
  for (const stream of ["stdout", "stderr"]) {
    test(`${code} on ${stream} fails instead of deciding publication status`, () => {
      assert.throws(
        () =>
          classifyNpmViewResult(result({ [stream]: npmError(code) }), version),
        /npm view failed/,
      );
    });
  }
}

for (const [label, response] of [
  ["no response", result()],
  ["plain-text E404", result({ stderr: "npm error code E404\n" })],
  ["HTTP status without npm code", result({ stdout: npmError(404) })],
  ["top-level E404", result({ stdout: JSON.stringify({ code: "E404" }) })],
  ["malformed JSON", result({ stdout: '{"error":{"code":"E404"}' })],
  [
    "404 in an authentication message",
    result({
      stdout: JSON.stringify({ error: { code: "E401", summary: "404" } }),
    }),
  ],
  [
    "contradictory JSON codes",
    result({ stdout: npmError("E404"), stderr: npmError("E403") }),
  ],
  [
    "contradictory log code",
    result({ stdout: npmError("E404"), stderr: "npm ERR! code ECONNRESET\n" }),
  ],
  ["successful empty response", result({ status: 0 })],
  ["successful null response", result({ status: 0, stdout: "null" })],
  [
    "successful array response",
    result({ status: 0, stdout: JSON.stringify([version]) }),
  ],
  [
    "successful mismatched version",
    result({ status: 0, stdout: JSON.stringify("0.0.2") }),
  ],
  [
    "successful error response",
    result({ status: 0, stdout: npmError("E404") }),
  ],
  [
    "successful version with an error",
    result({
      status: 0,
      stdout: JSON.stringify(version),
      stderr: npmError("E403"),
    }),
  ],
  [
    "successful version with an error log",
    result({
      status: 0,
      stdout: JSON.stringify(version),
      stderr: "npm error code E401\n",
    }),
  ],
  [
    "failure with a version response",
    result({ stdout: JSON.stringify(version) }),
  ],
  [
    "missing exit status",
    result({ status: undefined, stdout: npmError("E404") }),
  ],
  ["null exit status", result({ status: null, stdout: npmError("E404") })],
  ["negative exit status", result({ status: -1, stdout: npmError("E404") })],
  [
    "signal termination",
    result({ signal: "SIGTERM", stdout: npmError("E404") }),
  ],
]) {
  test(`${label} fails closed`, () => {
    assert.throws(() => classifyNpmViewResult(response, version));
  });
}

for (const code of ["ENOENT", "ETIMEDOUT", "ENOBUFS"]) {
  test(`spawn error ${code} takes precedence over an E404 response`, () => {
    const error = Object.assign(new Error(code), { code });
    assert.throws(
      () =>
        classifyNpmViewResult(
          result({ error, stdout: npmError("E404") }),
          version,
        ),
      { message: `Could not execute npm view: ${code}`, cause: error },
    );
  });
}

test("queries the exact manifest version on GitHub Packages without a shell", () => {
  let calls = 0;
  const published = isPackageVersionPublished(
    manifest,
    (command, args, options) => {
      calls += 1;
      assert.equal(command, "npm");
      assert.deepEqual(args, [
        "view",
        `${manifest.name}@${manifest.version}`,
        "version",
        "--json",
        "--registry=https://npm.pkg.github.com",
        "--fetch-retries=0",
        "--fetch-timeout=30000",
      ]);
      assert.equal(registry, "https://npm.pkg.github.com");
      assert.deepEqual(options, {
        encoding: "utf8",
        timeout: 45000,
        maxBuffer: 1024 * 1024,
      });
      return result({ status: 0, stdout: JSON.stringify(version) });
    },
  );
  assert.equal(published, true);
  assert.equal(calls, 1);
});

test("initial 0.0.1 may be published when npm returns E404", () => {
  assert.equal(
    isPackageVersionPublished(manifest, () =>
      result({ stdout: npmError("E404") }),
    ),
    false,
  );
});

for (const overrides of [
  { name: "unscoped" },
  { name: "@other/package" },
  { name: "@sharelib-jp/package\npublished=false" },
  { name: undefined },
  { version: undefined },
  { version: 1 },
  { version: "latest" },
  { version: "^0.0.1" },
  { version: "0.0.1\npublished=false" },
]) {
  test(`invalid manifest ${JSON.stringify(overrides)} fails before invoking npm`, () => {
    let calls = 0;
    assert.throws(
      () =>
        isPackageVersionPublished({ ...manifest, ...overrides }, () => {
          calls += 1;
          return result({ stdout: npmError("E404") });
        }),
      /package\.json/,
    );
    assert.equal(calls, 0);
  });
}

test("CLI emits GitHub output only after a conclusive registry response", async (t) => {
  const directory = mkdtempSync(
    path.join(tmpdir(), "package-version-published-"),
  );
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const output = path.join(directory, "github-output");
  const script = fileURLToPath(
    new URL("./package-version-published.mjs", import.meta.url),
  );
  const actualManifest = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8"),
  );
  writeFileSync(
    path.join(directory, "npm"),
    `#!${process.execPath}\n` +
      "const response = JSON.parse(process.env.TEST_NPM_RESPONSE);\n" +
      "process.stdout.write(response.stdout);\n" +
      "process.stderr.write(response.stderr);\n" +
      "process.exitCode = response.status;\n",
    { mode: 0o755 },
  );

  for (const [label, response, expectedPublished] of [
    [
      "already published",
      result({ status: 0, stdout: JSON.stringify(actualManifest.version) }),
      true,
    ],
    ["unpublished", result({ stdout: npmError("E404") }), false],
    ["unauthorized", result({ stdout: npmError("E401") }), undefined],
    ["forbidden", result({ stdout: npmError("E403") }), undefined],
    ["DNS failure", result({ stdout: npmError("ENOTFOUND") }), undefined],
    ["connection reset", result({ stdout: npmError("ECONNRESET") }), undefined],
    ["timeout", result({ stdout: npmError("ETIMEDOUT") }), undefined],
    ["malformed response", result({ stdout: "{invalid" }), undefined],
    ["plain-text 404", result({ stderr: "npm error code E404\n" }), undefined],
    ["empty success", result({ status: 0 }), undefined],
  ]) {
    await t.test(label, () => {
      writeFileSync(output, "");
      const cli = spawnSync(process.execPath, [script], {
        env: {
          ...process.env,
          PATH: directory,
          GITHUB_OUTPUT: output,
          TEST_NPM_RESPONSE: JSON.stringify(response),
        },
        encoding: "utf8",
        timeout: 10000,
      });
      assert.equal(cli.error, undefined);
      assert.equal(cli.signal, null);
      if (expectedPublished === undefined) {
        assert.equal(cli.status, 1, cli.stderr);
        assert.match(cli.stderr, /Package publication status check failed/);
        assert.equal(cli.stdout, "");
        assert.equal(readFileSync(output, "utf8"), "");
      } else {
        assert.equal(cli.status, 0, cli.stderr);
        assert.equal(cli.stderr, "");
        assert.match(cli.stdout, /on https:\/\/npm\.pkg\.github\.com/);
        assert.equal(
          readFileSync(output, "utf8"),
          `published=${expectedPublished}\n`,
        );
      }
    });
  }

  await t.test(
    "missing npm executable fails without a publication output",
    () => {
      writeFileSync(output, "");
      const cli = spawnSync(process.execPath, [script], {
        env: {
          ...process.env,
          PATH: path.join(directory, "missing-bin"),
          GITHUB_OUTPUT: output,
        },
        encoding: "utf8",
        timeout: 10000,
      });
      assert.equal(cli.status, 1, cli.stderr);
      assert.match(cli.stderr, /Could not execute npm view/);
      assert.equal(readFileSync(output, "utf8"), "");
    },
  );
});
