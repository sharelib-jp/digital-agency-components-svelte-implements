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

const componentNames = ["Heading"];
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
