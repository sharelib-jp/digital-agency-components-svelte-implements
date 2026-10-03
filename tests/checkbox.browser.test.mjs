import assert from "node:assert/strict";
import { browserTest } from "./browser-test-helpers.mjs";

const harnessSource = `<script>
    import Checkbox from '../src/lib/components/Checkbox.svelte';
    let checkboxChecked = false;
    let indeterminate = true;
    let events = [];
    function record(type, detail = {}) { events = [...events, { type, ...detail }]; }
    export function snapshot() { return { checkboxChecked, indeterminate, events }; }
    export function setState(patch) {
        if (Object.hasOwn(patch, 'checkboxChecked')) checkboxChecked = patch.checkboxChecked;
        if (Object.hasOwn(patch, 'indeterminate')) indeterminate = patch.indeterminate;
    }
</script>

<main>
<section>
        <Checkbox id="checkbox" label="同意" bind:checked={checkboxChecked} bind:indeterminate
            on:change={(event) => record('checkbox-change', { checked: event.target.checked })} />
    </section>
</main>
`;

browserTest(
  "Checkbox browser behavior",
  harnessSource,
  async (t, page, runCase) => {
    await runCase(
      "Checkbox: checked and indeterminate bind in both directions",
      async () => {
        await page.expect(
          "[document.querySelector('#checkbox').checked, document.querySelector('#checkbox').indeterminate]",
          [false, true],
        );
        await page.setState({ checkboxChecked: true });
        await page.expect("document.querySelector('#checkbox').checked", true);
        await page.click("#checkbox");
        await page.expect(
          "[window.harness.snapshot().checkboxChecked, window.harness.snapshot().indeterminate]",
          [false, false],
        );
        await page.expect(
          "window.harness.snapshot().events.filter(event => event.type === 'checkbox-change')",
          [{ type: "checkbox-change", checked: false }],
        );
        await page.setState({
          checkboxChecked: true,
          indeterminate: true,
        });
        await page.expect(
          "[document.querySelector('#checkbox').checked, document.querySelector('#checkbox').indeterminate]",
          [true, true],
        );
      },
    );
  },
);
