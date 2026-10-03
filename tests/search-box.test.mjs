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

const componentNames = ["SearchBox"];
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
            import SearchBox from '../src/lib/components/SearchBox.svelte';
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
