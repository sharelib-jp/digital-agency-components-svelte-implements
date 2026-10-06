import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { constants } from "node:fs";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { compile } from "svelte/compiler";
import { build } from "vite";

// Node 22+ provides WebSocket. FIREFOX_BIN optionally selects a Firefox executable.
// No driver, browser download, example page, or generated harness file is needed.
const frontendDirectory = fileURLToPath(new URL("../", import.meta.url));
const entryId = "virtual:components-browser-entry";
const harnessId = "virtual:components-browser-harness.svelte";

function withTimeout(promise, milliseconds, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${milliseconds}ms`)),
      milliseconds,
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function findFirefox() {
  const candidates = process.env.FIREFOX_BIN
    ? [process.env.FIREFOX_BIN]
    : [
        "/usr/bin/firefox",
        "/usr/bin/firefox-esr",
        "/Applications/Firefox.app/Contents/MacOS/firefox",
        ...(process.env.PATH ?? "")
          .split(path.delimiter)
          .filter(Boolean)
          .flatMap((directory) =>
            ["firefox", "firefox-esr"].map((name) =>
              path.join(directory, name),
            ),
          ),
      ];
  for (const candidate of new Set(candidates)) {
    try {
      await access(candidate, constants.X_OK);
      return candidate;
    } catch (error) {
      if (!["ENOENT", "ENOTDIR", "EACCES"].includes(error.code)) throw error;
    }
  }
  if (process.env.FIREFOX_BIN)
    throw new Error(
      `FIREFOX_BIN is not executable: ${process.env.FIREFOX_BIN}`,
    );
  return null;
}

async function bundleHarness(harnessSource, expectedWarnings) {
  const result = await withTimeout(
    build({
      root: frontendDirectory,
      configFile: false,
      envFile: false,
      publicDir: false,
      logLevel: "silent",
      plugins: [
        {
          name: "in-memory-component-harness",
          enforce: "pre",
          resolveId(id, importer) {
            if (importer === `\0${harnessId}` && id.startsWith("."))
              return path.resolve(frontendDirectory, "tests", id);
            if (id === entryId || id === harnessId) return `\0${id}`;
          },
          load(id) {
            if (id === `\0${entryId}`)
              return `
                    import { mount, tick } from 'svelte';
                    import Harness from '${harnessId}';
                    window.harness = mount(Harness, { target: document.getElementById('app') });
                    window.settle = async () => {
                        await tick();
                        await new Promise(resolve => setTimeout(resolve, 0));
                        await tick();
                    };
                    await window.settle();
                    window.harnessReady = true;
                `;
            if (id === `\0${harnessId}`) return harnessSource;
            if (id.endsWith(".svelte")) return readFile(id, "utf8");
          },
          transform(source, id) {
            if (!id.endsWith(".svelte")) return;
            const filename =
              id === `\0${harnessId}`
                ? path.join(frontendDirectory, "tests/BrowserHarness.svelte")
                : id;
            const compiled = compile(source, {
              filename,
              generate: "client",
              css: "injected",
              dev: true,
            });
            assert.deepEqual(
              compiled.warnings.map(({ code, message }) => ({ code, message })),
              expectedWarnings[path.basename(filename)] ?? [],
              `${path.basename(filename)} compiler warnings`,
            );
            return { code: compiled.js.code, map: compiled.js.map };
          },
        },
      ],
      build: {
        write: false,
        minify: false,
        target: "es2022",
        rolldownOptions: {
          input: entryId,
          output: { format: "es", entryFileNames: "harness.js" },
        },
      },
    }),
    30000,
    "Vite harness build",
  );
  const outputs = (Array.isArray(result) ? result : [result]).flatMap(
    (output) => output.output,
  );
  const assets = new Map(
    outputs.map((output) => [
      `/${output.fileName}`,
      output.type === "chunk" ? output.code : output.source,
    ]),
  );
  assets.set(
    "/",
    `<!doctype html><html lang="ja"><head><meta charset="utf-8">
        <title>Component browser regression tests</title>
        <style>body { margin: 24px; } section { margin-bottom: 32px; }</style>
        <script>
            window.browserErrors = [];
            addEventListener('error', event => window.browserErrors.push(event.message));
            addEventListener('unhandledrejection', event => window.browserErrors.push(String(event.reason)));
        </script></head><body><div id="app"></div><script type="module" src="/harness.js"></script></body></html>`,
  );
  return assets;
}

function firefoxEndpoint(browser) {
  return withTimeout(
    new Promise((resolve, reject) => {
      let output = "";
      const handleData = (chunk) => {
        output = (output + String(chunk)).slice(-16000);
        const match = output.match(
          /WebDriver BiDi listening on (ws:\/\/[^\s]+)/,
        );
        if (match) resolve(new URL("/session", match[1]).href);
      };
      browser.stdout.on("data", handleData);
      browser.stderr.on("data", handleData);
      browser.once("error", reject);
      browser.once("exit", (code, signal) =>
        reject(
          new Error(
            `Firefox exited before BiDi startup (${code ?? signal}):\n${output}`,
          ),
        ),
      );
    }),
    20000,
    "Firefox BiDi startup",
  );
}

class BiDi {
  nextId = 0;
  pending = new Map();
  errors = [];
  sessionActive = false;

  constructor(url) {
    this.socket = new WebSocket(url);
    this.connected = withTimeout(
      new Promise((resolve, reject) => {
        this.socket.addEventListener("open", resolve, { once: true });
        this.socket.addEventListener(
          "error",
          () => reject(new Error(`BiDi connection failed: ${url}`)),
          { once: true },
        );
      }),
      8000,
      "BiDi connection",
    );
    this.socket.addEventListener("message", ({ data }) => {
      const message = JSON.parse(data);
      if (message.type === "event") {
        if (
          message.method === "log.entryAdded" &&
          message.params.level === "error"
        ) {
          this.errors.push(message.params.text);
        }
        return;
      }
      const request = this.pending.get(message.id);
      if (!request) return;
      this.pending.delete(message.id);
      clearTimeout(request.timer);
      if (message.type === "error") {
        request.reject(
          new Error(`${request.method}: ${message.error}: ${message.message}`),
        );
      } else {
        request.resolve(message.result);
      }
    });
    this.socket.addEventListener("close", () =>
      this.rejectPending(new Error("BiDi connection closed")),
    );
    this.socket.addEventListener("error", () =>
      this.rejectPending(new Error("BiDi WebSocket error")),
    );
  }

  rejectPending(error) {
    for (const request of this.pending.values()) {
      clearTimeout(request.timer);
      request.reject(error);
    }
    this.pending.clear();
  }

  command(method, params = {}, timeout = 5000) {
    if (this.socket.readyState !== WebSocket.OPEN)
      return Promise.reject(new Error("BiDi is not connected"));
    const id = ++this.nextId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`${method} timed out after ${timeout}ms`));
      }, timeout);
      this.pending.set(id, { resolve, reject, timer, method });
      try {
        this.socket.send(JSON.stringify({ id, method, params }));
      } catch (error) {
        this.pending.delete(id);
        clearTimeout(timer);
        reject(error);
      }
    });
  }

  async close() {
    this.rejectPending(new Error("BiDi test cleanup"));
    if (this.socket.readyState === WebSocket.CLOSED) return;
    const closed = new Promise((resolve) =>
      this.socket.addEventListener("close", resolve, { once: true }),
    );
    this.socket.close();
    await withTimeout(closed, 2000, "BiDi socket close").catch(() => {});
  }
}

class BrowserPage {
  constructor(bidi, context, url) {
    this.bidi = bidi;
    this.context = context;
    this.url = url;
  }

  async evaluate(body) {
    const result = await this.bidi.command("script.evaluate", {
      expression: `(async () => { ${body}\n })().then(value => JSON.stringify(value ?? null))`,
      target: { context: this.context },
      awaitPromise: true,
    });
    assert.equal(
      result.type,
      "success",
      result.exceptionDetails?.text ?? "Browser script failed",
    );
    assert.equal(result.result.type, "string");
    return JSON.parse(result.result.value);
  }

  read(expression) {
    return this.evaluate(`return (${expression});`);
  }
  snapshot() {
    return this.read("window.harness.snapshot()");
  }
  setState(patch) {
    return this.evaluate(
      `window.harness.setState(${JSON.stringify(patch)}); await window.settle();`,
    );
  }

  async expect(expression, expected, message = expression) {
    const deadline = Date.now() + 4000;
    let actual;
    do {
      actual = await this.read(expression);
      try {
        assert.deepEqual(actual, expected, message);
        return;
      } catch (error) {
        if (!(error instanceof assert.AssertionError)) throw error;
      }
      await delay(25);
    } while (Date.now() < deadline);
    assert.deepEqual(actual, expected, message);
  }

  async load() {
    this.bidi.errors.length = 0;
    await this.bidi.command(
      "browsingContext.navigate",
      {
        context: this.context,
        url: this.url,
        wait: "complete",
      },
      10000,
    );
    await this.expect("window.harnessReady === true", true, "Harness mounted");
  }

  async focus(selector) {
    await this.evaluate(
      `document.querySelector(${JSON.stringify(selector)}).focus();`,
    );
  }

  async fill(selector, value) {
    await this.evaluate(`
            const element = document.querySelector(${JSON.stringify(selector)});
            element.focus();
            element.value = ${JSON.stringify(value)};
            element.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: ${JSON.stringify(value)} }));
            await window.settle();
        `);
  }

  async click(selector) {
    const position = await this.evaluate(`
            const element = document.querySelector(${JSON.stringify(selector)});
            if (!element) throw new Error('Missing click target: ' + ${JSON.stringify(selector)});
            element.scrollIntoView({ block: 'center' });
            const bounds = element.getBoundingClientRect();
            if (!bounds.width || !bounds.height) throw new Error('Click target has no layout box');
            return { x: Math.round(bounds.x + bounds.width / 2), y: Math.round(bounds.y + bounds.height / 2) };
        `);
    await this.bidi.command("input.performActions", {
      context: this.context,
      actions: [
        {
          type: "pointer",
          id: "mouse",
          parameters: { pointerType: "mouse" },
          actions: [
            {
              type: "pointerMove",
              origin: "viewport",
              ...position,
              duration: 0,
            },
            { type: "pointerDown", button: 0 },
            { type: "pointerUp", button: 0 },
          ],
        },
      ],
    });
    await this.evaluate("await window.settle();");
  }

  async key(value) {
    await this.bidi.command("input.performActions", {
      context: this.context,
      actions: [
        {
          type: "key",
          id: "keyboard",
          actions: [
            { type: "keyDown", value },
            { type: "keyUp", value },
          ],
        },
      ],
    });
    await this.evaluate("await window.settle();");
  }

  async assertNoErrors() {
    assert.deepEqual(
      await this.read("window.browserErrors"),
      [],
      "Uncaught browser errors",
    );
    assert.deepEqual(this.bidi.errors, [], "BiDi error logs");
  }
}

async function stopFirefox(browser, exited) {
  if (!browser?.pid || browser.exitCode !== null || browser.signalCode !== null)
    return;
  browser.kill("SIGTERM");
  try {
    await withTimeout(exited, 4000, "Firefox shutdown");
  } catch {
    browser.kill("SIGKILL");
    await withTimeout(exited, 4000, "Firefox forced shutdown");
  }
}

// Legacy components can specify an exact warning baseline; new warnings still fail.
export function browserTest(title, harnessSource, run, expectedWarnings = {}) {
  test(title, { timeout: 180000 }, async (t) => {
    const executable = await findFirefox();
    if (!executable) {
      t.skip(
        "Firefox is not installed; install Firefox or set FIREFOX_BIN to run browser regressions.",
      );
      return;
    }
    assert.equal(
      typeof WebSocket,
      "function",
      "Use Node 22+ with the built-in WebSocket",
    );
    let server, browser, exited, bidi, profile;
    try {
      const assets = await bundleHarness(harnessSource, expectedWarnings);
      server = createServer((request, response) => {
        const pathname = new URL(request.url, "http://localhost").pathname;
        const asset = assets.get(pathname);
        if (asset === undefined) {
          response.writeHead(404).end();
          return;
        }
        response
          .writeHead(200, {
            "content-type":
              pathname === "/"
                ? "text/html; charset=utf-8"
                : pathname.endsWith(".css")
                  ? "text/css; charset=utf-8"
                  : "text/javascript; charset=utf-8",
            "cache-control": "no-store",
          })
          .end(asset);
      });
      await withTimeout(
        new Promise((resolve, reject) => {
          server.once("error", reject);
          server.listen(0, "127.0.0.1", resolve);
        }),
        5000,
        "Harness HTTP server startup",
      );
      const url = `http://127.0.0.1:${server.address().port}/`;
      profile = await mkdtemp(
        path.join(tmpdir(), "components-browser-firefox-"),
      );
      browser = spawn(
        executable,
        [
          "--headless",
          "--no-remote",
          "--profile",
          profile,
          "--remote-debugging-port",
          "0",
        ],
        {
          stdio: ["ignore", "pipe", "pipe"],
        },
      );
      exited = new Promise((resolve) => browser.once("exit", resolve));
      bidi = new BiDi(await firefoxEndpoint(browser));
      await bidi.connected;
      const session = await bidi.command("session.new", {
        capabilities: { alwaysMatch: {} },
      });
      bidi.sessionActive = true;
      t.diagnostic(
        `Firefox ${session.capabilities.browserVersion}; Node ${process.versions.node}`,
      );
      await bidi.command("session.subscribe", {
        events: ["log.entryAdded"],
      });
      const { context } = await bidi.command("browsingContext.create", {
        type: "tab",
      });
      const page = new BrowserPage(bidi, context, url);
      const runCase = (name, run) =>
        t.test(name, { timeout: 20000 }, async () => {
          await page.load();
          await run(page);
          await page.assertNoErrors();
        });

      await run(t, page, runCase);
    } finally {
      try {
        if (bidi?.sessionActive)
          await bidi.command("session.end", {}, 3000).catch(() => {});
        await bidi?.close();
      } finally {
        try {
          await stopFirefox(browser, exited);
        } finally {
          try {
            if (server?.listening) {
              server.closeAllConnections();
              await withTimeout(
                new Promise((resolve, reject) => {
                  server.close((error) => (error ? reject(error) : resolve()));
                }),
                3000,
                "Harness HTTP server shutdown",
              );
            }
          } finally {
            if (profile)
              await rm(profile, {
                recursive: true,
                force: true,
                maxRetries: 3,
                retryDelay: 100,
              });
          }
        }
      }
    }
  });
}
