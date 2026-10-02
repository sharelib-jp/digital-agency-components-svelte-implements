import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { compile } from "svelte/compiler";
import { render } from "svelte/server";

// These tests inspect compiler diagnostics and SSR HTML, not browser interactions,
// hydration, computed styles, focus, native validation, or DOM-only indeterminate state.
const frontendDirectory = fileURLToPath(new URL("../", import.meta.url));
const componentDirectory = path.join(frontendDirectory, "src/lib/components");
const componentNames = [
  "Image",
  "EmergencyBanner",
  "SearchBox",
  "Switch",
  "HorizontalMenu",
  "Checkbox",
  "NotificationBanner",
  "PageNavigation",
  "Heading",
  "RadioButton",
  "ResourceList",
  "Textarea",
  "Divider",
  "ModalDialog",
];
const fixtures = {
  Image: { src: "/test-image.png", alt: "庁舎の正面", caption: "図の説明" },
  EmergencyBanner: {
    heading: "緊急情報",
    message: "避難情報を確認してください",
  },
  SearchBox: { id: "search", label: "サイト内検索", value: "税金" },
  Switch: { id: "switch", name: "notifications", label: "通知", checked: true },
  HorizontalMenu: {
    selectedId: "overview",
    items: [{ id: "overview", label: "概要", href: "/overview" }],
  },
  Checkbox: {
    id: "checkbox",
    name: "consent",
    label: "同意する",
    checked: true,
  },
  NotificationBanner: {
    type: "success",
    heading: "完了",
    message: "保存しました",
  },
  PageNavigation: { currentPage: 5, totalPages: 9999 },
  Heading: { text: "見出し", shoulder: "章の説明" },
  RadioButton: {
    id: "radio",
    name: "category",
    label: "書籍",
    value: "book",
    group: "book",
  },
  ResourceList: {
    items: [{ id: "resource", title: "資料", supportText: "公開資料" }],
  },
  Textarea: {
    id: "textarea",
    name: "message",
    label: "メッセージ",
    value: "初期値",
  },
  Divider: {},
  ModalDialog: {
    id: "modal",
    heading: "確認",
    description: "操作を確認",
    message: "続行しますか",
  },
};
const representativeTags = {
  Image: ["img", { alt: "庁舎の正面" }],
  EmergencyBanner: ["article", { class: "dads-emergency-banner" }],
  SearchBox: ["input", { type: "search", value: "税金" }],
  Switch: ["input", { role: "switch", checked: "" }],
  HorizontalMenu: ["a", { href: "/overview", "aria-current": "page" }],
  Checkbox: ["input", { type: "checkbox", checked: "" }],
  NotificationBanner: ["div", { role: "status", "data-type": "success" }],
  PageNavigation: ["span", { class: "dads-page-navigation__counter" }],
  Heading: ["h2", { class: "dads-heading__heading" }],
  RadioButton: ["input", { type: "radio", checked: "" }],
  ResourceList: ["ul", { role: "list" }],
  Textarea: ["textarea", { id: "textarea", name: "message" }],
  Divider: ["hr", { "data-width": "1" }],
  ModalDialog: ["dialog", { "aria-labelledby": "modal-heading" }],
};

const compiled = new Map();
const components = new Map();
let temporaryDirectory;
let harnessNumber = 0;

