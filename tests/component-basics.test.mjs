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

const componentNames = Object.keys(fixtures);
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

for (const name of componentNames) {
  for (const generate of ["client", "server"]) {
    test(`${name}: ${generate} compiles without warnings`, () => {
      const result = compiled.get(`${name}:${generate}`);
      assert.deepEqual(
        result.warnings.map(({ code, message, start }) => ({
          code,
          message,
          start,
        })),
        [],
      );
      assert.ok(result.js.code.length > 0);
    });
  }
  test(`${name}: representative SSR renders its semantic element`, () => {
    const html = renderComponent(name);
    const [tagName, attributes] = representativeTags[name];
    getTag(html, tagName, attributes);
  });
  test(`${name}: repeated SSR is deterministic`, () => {
    const first = render(components.get(name), {
      props: structuredClone(fixtures[name]),
    });
    const second = render(components.get(name), {
      props: structuredClone(fixtures[name]),
    });
    assert.deepEqual(
      { body: first.body, head: first.head },
      { body: second.body, head: second.head },
    );
  });
}

test("SSR initialization does not require DOM globals or crypto.randomUUID", (t) => {
  assert.equal(typeof document, "undefined");
  assert.equal(typeof window, "undefined");
  if (globalThis.crypto?.randomUUID) {
    t.mock.method(globalThis.crypto, "randomUUID", () => {
      throw new Error("SSR must not generate random IDs");
    });
  }
  for (const name of componentNames)
    assert.doesNotThrow(() => renderComponent(name), name);
});
