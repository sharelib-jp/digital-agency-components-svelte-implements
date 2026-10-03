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

const componentNames = ["HorizontalMenu"];
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
