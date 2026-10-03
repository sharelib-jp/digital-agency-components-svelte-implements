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

const componentNames = ["PageNavigation"];
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
            import PageNavigation from '../src/lib/components/PageNavigation.svelte';
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
