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

const componentNames = ["ResourceList"];
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
