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
const componentDirectory = path.join(frontendDirectory, "src/lib/components");
const componentNames = [
  "HorizontalMenu",
  "Checkbox",
  "RadioButton",
  "Switch",
  "Textarea",
  "SearchBox",
  "PageNavigation",
  "NotificationBanner",
  "ModalDialog",
];
const entryId = "virtual:components-browser-entry";
const harnessId = "virtual:components-browser-harness.svelte";

// Generate independent legacy variables: a shared object's coarse invalidation can
// reapply indeterminate between native change listeners when checked is updated.
const initialState = {
  selectedId: "overview",
  expandedId: null,
  checkboxChecked: false,
  indeterminate: true,
  radioGroup: "a",
  cancelRadioReset: false,
  switchChecked: false,
  modeChecked: false,
  switchDisabled: false,
  textareaValue: "ab",
  searchValue: "seed",
  searchScope: "all",
  currentPage: 2,
  bannerOpen: true,
  modalOpen: false,
  cancelModal: false,
};

const harnessSource = `
<script>
    ${componentNames.map((name) => `import ${name} from ${JSON.stringify(path.join(componentDirectory, `${name}.svelte`))};`).join("\n    ")}
    ${Object.entries(initialState)
      .map(([name, value]) => `let ${name} = ${JSON.stringify(value)};`)
      .join("\n    ")}
    let events = [];
    const menuItems = [
        { id: 'overview', label: '概要', href: '#overview' },
        { id: 'contact', label: 'お問い合わせ', href: '#contact' },
        { id: 'services', label: 'サービス', children: [
            { id: 'tax', label: '税金' }, { id: 'records', label: '記録' },
        ] },
    ];
    const scopeOptions = [
        { value: 'all', label: 'すべて' }, { value: 'docs', label: '資料' },
    ];
    function record(type, detail = {}) { events = [...events, { type, ...detail }]; }
    export function snapshot() { return { ${Object.keys(initialState).join(", ")}, events }; }
    export function setState(patch) {
        ${Object.keys(initialState)
          .map(
            (name) =>
              `if (Object.hasOwn(patch, '${name}')) ${name} = patch.${name};`,
          )
          .join("\n        ")}
    }
</script>

<main>
    <section id="menu-fixture">
        <HorizontalMenu items={menuItems} bind:selectedId bind:expandedId
            on:select={(event) => record('menu-select', { id: event.detail.id })} />
    </section>
    <section>
        <Checkbox id="checkbox" label="同意" bind:checked={checkboxChecked} bind:indeterminate
            on:change={(event) => record('checkbox-change', { checked: event.target.checked })} />
    </section>
    <section>
        <form id="radio-form" on:reset={(event) => {
            record('radio-reset');
            if (cancelRadioReset) event.preventDefault();
        }}>
            <RadioButton id="radio-a" name="category" value="a" label="A" bind:group={radioGroup}
                on:change={() => record('radio-change', { value: 'a' })} />
            <RadioButton id="radio-b" name="category" value="b" label="B" bind:group={radioGroup}
                on:change={() => record('radio-change', { value: 'b' })} />
            <button id="radio-reset" type="reset">選択を戻す</button>
        </form>
    </section>
    <section>
        <Switch id="switch" label="通知" bind:checked={switchChecked} disabled={switchDisabled}
            on:change={() => record('switch-change')} />
        <Switch id="mode" type="mode" label="モード" bind:checked={modeChecked} disabled={switchDisabled}
            on:input={() => record('mode-input')} on:change={() => record('mode-change')} />
    </section>
    <section id="textarea-fixture">
        <Textarea id="textarea" label="メッセージ" counterMax={5} bind:value={textareaValue}
            on:input={(event) => record('textarea-input', { value: event.target.value })} />
    </section>
    <section id="search-fixture">
        <SearchBox id="search" bind:value={searchValue} bind:scope={searchScope} {scopeOptions} detailOpen={true}
            on:search={(event) => record('search', {
                value: event.detail.value, scope: event.detail.scope,
                formData: [...event.detail.formData], nativeSubmit: event.detail.originalEvent instanceof SubmitEvent,
            })} on:reset={() => record('search-reset')}>
            <label slot="detail">絞り込み <input name="filter" value="available" /></label>
        </SearchBox>
    </section>
    <section id="page-fixture">
        <PageNavigation bind:currentPage totalPages={3}
            on:change={(event) => record('page-change', {
                currentPage: event.detail.currentPage, previousPage: event.detail.previousPage,
                direction: event.detail.direction,
            })} />
    </section>
    <section>
        <NotificationBanner id="notification" heading="保存しました" bind:open={bannerOpen}
            on:close={() => record('notification-close')} />
    </section>
    <section>
        <button id="modal-opener" type="button" on:click={() => modalOpen = true}>確認を開く</button>
        <button id="native-modal-opener" type="button" on:click={() => document.getElementById('modal').showModal()}>Nativeで開く</button>
        <ModalDialog id="modal" heading="確認" message="続行しますか" bind:open={modalOpen}
            on:open={() => record('modal-open')}
            on:close={(event) => record('modal-close', event.detail)}
            on:cancel={(event) => { record('modal-cancel'); if (cancelModal) event.preventDefault(); }} />
    </section>
</main>
`;

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

