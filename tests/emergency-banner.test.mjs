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

const componentNames = ["EmergencyBanner"];
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
