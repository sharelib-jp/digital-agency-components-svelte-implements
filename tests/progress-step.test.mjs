import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createComponentTestHarness } from "./component-test-helpers.mjs";

let harness;
before(async () => {
  harness = await createComponentTestHarness();
});
after(async () => {
  await harness?.cleanup();
});

function tags(html, name) {
  return [
    ...html.matchAll(
      new RegExp(`<${name}\\b(?:[^"'<>]|"[^"]*"|'[^']*')*>`, "g"),
    ),
  ].map(([tag]) =>
    Object.fromEntries(
      [
        ...tag
          .replace(/^<[^\s/>]+/, "")
          .matchAll(
            /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g,
          ),
      ].map(([, key, double, single, bare]) => [
        key,
        double ?? single ?? bare ?? "",
      ]),
    ),
  );
}
function progress(props = {}) {
  const html = harness.render("ProgressIndicator", props);
  return {
    html,
    root: tags(html, "div").find((tag) => tag.role === "progressbar"),
  };
}
const steps = [
  {
    id: "one",
    label: "入力",
    description: "氏名を入力",
    status: "completed",
    href: "#one",
  },
  {
    id: "two",
    label: "確認",
    description: "内容を確認",
    status: "editing",
    action: true,
  },
  { id: "three", label: "送信", status: "error", action: true, disabled: true },
  { id: "four", label: "省略", status: "skipped" },
];

for (const name of ["ProgressIndicator", "StepNavigation"]) {
  for (const generate of ["client", "server"]) {
    test(`${name}: ${generate} compiles without warnings`, () => {
      assert.deepEqual(harness.warnings(name, generate), []);
    });
  }
}

test("ProgressIndicator: null/undefined/non-finite values remain indeterminate and SSR-safe", () => {
  for (const value of [null, undefined, NaN, Infinity, -Infinity]) {
    const { html, root } = progress({ value, intent: "explicit" });
    assert.equal(root["aria-label"], "読み込み中");
    assert.equal(root["aria-valuemin"], "0");
    assert.equal(root["aria-valuemax"], "100");
    assert.equal(root["aria-valuenow"], undefined);
    assert.equal(root.style?.includes("--value:") ?? false, false);
    assert.equal(tags(html, "svg")[0]["data-indeterminate"], "");
    assert.match(html, /role="status"/);
    assert.doesNotMatch(html, /読み込みを開始しました/);
  }
});

test("ProgressIndicator: bounds clamp ARIA values and normalize fill/percentage without mutating props", () => {
  for (const [value, now, percentage] of [
    [-30, 20, 0],
    [60, 60, 50],
    [130, 100, 100],
  ]) {
    const { html, root } = progress({
      min: 20,
      max: 100,
      value,
      shape: "linear",
      label: "送信中",
      valueText: "5件中3件",
    });
    assert.equal(root["aria-valuenow"], String(now));
    assert.equal(root["aria-valuemin"], "20");
    assert.equal(root["aria-valuemax"], "100");
    assert.equal(root["aria-valuetext"], "5件中3件");
    assert.match(root.style, new RegExp(`--value:\\s*${percentage}(?:;|$)`));
    assert.match(html, new RegExp(`<span[^>]*>${percentage}</span>`));
    assert.equal(tags(html, "svg")[0]["data-indeterminate"], undefined);
  }
  assert.equal(progress({ value: 0 }).root["aria-valuenow"], "0");
  for (const [min, max] of [
    [10, 10],
    [10, 0],
    [NaN, 100],
    [0, Infinity],
    [-1e308, 1e308],
  ]) {
    const { root } = progress({ min, max, value: 50 });
    assert.equal(root["aria-valuemin"], "0");
    assert.equal(root["aria-valuemax"], "100");
    assert.equal(root["aria-valuenow"], "50");
  }
});

