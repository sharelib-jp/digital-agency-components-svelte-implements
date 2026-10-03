import assert from "node:assert/strict";
import { browserTest } from "./browser-test-helpers.mjs";

const harnessSource = `<script>
    import RadioButton from '../src/lib/components/RadioButton.svelte';
    let radioGroup = "a";
    let cancelRadioReset = false;
    let events = [];
    function record(type, detail = {}) { events = [...events, { type, ...detail }]; }
    export function snapshot() { return { radioGroup, cancelRadioReset, events }; }
    export function setState(patch) {
        if (Object.hasOwn(patch, 'radioGroup')) radioGroup = patch.radioGroup;
        if (Object.hasOwn(patch, 'cancelRadioReset')) cancelRadioReset = patch.cancelRadioReset;
    }
</script>

<main>
<section>
        <form id="radio-form" on:reset={(event) => {
            record('radio-reset');
            if (cancelRadioReset) event.preventDefault();
        }}>
            <RadioButton id="radio-a" name="category" value="a" label="A" bind:group={radioGroup}
                on:change={() => record('radio-change', { value: 'a' })} />
            <RadioButton id="radio-b" name="category" value="b" label="B" bind:group={radioGroup}
                on:change={() => record('radio-change', { value: 'b' })} />
            <button id="radio-reset" type="reset">選択を戻す</button>
        </form>
    </section>
</main>
`;

browserTest(
  "RadioButton browser behavior",
  harnessSource,
  async (t, page, runCase) => {
    await runCase(
      "RadioButton: shared group, native initial reset, and canceled reset remain synchronized",
      async () => {
        const checked =
          "[document.querySelector('#radio-a').checked, document.querySelector('#radio-b').checked]";
        await page.expect(checked, [true, false]);
        await page.click("#radio-b");
        await page.expect("window.harness.snapshot().radioGroup", "b");
        await page.expect(checked, [false, true]);
        await page.click("#radio-reset");
        await page.expect("window.harness.snapshot().radioGroup", "a");
        await page.expect(checked, [true, false]);
        await page.setState({
          radioGroup: "b",
          cancelRadioReset: true,
        });
        await page.expect(checked, [false, true]);
        await page.click("#radio-reset");
        await page.expect("window.harness.snapshot().radioGroup", "b");
        await page.expect(checked, [false, true]);
        await page.expect(
          "window.harness.snapshot().events.filter(event => event.type === 'radio-reset').length",
          2,
        );
      },
    );
  },
);