async function bundleHarness() {
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
          resolveId(id) {
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
              compiled.warnings,
              [],
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

test(
  "Svelte component interactions in Firefox WebDriver BiDi",
  { timeout: 180000 },
  async (t) => {
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
      const assets = await bundleHarness();
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

      await runCase(
        "HorizontalMenu: selectedId updates current markers; Escape closes submenu and restores focus",
        async () => {
          const overview = '[data-item-id="overview"] [data-js-top-level]';
          const contact = '[data-item-id="contact"] [data-js-top-level]';
          const services = '[data-item-id="services"] [data-js-top-level]';
          await page.expect(
            `document.querySelector('${overview}').getAttribute('aria-current')`,
            "page",
          );
          await page.setState({ selectedId: "contact" });
          await page.expect(
            `document.querySelector('${contact}').getAttribute('aria-current')`,
            "page",
          );
          await page.expect(
            `document.querySelector('${overview}').getAttribute('aria-current')`,
            null,
          );
          await page.click(overview);
          await page.expect("window.harness.snapshot().selectedId", "overview");
          await page.expect(
            `document.querySelector('${overview}').getAttribute('aria-current')`,
            "page",
          );
          await page.click(services);
          await page.key("\uE015"); // ArrowDown: native trusted key event.
          await page.expect(
            "document.activeElement.textContent.trim()",
            "税金",
          );
          await page.setState({ selectedId: "records" });
          await page.expect(
            `document.querySelector('${services}').getAttribute('aria-current')`,
            "true",
          );
          await page.expect(
            "[...document.querySelectorAll('[data-js-submenu-item]')].map(item => [item.getAttribute('aria-current'), item.hasAttribute('data-current')])",
            [
              [null, false],
              ["page", true],
            ],
          );
          await page.setState({ selectedId: "tax" });
          await page.expect(
            "[...document.querySelectorAll('[data-js-submenu-item]')].map(item => [item.getAttribute('aria-current'), item.hasAttribute('data-current')])",
            [
              ["page", true],
              [null, false],
            ],
          );
          await page.key("\uE00C"); // Escape.
          await page.expect("window.harness.snapshot().expandedId", null);
          await page.expect(
            "document.querySelector('.dads-horizontal-menu__submenu') === null",
            true,
          );
          await page.expect(
            `document.activeElement === document.querySelector('${services}')`,
            true,
          );
        },
      );

      await runCase(
        "Checkbox: checked and indeterminate bind in both directions",
        async () => {
          await page.expect(
            "[document.querySelector('#checkbox').checked, document.querySelector('#checkbox').indeterminate]",
            [false, true],
          );
          await page.setState({ checkboxChecked: true });
          await page.expect(
            "document.querySelector('#checkbox').checked",
            true,
          );
          await page.click("#checkbox");
          await page.expect(
            "[window.harness.snapshot().checkboxChecked, window.harness.snapshot().indeterminate]",
            [false, false],
          );
          await page.expect(
            "window.harness.snapshot().events.filter(event => event.type === 'checkbox-change')",
            [{ type: "checkbox-change", checked: false }],
          );
          await page.setState({
            checkboxChecked: true,
            indeterminate: true,
          });
          await page.expect(
            "[document.querySelector('#checkbox').checked, document.querySelector('#checkbox').indeterminate]",
            [true, true],
          );
        },
      );

      await runCase(
        "RadioButton: shared group, native initial reset, and canceled reset remain synchronized",
        async () => {
          const checked =
            "[document.querySelector('#radio-a').checked, document.querySelector('#radio-b').checked]";
          await page.expect(checked, [true, false]);
          await page.click("#radio-b");
          await page.expect("window.harness.snapshot().radioGroup", "b");
          await page.expect(checked, [false, true]);
          await page.click("#radio-reset");
          await page.expect("window.harness.snapshot().radioGroup", "a");
          await page.expect(checked, [true, false]);
          await page.setState({
            radioGroup: "b",
            cancelRadioReset: true,
          });
          await page.expect(checked, [false, true]);
          await page.click("#radio-reset");
          await page.expect("window.harness.snapshot().radioGroup", "b");
          await page.expect(checked, [false, true]);
          await page.expect(
            "window.harness.snapshot().events.filter(event => event.type === 'radio-reset').length",
            2,
          );
        },
      );

      await runCase(
        "Switch: on-off and mode binding, events, and disabled guards",
        async () => {
          await page.click("#switch");
          await page.expect("window.harness.snapshot().switchChecked", true);
          await page.setState({ switchChecked: false });
          await page.expect("document.querySelector('#switch').checked", false);
          await page.click("#mode-right");
          await page.expect("window.harness.snapshot().modeChecked", true);
          await page.expect(
            "[document.querySelector('#mode').getAttribute('aria-checked'), document.querySelector('#mode-right').getAttribute('aria-checked')]",
            ["false", "true"],
          );
          const events = (await page.snapshot()).events;
          assert.deepEqual(events, [
            { type: "switch-change" },
            { type: "mode-input" },
            { type: "mode-change" },
          ]);
          await page.setState({ switchDisabled: true });
          await page.expect(
            "['#switch', '#mode', '#mode-right'].every(selector => document.querySelector(selector).disabled)",
            true,
          );
          await page.click("#switch");
          await page.click("#mode");
          await page.expect(
            "[window.harness.snapshot().switchChecked, window.harness.snapshot().modeChecked]",
            [false, true],
          );
          assert.deepEqual(
            (await page.snapshot()).events,
            events,
            "Disabled switches do not emit change/input",
          );
        },
      );

      await runCase(
        "Textarea: value binding, character counter, and native custom validity recover",
        async () => {
          await page.expect(
            "document.querySelector('#textarea').checkValidity()",
            true,
          );
          await page.fill("#textarea", "123456");
          await page.expect(
            "window.harness.snapshot().textareaValue",
            "123456",
          );
          await page.expect(
            "document.querySelector('#textarea-fixture [data-count]').textContent",
            "6 / 5",
          );
          await page.expect(
            "document.querySelector('#textarea').validity.customError",
            true,
          );
          await page.expect(
            "document.querySelector('#textarea').checkValidity()",
            false,
          );
          await page.expect(
            "document.querySelector('#textarea').validationMessage",
            "1文字超過しています",
          );
          await page.setState({ textareaValue: "ok" });
          await page.expect("document.querySelector('#textarea').value", "ok");
          await page.expect(
            "document.querySelector('#textarea-fixture [data-count]').textContent",
            "2 / 5",
          );
          await page.expect(
            "document.querySelector('#textarea').validationMessage",
            "",
          );
          await page.expect(
            "document.querySelector('#textarea').checkValidity()",
            true,
          );
          await page.expect(
            "window.harness.snapshot().events.filter(event => event.type === 'textarea-input')",
            [{ type: "textarea-input", value: "123456" }],
          );
        },
      );

      await runCase(
        "SearchBox: native Enter submission emits bound values/FormData; reset updates bindings",
        async () => {
          const resetValue = await page.read(
            "document.querySelector('#search').defaultValue",
          );
          await page.fill("#search", "税金");
          await page.evaluate(
            "const select = document.querySelector('#search-fixture select'); select.value = 'docs'; select.dispatchEvent(new Event('change', { bubbles: true })); await window.settle();",
          );
          await page.focus("#search");
          await page.key("\uE007"); // Enter invokes Firefox's implicit form submission.
          await page.expect(
            "window.harness.snapshot().events.filter(event => event.type === 'search')",
            [
              {
                type: "search",
                value: "税金",
                scope: "docs",
                formData: [
                  ["scope", "docs"],
                  ["q", "税金"],
                  ["filter", "available"],
                ],
                nativeSubmit: true,
              },
            ],
          );
          await page.click('#search-fixture button[type="reset"]');
          await page.expect(
            "[window.harness.snapshot().searchValue, window.harness.snapshot().searchScope]",
            [resetValue, "all"],
          );
          await page.expect(
            "document.querySelector('#search').value",
            resetValue,
          );
          await page.expect(
            "window.harness.snapshot().events.filter(event => event.type === 'search-reset').length",
            1,
          );
        },
      );

      await runCase(
        "PageNavigation: currentPage binding, boundary controls, and change detail",
        async () => {
          await page.click('#page-fixture [data-control="next"]');
          await page.expect("window.harness.snapshot().currentPage", 3);
          await page.expect(
            "document.querySelector('#page-fixture [data-control=next]') === null",
            true,
          );
          await page.click('#page-fixture [data-control="prev"]');
          await page.expect("window.harness.snapshot().currentPage", 2);
          await page.setState({ currentPage: 1 });
          await page.expect(
            "document.querySelector('#page-fixture .dads-page-navigation__counter').textContent",
            "1 / 3",
          );
          await page.expect(
            "document.querySelector('#page-fixture [data-control=prev]') === null",
            true,
          );
          await page.expect(
            "window.harness.snapshot().events.filter(event => event.type === 'page-change')",
            [
              {
                type: "page-change",
                currentPage: 3,
                previousPage: 2,
                direction: "next",
              },
              {
                type: "page-change",
                currentPage: 2,
                previousPage: 3,
                direction: "prev",
              },
            ],
          );
        },
      );

      await runCase(
        "NotificationBanner: dismiss binds open and reopening restores the banner",
        async () => {
          await page.click("#notification .dads-notification-banner__close");
          await page.expect("window.harness.snapshot().bannerOpen", false);
          await page.expect(
            "document.querySelector('#notification') === null",
            true,
          );
          await page.expect(
            "window.harness.snapshot().events.filter(event => event.type === 'notification-close').length",
            1,
          );
          await page.setState({ bannerOpen: true });
          await page.expect(
            "document.querySelector('#notification')?.getAttribute('role')",
            "status",
          );
        },
      );

      await runCase(
        "ModalDialog: bound/native open and close, cancelable Escape, events, and focus restoration",
        async () => {
          const modalEvents =
            "window.harness.snapshot().events.filter(event => event.type.startsWith('modal-'))";
          const isOpen =
            "[window.harness.snapshot().modalOpen, document.querySelector('#modal').open, document.querySelector('#modal').matches(':modal')]";
          await page.click("#modal-opener");
          await page.expect(isOpen, [true, true, true]);
          await page.expect("document.activeElement.id", "modal-heading");
          await page.setState({ modalOpen: false });
          await page.expect(isOpen, [false, false, false]);
          await page.expect("document.activeElement.id", "modal-opener");
          await page.expect(modalEvents, [
            { type: "modal-open" },
            {
              type: "modal-close",
              reason: "binding",
              returnValue: "",
            },
          ]);
          await page.click("#modal-opener");
          await page.setState({ cancelModal: true });
          await page.key("\uE00C");
          await page.expect(isOpen, [true, true, true]);
          await page.expect(
            `${modalEvents}.filter(event => event.type === 'modal-cancel').length`,
            1,
          );
          await page.expect(
            `${modalEvents}.filter(event => event.type === 'modal-close').length`,
            1,
          );
          await page.setState({ cancelModal: false });
          await page.key("\uE00C");
          await page.expect(isOpen, [false, false, false]);
          await page.expect("document.activeElement.id", "modal-opener");
          await page.click("#native-modal-opener");
          await page.expect(isOpen, [true, true, true]);
          await page.expect("document.activeElement.id", "modal-heading");
          await page.evaluate(
            "document.querySelector('#modal').close('native-result'); await window.settle();",
          );
          await page.expect(isOpen, [false, false, false]);
          await page.expect("document.activeElement.id", "native-modal-opener");
          await page.expect(modalEvents, [
            { type: "modal-open" },
            {
              type: "modal-close",
              reason: "binding",
              returnValue: "",
            },
            { type: "modal-open" },
            { type: "modal-cancel" },
            { type: "modal-cancel" },
            {
              type: "modal-close",
              reason: "cancel",
              returnValue: "",
            },
            { type: "modal-open" },
            {
              type: "modal-close",
              reason: "native",
              returnValue: "native-result",
            },
          ]);
        },
      );
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
  },
);
