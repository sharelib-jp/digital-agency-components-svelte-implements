import assert from "node:assert/strict";
import { browserTest } from "./browser-test-helpers.mjs";

const harnessSource = `<script>
    import Switch from '../src/lib/components/Switch.svelte';
    let switchChecked = false;
    let modeChecked = false;
    let switchDisabled = false;
    let events = [];
    function record(type, detail = {}) { events = [...events, { type, ...detail }]; }
    export function snapshot() { return { switchChecked, modeChecked, switchDisabled, events }; }
    export function setState(patch) {
        if (Object.hasOwn(patch, 'switchChecked')) switchChecked = patch.switchChecked;
        if (Object.hasOwn(patch, 'modeChecked')) modeChecked = patch.modeChecked;
        if (Object.hasOwn(patch, 'switchDisabled')) switchDisabled = patch.switchDisabled;
    }
</script>

<main>
<section>
        <Switch id="switch" label="通知" bind:checked={switchChecked} disabled={switchDisabled}
            on:change={() => record('switch-change')} />
        <Switch id="mode" type="mode" label="モード" bind:checked={modeChecked} disabled={switchDisabled}
            on:input={() => record('mode-input')} on:change={() => record('mode-change')} />
    </section>
</main>
`;

browserTest(
  "Switch browser behavior",
  harnessSource,
  async (t, page, runCase) => {
    await runCase(
      "Switch: on-off and mode binding, events, and disabled guards",
      async () => {
        await page.click("#switch");
        await page.expect("window.harness.snapshot().switchChecked", true);
        await page.setState({ switchChecked: false });
        await page.expect("document.querySelector('#switch').checked", false);
        await page.click("#mode-right");
        await page.expect("window.harness.snapshot().modeChecked", true);
        await page.expect(
          "[document.querySelector('#mode').getAttribute('aria-checked'), document.querySelector('#mode-right').getAttribute('aria-checked')]",
          ["false", "true"],
        );
        const events = (await page.snapshot()).events;
        assert.deepEqual(events, [
          { type: "switch-change" },
          { type: "mode-input" },
          { type: "mode-change" },
        ]);
        await page.setState({ switchDisabled: true });
        await page.expect(
          "['#switch', '#mode', '#mode-right'].every(selector => document.querySelector(selector).disabled)",
          true,
        );
        await page.click("#switch");
        await page.click("#mode");
        await page.expect(
          "[window.harness.snapshot().switchChecked, window.harness.snapshot().modeChecked]",
          [false, true],
        );
        assert.deepEqual(
          (await page.snapshot()).events,
          events,
          "Disabled switches do not emit change/input",
        );
      },
    );
  },
);
