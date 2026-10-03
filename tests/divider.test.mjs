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

const componentNames = ["Divider"];
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
