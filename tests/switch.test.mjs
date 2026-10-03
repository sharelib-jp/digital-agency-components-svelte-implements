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

const componentNames = ["Switch"];
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
