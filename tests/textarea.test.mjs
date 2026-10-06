import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { render } from "svelte/server";
import { createComponentTestHarness } from "./component-test-helpers.mjs";
import { fixtures, representativeTags } from "./component-fixtures.mjs";
import {
  tags,
  matchingTags,
  getTag,
  element,
  text,
  assertAbsentAttribute,
  assertInternalDescriptions,
} from "./ssr-assertions.mjs";

const componentNames = ["Textarea"];
let harness, compiled, components;
before(async () => {
  harness = await createComponentTestHarness(componentNames);
  compiled = harness.compiled;
  components = harness.components;
});
after(async () => {
  await harness?.cleanup();
});
const renderComponent = (name, props = structuredClone(fixtures[name])) =>
  harness.render(name, props);
const compileHarness = (source) => harness.compileSource(source);

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

for (const fullWidth of [undefined, false, true]) {
  test(`Textarea: fullWidth=${fullWidth ?? "default"} sets the root and textarea modifier without forwarding the prop`, () => {
    const html = renderComponent("Textarea", {
      id: "width-textarea",
      ...(fullWidth === undefined ? {} : { fullWidth }),
    });
    getTag(html, "div", {
      class: "dads-form-control-label",
      "data-full-width": String(fullWidth ?? false),
    });
    const textarea = getTag(html, "textarea", {
      id: "width-textarea",
      "data-full-width": String(fullWidth ?? false),
    });
    assertAbsentAttribute(textarea, "fullWidth");
    assertAbsentAttribute(textarea, "fullwidth");
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
            import Textarea from '../src/lib/components/Textarea.svelte';
            let value = '初期メッセージ';
        </script>
        <Textarea id="bound-textarea" label="本文" bind:value />
        <output>{value}</output>
    `);
  const html = render(harness).body;
  assert.equal(text(element(html, "textarea").inner), "初期メッセージ");
  assert.equal(text(element(html, "output").inner), "初期メッセージ");
});