function rewriteSvelteImports(code) {
  return code.replace(
    /(\bfrom\s+|\bimport\s*)(['"])(\.{1,2}\/[^'"]+\.svelte)\2/g,
    (_, prefix, quote, specifier) =>
      `${prefix}${JSON.stringify(specifier.replace(/\.svelte$/, ".mjs"))}`,
  );
}

before(async () => {
  const kitDirectory = path.join(frontendDirectory, ".svelte-kit");
  await mkdir(kitDirectory, { recursive: true });
  temporaryDirectory = await mkdtemp(
    path.join(kitDirectory, "components-test-"),
  );

  // FormControlLabel is an actual dependency of Switch and Textarea, not a stub.
  for (const name of [...componentNames, "FormControlLabel"]) {
    const filename = path.join(componentDirectory, `${name}.svelte`);
    const source = await readFile(filename, "utf8");
    for (const generate of ["client", "server"]) {
      const result = compile(source, { filename, generate });
      compiled.set(`${name}:${generate}`, result);
      if (generate === "server") {
        await writeFile(
          path.join(temporaryDirectory, `${name}.mjs`),
          rewriteSvelteImports(result.js.code),
        );
      }
    }
  }
  for (const name of componentNames) {
    const module = await import(
      pathToFileURL(path.join(temporaryDirectory, `${name}.mjs`)).href
    );
    components.set(name, module.default);
  }
});

after(async () => {
  if (temporaryDirectory)
    await rm(temporaryDirectory, { recursive: true, force: true });
});

function renderComponent(name, props = structuredClone(fixtures[name])) {
  return render(components.get(name), { props }).body;
}

async function compileHarness(source) {
  const name = `Harness${++harnessNumber}`;
  let server;
  for (const generate of ["client", "server"]) {
    const result = compile(source, {
      filename: path.join(componentDirectory, `${name}.svelte`),
      generate,
    });
    assert.deepEqual(
      result.warnings,
      [],
      `${name}: ${generate} harness warnings`,
    );
    if (generate === "server") server = result;
  }
  const filename = path.join(temporaryDirectory, `${name}.mjs`);
  await writeFile(filename, rewriteSvelteImports(server.js.code));
  return (await import(pathToFileURL(filename).href)).default;
}

function decodeEntities(value) {
  const named = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
  return value.replace(
    /&(?:#(\d+)|#x([\da-f]+)|(amp|lt|gt|quot|apos));/gi,
    (_, decimal, hexadecimal, name) =>
      decimal
        ? String.fromCodePoint(Number(decimal))
        : hexadecimal
          ? String.fromCodePoint(Number.parseInt(hexadecimal, 16))
          : named[name.toLowerCase()],
  );
}

// Small opening-tag queries avoid snapshots of generated Svelte hashes/comments
// and do not assume an attribute order or a particular boolean serialization.
function tags(html, name) {
  const pattern = new RegExp(`<${name}\\b(?:[^"'<>]|"[^"]*"|'[^']*')*>`, "g");
  return [...html.matchAll(pattern)].map((match) => {
    const attributeSource = match[0]
      .replace(/^<[^\s/>]+/, "")
      .replace(/\/?>$/, "");
    const attributes = Object.fromEntries(
      [
        ...attributeSource.matchAll(
          /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g,
        ),
      ].map((attribute) => [
        attribute[1],
        decodeEntities(attribute[2] ?? attribute[3] ?? attribute[4] ?? ""),
      ]),
    );
    return {
      attributes,
      start: match.index,
      end: match.index + match[0].length,
    };
  });
}

function matchingTags(html, name, expected = {}) {
  return tags(html, name).filter(({ attributes }) =>
    Object.entries(expected).every(([key, value]) =>
      key === "class"
        ? (attributes.class ?? "").split(/\s+/).includes(value)
        : Object.hasOwn(attributes, key) && attributes[key] === value,
    ),
  );
}

function getTag(html, name, expected = {}) {
  const matches = matchingTags(html, name, expected);
  assert.ok(
    matches.length,
    `Missing <${name}> with ${JSON.stringify(expected)}`,
  );
  return matches[0];
}

function element(html, name, expected = {}) {
  const opening = getTag(html, name, expected);
  const pattern = new RegExp(
    `<\\/?${name}\\b(?:[^"'<>]|"[^"]*"|'[^']*')*>`,
    "g",
  );
  pattern.lastIndex = opening.end;
  let depth = 1;
  for (let match; (match = pattern.exec(html));) {
    if (match[0].startsWith("</")) depth--;
    else if (!match[0].endsWith("/>")) depth++;
    if (depth === 0)
      return { ...opening, inner: html.slice(opening.end, match.index) };
  }
  assert.fail(`Missing closing </${name}>`);
}

function text(html) {
  return decodeEntities(
    html
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<(?:[^"'<>]|"[^"]*"|'[^']*')*>/g, ""),
  )
    .replace(/\s+/g, " ")
    .trim();
}

function assertAbsentAttribute(tag, attribute) {
  assert.equal(
    Object.hasOwn(tag.attributes, attribute),
    false,
    `Unexpected ${attribute}`,
  );
}

function assertInternalDescriptions(html, control, id) {
  assert.equal(
    control.attributes["aria-describedby"],
    `external-help ${id}-support-text ${id}-error-text`,
  );
  for (const suffix of ["support-text", "error-text"]) {
    assert.equal(
      tags(html, "p")
        .concat(tags(html, "span"))
        .filter(({ attributes }) => attributes.id === `${id}-${suffix}`).length,
      1,
    );
  }
}

for (const name of componentNames) {
  for (const generate of ["client", "server"]) {
    test(`${name}: ${generate} compiles without warnings`, () => {
      const result = compiled.get(`${name}:${generate}`);
      assert.deepEqual(
        result.warnings.map(({ code, message, start }) => ({
          code,
          message,
          start,
        })),
        [],
      );
      assert.ok(result.js.code.length > 0);
    });
  }
  test(`${name}: representative SSR renders its semantic element`, () => {
    const html = renderComponent(name);
    const [tagName, attributes] = representativeTags[name];
    getTag(html, tagName, attributes);
  });
  test(`${name}: repeated SSR is deterministic`, () => {
    const first = render(components.get(name), {
      props: structuredClone(fixtures[name]),
    });
    const second = render(components.get(name), {
      props: structuredClone(fixtures[name]),
    });
    assert.deepEqual(
      { body: first.body, head: first.head },
      { body: second.body, head: second.head },
    );
  });
}

test("SSR initialization does not require DOM globals or crypto.randomUUID", (t) => {
  assert.equal(typeof document, "undefined");
  assert.equal(typeof window, "undefined");
  if (globalThis.crypto?.randomUUID) {
    t.mock.method(globalThis.crypto, "randomUUID", () => {
      throw new Error("SSR must not generate random IDs");
    });
  }
  for (const name of componentNames)
    assert.doesNotThrow(() => renderComponent(name), name);
});

for (const type of ["border", "borderless", "link"]) {
  test(`Image: ${type} wrapper, alt and full-width variant`, () => {
    const html = renderComponent("Image", {
      src: "/test-image.png",
      alt: '庁舎 & "入口" <正面>',
      type,
      fullWidth: true,
      href: "/image",
      target: "_blank",
      rel: "author",
    });
    getTag(html, "figure", { "data-full-width": "" });
    getTag(html, "img", {
      src: "/test-image.png",
      alt: '庁舎 & "入口" <正面>',
      decoding: "auto",
    });
    const area = getTag(html, type === "link" ? "a" : "div", {
      class: "dads-image__image-area",
    });
    assert.equal(
      Object.hasOwn(area.attributes, "data-bordered"),
      type === "border",
    );
    if (type === "link") {
      assert.equal(area.attributes.href, "/image");
      assert.equal(area.attributes.target, "_blank");
      assert.equal(area.attributes.rel, "author noopener noreferrer");
    } else assertAbsentAttribute(area, "href");
  });
}

test("Image: decorative alt, responsive picture sources and image attributes", () => {
  const html = renderComponent("Image", {
    src: "/small.png",
    alt: "",
    srcset: "/small.png 1x, /large.png 2x",
    sizes: "100vw",
    width: 640,
    height: 480,
    loading: "lazy",
    decoding: "async",
    sources: [
      {
        srcset: "/wide.webp",
        media: "(min-width: 48rem)",
        type: "image/webp",
        sizes: "50vw",
        width: 1280,
        height: 720,
      },
    ],
  });
  getTag(html, "picture");
  getTag(html, "source", {
    srcset: "/wide.webp",
    media: "(min-width: 48rem)",
    type: "image/webp",
    sizes: "50vw",
    width: "1280",
    height: "720",
  });
  getTag(html, "img", {
    alt: "",
    srcset: "/small.png 1x, /large.png 2x",
    sizes: "100vw",
    width: "640",
    height: "480",
    loading: "lazy",
    decoding: "async",
  });
  assert.equal(tags(html, "figcaption").length, 0);
});

for (const captionStyle of ["dashed", "solid"]) {
  test(`Image: ${captionStyle} caption`, () => {
    const html = renderComponent("Image", { ...fixtures.Image, captionStyle });
    assert.equal(
      text(element(html, "figcaption", { "data-style": captionStyle }).inner),
      "図の説明",
    );
  });
}

test("EmergencyBanner: heading, body, timestamp and safe external action; no dismiss button", () => {
  const html = renderComponent("EmergencyBanner", {
    heading: "避難情報",
    message: "最新情報を確認",
    timestamp: "2026年10月3日 12:00",
    datetime: "2026-10-03T12:00:00+09:00",
    href: "/emergency",
    linkLabel: "詳細",
    target: "_blank",
  });
  assert.equal(text(element(html, "h2").inner), "避難情報");
  assert.equal(
    text(element(html, "div", { class: "dads-emergency-banner__body" }).inner),
    "最新情報を確認",
  );
  getTag(html, "time", { datetime: "2026-10-03T12:00:00+09:00" });
  getTag(html, "a", {
    href: "/emergency",
    target: "_blank",
    rel: "noopener noreferrer",
  });
  getTag(html, "svg", { role: "img", "aria-label": "新規タブで開きます" });
  assert.equal(tags(html, "button").length, 0);
});

test("EmergencyBanner: absent body, timestamp and actions are omitted", () => {
  const html = renderComponent("EmergencyBanner", {});
  assert.equal(tags(html, "time").length, 0);
  assert.equal(tags(html, "a").length, 0);
  assert.equal(
    matchingTags(html, "div", { class: "dads-emergency-banner__body" }).length,
    0,
  );
});

for (const size of ["lg", "md", "sm"]) {
  test(`SearchBox: ${size} form, implicit label and scope selection`, () => {
    const html = renderComponent("SearchBox", {
      size,
      name: "query",
      label: "検索語",
      formLabel: "資料検索",
      value: "地方税",
      action: "/search",
      method: "post",
      scopeName: "category",
      scopeLabel: "検索分類",
      scope: "files",
      scopeOptions: [
        { value: "", label: "すべて" },
        { value: "files", label: "資料" },
      ],
    });
    getTag(html, "form", {
      role: "search",
      "aria-label": "資料検索",
      action: "/search",
      method: "post",
      "data-size": size,
    });
    const inputLabel = element(html, "label", {
      class: "dads-search-box__input",
    });
    getTag(inputLabel.inner, "input", {
      type: "search",
      name: "query",
      value: "地方税",
    });
    assert.equal(
      text(
        element(inputLabel.inner, "span", { class: "dads-u-visually-hidden" })
          .inner,
      ),
      "検索語",
    );
    getTag(html, "select", { name: "category" });
    getTag(html, "option", { value: "files", selected: "" });
    getTag(html, "button", { type: "submit", "data-size": size });
  });
}

test("SearchBox: required, readonly, disabled and external heading label", () => {
  const html = renderComponent("SearchBox", {
    id: "query",
    required: true,
    readonly: true,
    disabled: true,
    ariaLabelledby: "search-heading",
    placeholder: "キーワード",
    scopeOptions: [{ value: "", label: "すべて" }],
  });
  getTag(html, "input", {
    id: "query",
    required: "",
    readonly: "",
    disabled: "",
    "aria-labelledby": "search-heading",
    placeholder: "キーワード",
  });
  getTag(html, "select", { disabled: "" });
  getTag(html, "button", { type: "submit", disabled: "" });
});

test("SearchBox: empty options omit the selector; invalid scope selects the first enabled option", () => {
  assert.equal(tags(renderComponent("SearchBox", {}), "select").length, 0);
  const html = renderComponent("SearchBox", {
    scope: "missing",
    scopeOptions: [
      { value: "off", label: "無効", disabled: true },
      { value: "files", label: "資料" },
    ],
  });
  getTag(html, "option", { value: "off", disabled: "" });
  assertAbsentAttribute(getTag(html, "option", { value: "off" }), "selected");
  getTag(html, "option", { value: "files", selected: "" });
  const unavailable = renderComponent("SearchBox", {
    scopeOptions: [{ value: "off", label: "無効", disabled: true }],
  });
  getTag(unavailable, "select", { disabled: "" });
});

test("SearchBox: bound initial value/scope and detailed-search slot render a native disclosure", async () => {
  const harness = await compileHarness(`
        <script>
            import SearchBox from './SearchBox.svelte';
            let value = '条例';
            let scope = 'files';
            let detailOpen = true;
        </script>
        <SearchBox bind:value bind:scope bind:detailOpen disabled
            scopeOptions={[{ value: 'files', label: '資料' }]}>
            <label slot="detail">分類<input name="filter" value="law" /></label>
        </SearchBox>
        <output>{value} / {scope} / {detailOpen}</output>
    `);
  const html = render(harness).body;
  getTag(html, "details", { open: "" });
  getTag(html, "fieldset", {
    class: "dads-search-box__detail-fields",
    disabled: "",
  });
  getTag(html, "input", { name: "filter", value: "law" });
  assert.equal(
    matchingTags(html, "button", { type: "submit", disabled: "" }).length,
    2,
  );
  getTag(html, "button", { type: "reset", disabled: "" });
  assert.equal(text(element(html, "output").inner), "条例 / files / true");
});

test("Switch: on-off checked state, label association, native constraints and descriptions", () => {
  const html = renderComponent("Switch", {
    id: "notifications",
    name: "notifications",
    value: "enabled",
    checked: true,
    label: "通知",
    required: true,
    disabled: true,
    supportText: "通知設定",
    errorText: "選択してください",
    "aria-describedby": "external-help",
  });
  getTag(html, "label", { for: "notifications" });
  const input = getTag(html, "input", {
    id: "notifications",
    type: "checkbox",
    role: "switch",
    name: "notifications",
    value: "enabled",
    checked: "",
    required: "",
    disabled: "",
    "aria-invalid": "true",
  });
  assertInternalDescriptions(html, input, "notifications");
  assert.match(text(html), /※必須/);
});

for (const checked of [false, true]) {
  test(`Switch: mode initial checked=${checked} has complementary accessible states`, () => {
    const html = renderComponent("Switch", {
      id: "mode",
      type: "mode",
      label: "表示モード",
      leftLabel: "一覧",
      rightLabel: "地図",
      checked,
      required: true,
      disabled: true,
      supportText: "表示形式",
      errorText: "選択してください",
      "aria-describedby": "external-help",
    });
    assert.match(text(element(html, "legend").inner), /表示モード/);
    const left = getTag(html, "button", {
      id: "mode",
      role: "switch",
      "aria-checked": String(!checked),
      "aria-required": "true",
      disabled: "",
      "aria-invalid": "true",
    });
    const right = getTag(html, "button", {
      id: "mode-right",
      role: "switch",
      "aria-checked": String(checked),
      "aria-required": "true",
      disabled: "",
      "aria-invalid": "true",
    });
    assertInternalDescriptions(html, left, "mode");
    assertInternalDescriptions(html, right, "mode");
    assert.equal(tags(html, "input").length, 0);
  });
}

for (const name of ["Checkbox", "RadioButton"]) {
  for (const size of ["sm", "md", "lg"]) {
    test(`${name}: ${size} label, required/disabled, checked and error descriptions`, () => {
      const id = `${name.toLowerCase()}-${size}`;
      const props = {
        id,
        name: "choices",
        value: "selected",
        label: "選択肢",
        size,
        required: true,
        disabled: true,
        supportText: "補足",
        errorText: "エラー",
        "aria-describedby": "external-help",
        ...(name === "Checkbox" ? { checked: true } : { group: "selected" }),
      };
      const html = renderComponent(name, props);
      getTag(html, "label", { for: id, "data-size": size });
      const input = getTag(html, "input", {
        id,
        name: "choices",
        value: "selected",
        checked: "",
        disabled: "",
        required: "",
        "aria-invalid": "true",
      });
      assertInternalDescriptions(html, input, id);
    });
  }
  test(`${name}: unchecked initial state omits constraints and internal error IDs`, () => {
    const html = renderComponent(name, {
      id: "unselected",
      name: "choices",
      value: "one",
      label: "選択肢",
    });
    const input = getTag(html, "input", { id: "unselected" });
    for (const attribute of [
      "checked",
      "disabled",
      "required",
      "aria-invalid",
      "aria-describedby",
    ])
      assertAbsentAttribute(input, attribute);
  });
  test(`${name}: errored prop and caller-supplied ARIA state are preserved`, () => {
    getTag(
      renderComponent(name, { id: "errored", name: "choices", errored: true }),
      "input",
      {
        "aria-invalid": "true",
      },
    );
    getTag(
      renderComponent(name, {
        id: "external",
        name: "choices",
        "aria-invalid": "true",
        "aria-describedby": "external-help",
        "aria-disabled": "true",
      }),
      "input",
      {
        "aria-invalid": "true",
        "aria-describedby": "external-help",
        "aria-disabled": "true",
      },
    );
  });
}

test("RadioButton: shared string bind:group selects only the matching SSR initial value", async () => {
  const harness = await compileHarness(`
        <script>
            import RadioButton from './RadioButton.svelte';
            let group = 'second';
        </script>
        <RadioButton id="first" name="shared" value="first" label="第一" bind:group />
        <RadioButton id="second" name="shared" value="second" label="第二" bind:group />
        <output>{group}</output>
    `);
  const html = render(harness).body;
  assertAbsentAttribute(
    getTag(html, "input", { id: "first", name: "shared" }),
    "checked",
  );
  getTag(html, "input", { id: "second", name: "shared", checked: "" });
  assert.equal(text(element(html, "output").inner), "second");
});

test("RadioButton: numeric bind:group does not conflate a number with its string value", async () => {
  const harness = await compileHarness(`
        <script>
            import RadioButton from './RadioButton.svelte';
            let group = 2;
        </script>
        <RadioButton id="number-one" name="numeric" value={1} label="一" bind:group />
        <RadioButton id="number-two" name="numeric" value={2} label="二" bind:group />
        <RadioButton id="string-two" name="numeric" value="2" label="文字列の二" bind:group />
    `);
  const html = render(harness).body;
  assertAbsentAttribute(getTag(html, "input", { id: "number-one" }), "checked");
  getTag(html, "input", { id: "number-two", checked: "" });
  assertAbsentAttribute(getTag(html, "input", { id: "string-two" }), "checked");
});

test("Checkbox and Switch: bind:checked initial state is reflected in SSR", async () => {
  const harness = await compileHarness(`
        <script>
            import Checkbox from './Checkbox.svelte';
            import Switch from './Switch.svelte';
            let consent = true;
            let notifications = false;
        </script>
        <Checkbox id="bound-consent" label="同意" bind:checked={consent} />
        <Switch id="bound-notifications" label="通知" bind:checked={notifications} />
        <output>{consent} / {notifications}</output>
    `);
  const html = render(harness).body;
  getTag(html, "input", { id: "bound-consent", checked: "" });
  assertAbsentAttribute(
    getTag(html, "input", { id: "bound-notifications" }),
    "checked",
  );
  assert.equal(text(element(html, "output").inner), "true / false");
});

test("HorizontalMenu: selectedId overrides current flags and marks the parent of a selected child", () => {
  const html = renderComponent("HorizontalMenu", {
    label: "主要項目",
    selectedId: "child",
    expandedId: "group",
    items: [
      { id: "old", label: "以前の項目", href: "/old", current: true },
      {
        id: "group",
        label: "分類",
        iconPath: "M0 0h24v24H0Z",
        children: [{ id: "child", label: "子項目", href: "/child" }],
      },
    ],
  });
  getTag(html, "nav", { "aria-label": "主要項目" });
  assertAbsentAttribute(getTag(html, "a", { href: "/old" }), "aria-current");
  getTag(html, "button", { "aria-current": "true", "aria-expanded": "true" });
  getTag(html, "a", {
    href: "/child",
    "aria-current": "page",
    "data-current": "",
  });
  getTag(html, "ul", {
    class: "dads-horizontal-menu__submenu",
    "aria-label": "分類",
  });
  getTag(html, "svg", {
    class: "dads-horizontal-menu__front-icon",
    "aria-hidden": "true",
  });
});

test("HorizontalMenu: current fallback, action buttons and disabled links", () => {
  const html = renderComponent("HorizontalMenu", {
    items: [
      { id: "current", label: "現在地", current: true },
      { id: "off", label: "無効", href: "/off", disabled: true },
    ],
  });
  getTag(html, "button", { type: "button", "aria-current": "page" });
  const disabled = getTag(html, "a", {
    "aria-disabled": "true",
    tabindex: "-1",
  });
  assertAbsentAttribute(disabled, "href");
  assert.equal(tags(renderComponent("HorizontalMenu", {}), "li").length, 0);
});

test("HorizontalMenu: unavailable or disabled expansion is closed during SSR", () => {
  const items = [
    {
      id: "group",
      label: "分類",
      children: [{ id: "child", label: "子項目" }],
    },
  ];
  for (const props of [
    { expandedId: "missing" },
    { expandedId: "group", disabled: true },
  ]) {
    const html = renderComponent("HorizontalMenu", { items, ...props });
    getTag(html, "button", { "aria-expanded": "false" });
    assert.equal(
      matchingTags(html, "ul", { class: "dads-horizontal-menu__submenu" })
        .length,
      0,
    );
  }
});

const notificationTypes = {
  success: ["status", "成功"],
  error: ["alert", "エラー"],
  warning: ["alert", "警告"],
  "info-1": ["status", "インフォメーション"],
  "info-2": ["status", "インフォメーション"],
};
for (const [type, [role, iconLabel]] of Object.entries(notificationTypes)) {
  for (const style of ["standard", "color-chip"]) {
    test(`NotificationBanner: ${type}/${style} role, icon and message`, () => {
      const html = renderComponent("NotificationBanner", {
        type,
        style,
        heading: "通知",
        message: "本文",
        dismissible: false,
      });
      getTag(html, "div", {
        class: "dads-notification-banner",
        "data-type": type,
        "data-style": style,
        role,
      });
      getTag(html, "svg", { role: "img", "aria-label": iconLabel });
      assert.match(text(html), /通知/);
      assert.match(text(html), /本文/);
      assert.equal(tags(html, "button").length, 0);
    });
  }
}

for (const closeButton of ["standard", "mobile-compact"]) {
  test(`NotificationBanner: ${closeButton} close control has an accessible name`, () => {
    const html = renderComponent("NotificationBanner", {
      closeButton,
      closeLabel: "通知を閉じる",
    });
    getTag(html, "button", { type: "button", "aria-label": "通知を閉じる" });
    assert.equal(tags(html, "button").length, 1);
  });
}

test("NotificationBanner: closed state is omitted and role/live/timestamp overrides are rendered", () => {
  assert.equal(
    matchingTags(
      renderComponent("NotificationBanner", { open: false }),
      "div",
      {
        class: "dads-notification-banner",
      },
    ).length,
    0,
  );
  const html = renderComponent("NotificationBanner", {
    type: "error",
    role: "status",
    ariaLive: "polite",
    timestamp: "更新時刻",
    datetime: "2026-10-03T12:00:00+09:00",
  });
  getTag(html, "div", {
    class: "dads-notification-banner",
    role: "status",
    "aria-live": "polite",
  });
  assert.equal(
    text(
      element(html, "time", { datetime: "2026-10-03T12:00:00+09:00" }).inner,
    ),
    "更新時刻",
  );
});

for (const type of ["text", "outline", "arrow"]) {
  test(`PageNavigation: ${type} controls and default size with localized counter`, () => {
    const html = renderComponent("PageNavigation", {
      type,
      currentPage: 5,
      totalPages: 9999,
      label: "検索結果",
    });
    getTag(html, "nav", { "aria-label": "検索結果" });
    for (const direction of ["prev", "next"])
      getTag(html, "button", {
        "data-control": direction,
        "data-size": type === "text" ? "md" : "lg",
      });
    assert.equal(
      text(
        element(html, "span", { class: "dads-page-navigation__counter" }).inner,
      ),
      "5 / 9,999",
    );
    if (type === "arrow")
      assert.equal(
        matchingTags(html, "span", { class: "dads-u-visually-hidden" }).length,
        2,
      );
    else getTag(html, "button", { "data-type": type });
  });
}

for (const size of ["lg", "md", "sm", "xs"]) {
  test(`PageNavigation: explicit ${size} size and disabled controls for each type`, () => {
    for (const type of ["text", "outline", "arrow"]) {
      const html = renderComponent("PageNavigation", {
        type,
        size,
        currentPage: 2,
        totalPages: 3,
        disabled: true,
      });
      assert.equal(
        matchingTags(html, "button", {
          "data-size": size,
          disabled: "",
          "aria-disabled": "true",
        }).length,
        2,
      );
    }
  });
}

test("PageNavigation: first/last pages omit unavailable controls and normalize range/decimals", () => {
  for (const [currentPage, totalPages, expected, omitted] of [
    [-5, 10, 1, "prev"],
    [0, 10, 1, "prev"],
    [99, 10, 10, "next"],
    [NaN, 10, 1, "prev"],
    [Infinity, 10, 1, "prev"],
    [2.9, 10.9, 2, null],
  ]) {
    const html = renderComponent("PageNavigation", { currentPage, totalPages });
    assert.equal(
      text(
        element(html, "span", { class: "dads-page-navigation__counter" }).inner,
      ),
      `${expected} / 10`,
    );
    if (omitted)
      assert.equal(
        matchingTags(html, "button", { "data-control": omitted }).length,
        0,
      );
  }
});

test("PageNavigation: zero, one, negative and non-finite page counts omit the navigation", () => {
  for (const totalPages of [0, 1, -1, 0.9, NaN, Infinity]) {
    assert.equal(
      tags(renderComponent("PageNavigation", { totalPages }), "nav").length,
      0,
    );
  }
});

test("PageNavigation: SSR initial binding, normalized display and zero-page default", async () => {
  const harness = await compileHarness(`
        <script>
            import PageNavigation from './PageNavigation.svelte';
            export let currentPage;
            export let totalPages = 10;
        </script>
        <PageNavigation bind:currentPage {totalPages} />
        <output>{currentPage}</output>
    `);
  const initial = render(harness, { props: { currentPage: 5 } }).body;
  assert.equal(
    text(
      element(initial, "span", { class: "dads-page-navigation__counter" })
        .inner,
    ),
    "5 / 10",
  );
  assert.equal(text(element(initial, "output").inner), "5");

  const clamped = render(harness, { props: { currentPage: 99 } }).body;
  assert.equal(
    text(
      element(clamped, "span", { class: "dads-page-navigation__counter" })
        .inner,
    ),
    "10 / 10",
  );
  // Legacy SSR only writes a child's bound value back to an undefined parent value.
  // This is not a test of reactive client-side binding updates.
  assert.equal(text(element(clamped, "output").inner), "99");

  const empty = render(harness, { props: { totalPages: 0 } }).body;
  assert.equal(tags(empty, "nav").length, 0);
  assert.equal(text(element(empty, "output").inner), "0");
});

test("PageNavigation: link destinations, custom labels and disabled links", () => {
  const props = {
    currentPage: 5,
    totalPages: 10,
    previousLabel: "戻る",
    nextLabel: "進む",
    hrefForPage: (page) => `/results?page=${page}`,
  };
  const html = renderComponent("PageNavigation", props);
  getTag(html, "a", { href: "/results?page=4", "data-control": "prev" });
  getTag(html, "a", { href: "/results?page=6", "data-control": "next" });
  assert.match(text(html), /戻る/);
  assert.match(text(html), /進む/);
  const disabled = renderComponent("PageNavigation", {
    ...props,
    disabled: true,
  });
  assert.equal(
    matchingTags(disabled, "a", { "aria-disabled": "true", tabindex: "-1" })
      .length,
    2,
  );
  for (const link of tags(disabled, "a")) assertAbsentAttribute(link, "href");
});

for (const level of ["h1", "h2", "h3", "h4", "h5", "h6"]) {
  test(`Heading: ${level} semantic level, ID and escaped text`, () => {
    const html = renderComponent("Heading", {
      level,
      id: "section-title",
      text: "<script>見出し & 本文</script>",
    });
    assert.equal(
      text(element(html, level, { id: "section-title" }).inner),
      "<script>見出し & 本文</script>",
    );
    assert.equal(tags(html, "script").length, 0);
  });
}

test("Heading: all sizes, rules, chip, shoulder and decorative icon variants", () => {
  for (const size of [
    "64",
    "57",
    "45",
    "36",
    "32",
    "28",
    "24",
    "20",
    "18",
    "16",
  ]) {
    getTag(renderComponent("Heading", { size, text: "見出し" }), "div", {
      "data-size": size,
    });
  }
  for (const rule of ["8", "6", "4", "2"]) {
    const html = renderComponent("Heading", {
      rule,
      chip: true,
      shoulder: "肩見出し",
      icon: true,
      text: "主見出し",
    });
    getTag(html, "hgroup", { "data-rule": rule, "data-chip": "" });
    assert.equal(
      text(element(html, "p", { class: "dads-heading__shoulder" }).inner),
      "肩見出し",
    );
    getTag(html, "span", {
      class: "dads-heading__icon",
      "aria-hidden": "true",
    });
  }
});

test("ResourceList: empty/plain items, headings, support text and secondary actions", () => {
  assert.equal(tags(renderComponent("ResourceList", {}), "li").length, 0);
  const html = renderComponent("ResourceList", {
    headingLevel: "h3",
    gap: 24,
    items: [
      {
        id: "plain",
        title: "資料",
        label: "公開",
        supportText: "PDF形式",
        subLabel: "更新済み",
        icon: true,
        action: { label: "資料を取得", icon: "download", disabled: true },
      },
    ],
  });
  assert.equal(
    text(element(html, "h3", { class: "dads-resource-list__title" }).inner),
    "資料",
  );
  for (const content of ["公開", "PDF形式", "更新済み"])
    assert.ok(text(html).includes(content));
  assert.match(
    getTag(html, "ul").attributes.style,
    /--resource-list-gap:\s*1\.5rem/,
  );
  getTag(html, "span", {
    class: "dads-resource-list__icon",
    "aria-hidden": "true",
  });
  getTag(html, "button", { "aria-label": "資料を取得", disabled: "" });
  assert.equal(tags(html, "input").length, 0);
  assert.equal(tags(html, "a").length, 0);
});

for (const style of ["list", "frame"]) {
  for (const interaction of ["inline", "whole"]) {
    test(`ResourceList: ${style}/${interaction} link uses one safe anchor without nested links`, () => {
      const html = renderComponent("ResourceList", {
        style,
        interaction,
        square: true,
        items: [
          {
            id: "link",
            type: "link",
            title: "公開資料",
            href: "/document",
            target: "_blank",
            rel: "author",
          },
        ],
      });
      getTag(html, "div", {
        class: "dads-resource-list",
        "data-style": style,
        "data-square": "",
      });
      getTag(html, "a", {
        href: "/document",
        target: "_blank",
        rel: "author noopener noreferrer",
      });
      assert.equal(tags(html, "a").length, 1);
      assert.equal(
        matchingTags(html, "a", { class: "dads-resource-list__body" }).length,
        interaction === "whole" ? 1 : 0,
      );
    });
  }
}

for (const type of ["checkbox", "radio"]) {
  test(`ResourceList: ${type} controls have associated titles and initial selection/constraints`, () => {
    const html = renderComponent("ResourceList", {
      style: "list",
      interaction: "whole",
      items: [
        {
          id: `${type}-selected`,
          type,
          title: "選択済み",
          name: "resources",
          value: "selected",
          checked: true,
          disabled: true,
          required: true,
          invalid: true,
          describedBy: "external-help",
          form: "resource-form",
          style: "frame",
          square: true,
          action: { label: "操作" },
        },
        {
          id: `${type}-unselected`,
          type,
          title: "未選択",
          name: "resources",
          interaction: "inline",
        },
      ],
    });
    const selected = getTag(html, "input", {
      id: `${type}-selected`,
      type,
      name: "resources",
      value: "selected",
      checked: "",
      disabled: "",
      required: "",
      form: "resource-form",
      "aria-describedby": "external-help",
    });
    assert.equal(
      selected.attributes[
        type === "checkbox" ? "aria-invalid" : "data-invalid"
      ],
      type === "checkbox" ? "true" : "",
    );
    assert.equal(
      matchingTags(html, "label", { for: `${type}-selected` }).length,
      2,
    );
    const titles = matchingTags(html, "p", {
      class: "dads-resource-list__title",
    });
    assert.equal(titles.length, 2);
    assertAbsentAttribute(
      getTag(html, "input", {
        id: `${type}-unselected`,
        value: `${type}-unselected`,
      }),
      "checked",
    );
    getTag(html, "div", {
      class: "dads-resource-list",
      "data-style": "frame",
      "data-interaction": "whole",
      "data-square": "",
    });
    getTag(html, "button", { "aria-label": "操作", disabled: "" });
  });
}

for (const size of ["sm", "md", "lg"]) {
  test(`Textarea: ${size} initial value, label and required/disabled/error descriptions`, () => {
    const id = `textarea-${size}`;
    const html = renderComponent("Textarea", {
      id,
      size,
      name: "message",
      value: "初期値 <本文>",
      label: "本文",
      rows: 4,
      cols: 30,
      required: true,
      disabled: true,
      supportText: "補足",
      errorText: "エラー",
      "aria-describedby": "external-help",
    });
    getTag(html, "div", {
      class: "dads-form-control-label",
      "data-size": size,
    });
    getTag(html, "label", { for: id });
    const control = getTag(html, "textarea", {
      id,
      name: "message",
      rows: "4",
      cols: "30",
      required: "",
      disabled: "",
      "aria-invalid": "true",
    });
    assertInternalDescriptions(html, control, id);
    assert.equal(
      text(element(html, "textarea", { id }).inner),
      "初期値 <本文>",
    );
    assert.match(text(html), /※必須/);
  });
}

test("Textarea: readonly status replaces requirement annotation and preserves support association", () => {
  const html = renderComponent("Textarea", {
    id: "readonly",
    label: "本文",
    value: "変更不可",
    readonly: true,
    readonlyText: "読み取り専用",
    supportText: "参照のみ",
  });
  getTag(html, "textarea", {
    readonly: "",
    "aria-describedby": "readonly-support-text",
  });
  getTag(html, "label", { for: "readonly" });
  assert.equal(
    text(
      element(html, "span", { class: "dads-form-control-label__status" }).inner,
    ),
    "読み取り専用",
  );
  assert.doesNotMatch(text(html), /※必須|※任意/);
});

test("Textarea: omitted label still renders support text; caller ARIA attributes are preserved", () => {
  const html = renderComponent("Textarea", {
    id: "external-textarea",
    supportText: "入力例",
    "aria-label": "自由記入",
    "aria-invalid": "true",
    "aria-describedby": "external-help",
  });
  assert.equal(tags(html, "label").length, 0);
  getTag(html, "p", { id: "external-textarea-support-text" });
  getTag(html, "textarea", {
    "aria-label": "自由記入",
    "aria-invalid": "true",
    "aria-describedby": "external-help external-textarea-support-text",
  });
});

for (const [value, counterMax, exceeded] of [
  ["", 0, false],
  ["abcd", 4, false],
  ["abcdef", 4, true],
]) {
  test(`Textarea: SSR counter ${value.length}/${counterMax}, exceeded=${exceeded}`, () => {
    const html = renderComponent("Textarea", {
      id: "counter",
      label: "本文",
      value,
      counterMax,
    });
    const counter = getTag(html, "span", { class: "dads-textarea__counter" });
    assert.equal(Object.hasOwn(counter.attributes, "data-exceeded"), exceeded);
    assert.equal(
      text(element(html, "span", { "data-count": "" }).inner),
      `${value.length} / ${counterMax}`,
    );
    for (const urgency of ["assertive", "polite"]) {
      const announcer = element(html, "span", {
        "aria-live": urgency,
        "data-announcer": urgency,
      });
      assert.equal(text(announcer.inner), "");
    }
  });
}

test("Textarea: counterMax=null omits the counter and SSR bind:value preserves initial text", async () => {
  assert.equal(
    matchingTags(renderComponent("Textarea"), "span", {
      class: "dads-textarea__counter",
    }).length,
    0,
  );
  const harness = await compileHarness(`
        <script>
            import Textarea from './Textarea.svelte';
            let value = '初期メッセージ';
        </script>
        <Textarea id="bound-textarea" label="本文" bind:value />
        <output>{value}</output>
    `);
  const html = render(harness).body;
  assert.equal(text(element(html, "textarea").inner), "初期メッセージ");
  assert.equal(text(element(html, "output").inner), "初期メッセージ");
});

for (const elementName of ["hr", "div"]) {
  test(`Divider: ${elementName} semantic/decorative variants and all data modifiers`, () => {
    for (const color of ["solid-gray-420", "solid-gray-536", "black"]) {
      for (const style of ["solid", "dashed"]) {
        for (const width of ["1", "2", "3", "4"]) {
          const divider = getTag(
            renderComponent("Divider", {
              element: elementName,
              color,
              style,
              width,
            }),
            elementName,
            { "data-color": color, "data-style": style, "data-width": width },
          );
          if (elementName === "div")
            assert.equal(divider.attributes["aria-hidden"], "true");
          else assertAbsentAttribute(divider, "aria-hidden");
        }
      }
    }
  });
}

test("ModalDialog: heading/description associations, width and SSR open deferred to mount", () => {
  const html = renderComponent("ModalDialog", {
    id: "confirm",
    open: true,
    heading: "確認",
    description: "実行前の確認",
    describedBy: "external-help",
    message: "続行しますか",
    width: "40rem",
  });
  const dialog = getTag(html, "dialog", {
    id: "confirm",
    "aria-labelledby": "confirm-heading",
    "aria-describedby": "confirm-description external-help",
    "data-scroll": "outer",
  });
  assert.match(dialog.attributes.style, /--modal-dialog-width:\s*40rem/);
  assertAbsentAttribute(dialog, "open");
  assert.equal(
    text(element(html, "h2", { id: "confirm-heading", tabindex: "-1" }).inner),
    "確認",
  );
  assert.equal(
    text(element(html, "p", { id: "confirm-description" }).inner),
    "実行前の確認",
  );
  assert.match(text(html), /続行しますか/);
});

for (const scroll of ["outer", "inner"]) {
  for (const fixedHeader of [false, true]) {
    for (const fixedActions of [false, true]) {
      test(`ModalDialog: ${scroll} scroll, fixedHeader=${fixedHeader}, fixedActions=${fixedActions} SSR structure`, () => {
        const html = renderComponent("ModalDialog", {
          id: "scroll-modal",
          scroll,
          fixedHeader,
          fixedActions,
        });
        getTag(html, "dialog", { "data-scroll": scroll });
        assert.equal(
          matchingTags(html, "h2", { id: "scroll-modal-heading" }).length,
          1,
        );
        assert.equal(
          matchingTags(html, "div", { class: "dads-modal-dialog__header" })
            .length,
          1,
        );
        assert.equal(
          matchingTags(html, "div", { class: "dads-modal-dialog__actions" })
            .length,
          1,
        );
        const hasScrollArea =
          scroll === "inner" && (fixedHeader || fixedActions);
        assert.equal(
          matchingTags(html, "div", { class: "dads-modal-dialog__scroll-area" })
            .length,
          hasScrollArea ? 1 : 0,
        );
        if (hasScrollArea) {
          const area = element(html, "div", {
            class: "dads-modal-dialog__scroll-area",
          });
          assert.equal(
            matchingTags(area.inner, "div", {
              class: "dads-modal-dialog__header",
            }).length,
            fixedHeader ? 0 : 1,
          );
          assert.equal(
            matchingTags(area.inner, "div", {
              class: "dads-modal-dialog__actions",
            }).length,
            fixedActions ? 0 : 1,
          );
          getTag(area.inner, "div", { class: "dads-modal-dialog__body" });
        }
      });
    }
  }
}

test("ModalDialog: optional description, close control and actions are omitted", () => {
  const html = renderComponent("ModalDialog", {
    id: "minimal-modal",
    hasCloseButton: false,
    hasActions: false,
  });
  assertAbsentAttribute(getTag(html, "dialog"), "aria-describedby");
  assert.equal(tags(html, "button").length, 0);
  assert.equal(
    matchingTags(html, "p", { class: "dads-modal-dialog__description" }).length,
    0,
  );
  assert.equal(
    matchingTags(html, "div", { class: "dads-modal-dialog__actions" }).length,
    0,
  );
});

test("Named slots: image caption and heading content replace fallbacks", async () => {
  const harness = await compileHarness(`
        <script>
            import Image from './Image.svelte';
            import Heading from './Heading.svelte';
        </script>
        <Image src="/test-image.png" alt="庁舎" caption="fallback-caption">
            <span slot="caption">スロットの説明</span>
        </Image>
        <Heading text="fallback-heading">
            <span slot="shoulder">スロットの肩見出し</span>
            <span slot="icon">装飾</span>
            主見出しのスロット
        </Heading>
    `);
  const html = render(harness).body;
  assert.equal(text(element(html, "figcaption").inner), "スロットの説明");
  getTag(html, "hgroup");
  assert.equal(
    text(element(html, "p", { class: "dads-heading__shoulder" }).inner),
    "スロットの肩見出し",
  );
  assert.match(text(element(html, "h2").inner), /主見出しのスロット/);
  assert.doesNotMatch(text(html), /fallback-caption|fallback-heading/);
});

test("Named slots: emergency/notification banners render custom content and action structure", async () => {
  const harness = await compileHarness(`
        <script>
            import EmergencyBanner from './EmergencyBanner.svelte';
            import NotificationBanner from './NotificationBanner.svelte';
        </script>
        <EmergencyBanner message="fallback-emergency">
            <span slot="heading">緊急スロット</span>
            <p>緊急本文</p>
            <a slot="actions" href="/emergency-slot">緊急詳細</a>
        </EmergencyBanner>
        <NotificationBanner dismissible={false} message="fallback-notification">
            <span slot="heading">通知スロット</span>
            <p>通知本文</p>
            <a slot="actions" href="/notification-slot">通知詳細</a>
        </NotificationBanner>
    `);
  const html = render(harness).body;
  for (const content of [
    "緊急スロット",
    "緊急本文",
    "通知スロット",
    "通知本文",
  ])
    assert.ok(text(html).includes(content));
  getTag(html, "a", { href: "/emergency-slot" });
  getTag(html, "a", { href: "/notification-slot" });
  assert.equal(tags(html, "button").length, 0);
  assert.doesNotMatch(text(html), /fallback-emergency|fallback-notification/);
});

test("Named slots: modal label, description, body and actions preserve ARIA references", async () => {
  const harness = await compileHarness(`
        <script>import ModalDialog from './ModalDialog.svelte';</script>
        <ModalDialog id="slot-modal" heading="fallback-heading" message="fallback-body" actionLabel="fallback-action">
            <span slot="heading">スロットのタイトル</span>
            <span slot="description">スロットの説明</span>
            <p>スロットの本文</p>
            <button slot="actions" type="button">スロットの操作</button>
        </ModalDialog>
    `);
  const html = render(harness).body;
  getTag(html, "dialog", {
    "aria-labelledby": "slot-modal-heading",
    "aria-describedby": "slot-modal-description",
  });
  assert.equal(
    text(element(html, "h2", { id: "slot-modal-heading" }).inner),
    "スロットのタイトル",
  );
  assert.equal(
    text(element(html, "p", { id: "slot-modal-description" }).inner),
    "スロットの説明",
  );
  assert.equal(
    text(element(html, "div", { class: "dads-modal-dialog__body" }).inner),
    "スロットの説明 スロットの本文",
  );
  assert.equal(
    text(element(html, "div", { class: "dads-modal-dialog__actions" }).inner),
    "スロットの操作",
  );
  assert.doesNotMatch(
    text(html),
    /fallback-heading|fallback-body|fallback-action/,
  );
});