test("ProgressIndicator: all source layouts, sizes and shapes; static equivalents and optional labels", () => {
  for (const type of ["stacked", "inlined", "stacked-underlay"]) {
    for (const shape of ["circular", "linear", "static"]) {
      const { html, root } = progress({ type, shape });
      const svg = tags(html, "svg")[0];
      assert.equal(root["data-type"], type);
      assert.equal(
        svg.width,
        String(
          shape === "linear"
            ? type === "inlined"
              ? 80
              : 240
            : type === "inlined"
              ? 24
              : 48,
        ),
      );
      assert.equal(svg["aria-hidden"], "true");
    }
  }
  const { html, root } = progress({
    shape: "static",
    size: "sm",
    active: false,
    label: "",
    ariaLabel: "資料を取得中",
    value: 30,
    showPercentage: false,
    Class: "custom",
    id: "loading",
  });
  assert.equal(root["data-active"], undefined);
  assert.equal(root.id, "loading");
  assert.match(root.class, /\bcustom\b/);
  assert.equal(root["aria-label"], "資料を取得中");
  assert.doesNotMatch(html, /class="dads-progress-indicator__label/);
  assert.equal(tags(html, "svg")[0].viewBox, "0 0 24 24");
  assert.equal(progress({ label: "  " }).root["aria-label"], "読み込み中");
});

test("StepNavigation: ordered nav, current step, all source states, labels and descriptions", () => {
  const html = harness.render("StepNavigation", {
    steps,
    currentId: "two",
    label: "申請の手順",
  });
  assert.equal(tags(html, "nav")[0]["aria-label"], "申請の手順");
  assert.equal(tags(html, "ol")[0].role, "list");
  const items = tags(html, "li");
  assert.deepEqual(
    items.map((item) => item["data-state"]),
    ["completed", "editing", "error", "skipped"],
  );
  assert.deepEqual(
    items
      .filter((item) => item["aria-current"])
      .map((item) => item["data-step-id"]),
    ["two"],
  );
  assert.equal(items[1]["aria-current"], "step");
  assert.equal(items[0]["data-first"], "");
  assert.equal(items[3]["data-last"], "");
  assert.equal(tags(html, "a")[0].href, "#one");
  assert.deepEqual(
    tags(html, "button").map((item) => item.type),
    ["button", "button"],
  );
  assert.equal(tags(html, "button")[1].disabled, "");
  assert.match(html, /氏名を入力/);
  for (const label of ["完了", "編集中", "エラー", "スキップされました"])
    assert.ok(html.includes(label));
  const reached = harness.render("StepNavigation", {
    steps: [
      { id: "a", current: true },
      { id: "b", status: "default" },
      { id: "c", status: "reached" },
    ],
  });
  assert.deepEqual(
    tags(reached, "li").map((item) => item["data-state"]),
    ["reached", undefined, "reached"],
  );
});

test("StepNavigation: single retains source position and number; compact/vertical/number-only variants", () => {
  const html = harness.render("StepNavigation", {
    steps,
    currentId: "two",
    variant: "single",
    orientation: "vertical",
    size: "small",
    numberOnly: true,
    stepWidth: 200,
    stepMinWidth: 120,
    summary: "確認してください",
  });
  assert.equal(tags(html, "li").length, 1);
  assert.equal(tags(html, "li")[0]["data-step-id"], "two");
  assert.equal(tags(html, "li")[0]["data-first"], undefined);
  assert.equal(tags(html, "li")[0]["data-last"], undefined);
  assert.equal(tags(html, "nav")[0]["data-orientation"], "vertical");
  assert.equal(tags(html, "nav")[0]["data-size"], "small");
  assert.match(tags(html, "nav")[0].style, /--_step-width:\s*200/);
  assert.match(html, /確認してください/);
  assert.doesNotMatch(html, /dads-step-navigation__(?:title|description)/);
  const single = harness.render("StepNavigation", {
    steps: [
      {
        id: "one",
        number: 8,
        first: true,
        last: true,
        status: "error",
        statusLabel: "要修正",
      },
    ],
    variant: "single",
  });
  assert.equal(tags(single, "li")[0]["data-first"], "");
  assert.equal(tags(single, "li")[0]["data-last"], "");
  assert.match(single, /要修正/);
  assert.match(single, />\s*8\s*</);
});

test("StepNavigation: disabled controls, empty steps and invalid current IDs do not invent selections", () => {
  const html = harness.render("StepNavigation", {
    steps,
    disabled: true,
    currentId: "missing",
  });
  assert.equal(tags(html, "a")[0].href, undefined);
  assert.equal(tags(html, "a")[0]["aria-disabled"], "true");
  assert.equal(tags(html, "a")[0].tabindex, "-1");
  assert.ok(tags(html, "button").every((item) => item.disabled === ""));
  assert.ok(
    tags(html, "li").every((item) => item["aria-current"] === undefined),
  );
  assert.equal(tags(harness.render("StepNavigation", {}), "li").length, 0);
  const fallback = harness.render("StepNavigation", {
    steps,
    currentId: "missing",
    variant: "single",
  });
  assert.equal(tags(fallback, "li")[0]["data-step-id"], "one");
});
