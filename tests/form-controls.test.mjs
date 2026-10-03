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

const componentNames = ["Checkbox", "RadioButton", "Switch"];
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

for (const name of ["Checkbox", "RadioButton"]) {
  for (const size of ["sm", "md", "lg"]) {
    test(`${name}: ${size} label, required/disabled, checked and error descriptions`, () => {
      const id = `${name.toLowerCase()}-${size}`;
      const props = {
        id,
        name: "choices",
        value: "selected",
        label: "選択肢",
        size,
        required: true,
        disabled: true,
        supportText: "補足",
        errorText: "エラー",
        "aria-describedby": "external-help",
        ...(name === "Checkbox" ? { checked: true } : { group: "selected" }),
      };
      const html = renderComponent(name, props);
      getTag(html, "label", { for: id, "data-size": size });
      const input = getTag(html, "input", {
        id,
        name: "choices",
        value: "selected",
        checked: "",
        disabled: "",
        required: "",
        "aria-invalid": "true",
      });
      assertInternalDescriptions(html, input, id);
    });
  }
  test(`${name}: unchecked initial state omits constraints and internal error IDs`, () => {
    const html = renderComponent(name, {
      id: "unselected",
      name: "choices",
      value: "one",
      label: "選択肢",
    });
    const input = getTag(html, "input", { id: "unselected" });
    for (const attribute of [
      "checked",
      "disabled",
      "required",
      "aria-invalid",
      "aria-describedby",
    ])
      assertAbsentAttribute(input, attribute);
  });
  test(`${name}: errored prop and caller-supplied ARIA state are preserved`, () => {
    getTag(
      renderComponent(name, { id: "errored", name: "choices", errored: true }),
      "input",
      {
        "aria-invalid": "true",
      },
    );
    getTag(
      renderComponent(name, {
        id: "external",
        name: "choices",
        "aria-invalid": "true",
        "aria-describedby": "external-help",
        "aria-disabled": "true",
      }),
      "input",
      {
        "aria-invalid": "true",
        "aria-describedby": "external-help",
        "aria-disabled": "true",
      },
    );
  });
}

test("RadioButton: shared string bind:group selects only the matching SSR initial value", async () => {
  const harness = await compileHarness(`
        <script>
            import RadioButton from '../src/lib/components/RadioButton.svelte';
            let group = 'second';
        </script>
        <RadioButton id="first" name="shared" value="first" label="第一" bind:group />
        <RadioButton id="second" name="shared" value="second" label="第二" bind:group />
        <output>{group}</output>
    `);
  const html = render(harness).body;
  assertAbsentAttribute(
    getTag(html, "input", { id: "first", name: "shared" }),
    "checked",
  );
  getTag(html, "input", { id: "second", name: "shared", checked: "" });
  assert.equal(text(element(html, "output").inner), "second");
});

test("RadioButton: numeric bind:group does not conflate a number with its string value", async () => {
  const harness = await compileHarness(`
        <script>
            import RadioButton from '../src/lib/components/RadioButton.svelte';
            let group = 2;
        </script>
        <RadioButton id="number-one" name="numeric" value={1} label="一" bind:group />
        <RadioButton id="number-two" name="numeric" value={2} label="二" bind:group />
        <RadioButton id="string-two" name="numeric" value="2" label="文字列の二" bind:group />
    `);
  const html = render(harness).body;
  assertAbsentAttribute(getTag(html, "input", { id: "number-one" }), "checked");
  getTag(html, "input", { id: "number-two", checked: "" });
  assertAbsentAttribute(getTag(html, "input", { id: "string-two" }), "checked");
});

test("Checkbox and Switch: bind:checked initial state is reflected in SSR", async () => {
  const harness = await compileHarness(`
        <script>
            import Checkbox from '../src/lib/components/Checkbox.svelte';
            import Switch from '../src/lib/components/Switch.svelte';
            let consent = true;
            let notifications = false;
        </script>
        <Checkbox id="bound-consent" label="同意" bind:checked={consent} />
        <Switch id="bound-notifications" label="通知" bind:checked={notifications} />
        <output>{consent} / {notifications}</output>
    `);
  const html = render(harness).body;
  getTag(html, "input", { id: "bound-consent", checked: "" });
  assertAbsentAttribute(
    getTag(html, "input", { id: "bound-notifications" }),
    "checked",
  );
  assert.equal(text(element(html, "output").inner), "true / false");
});
