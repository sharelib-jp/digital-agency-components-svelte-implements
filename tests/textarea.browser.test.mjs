import assert from "node:assert/strict";
import { browserTest } from "./browser-test-helpers.mjs";

const harnessSource = `<script>
    import Textarea from '../src/lib/components/Textarea.svelte';
    import '../src/lib/global.css';
    let fullWidth = false;
    let textareaValue = "ab";
    let events = [];
    function record(type, detail = {}) { events = [...events, { type, ...detail }]; }
    export function snapshot() { return { textareaValue, events }; }
    export function setState(patch) {
        if (Object.hasOwn(patch, 'textareaValue')) textareaValue = patch.textareaValue;
                if (Object.hasOwn(patch, 'fullWidth')) fullWidth = patch.fullWidth;
    }
</script>

<main>
<section id="textarea-fixture" style="width: 600px; max-width: 100%;">
        <Textarea id="textarea" label="メッセージ" counterMax={5} {fullWidth} bind:value={textareaValue}
            on:input={(event) => record('textarea-input', { value: event.target.value })} />
    </section>
</main>
`;

browserTest(
  "Textarea browser behavior",
  harnessSource,
  async (t, page, runCase) => {
    await runCase(
      "Textarea: fullWidth fills its parent, follows resizing and restores intrinsic width",
      async () => {
        const initialWidth = await page.read(
          "document.querySelector('#textarea').getBoundingClientRect().width",
        );
        assert.ok(
          initialWidth < 600,
          "Default textarea should keep its intrinsic width",
        );
        await page.setState({ fullWidth: true });
        await page.expect(
          "document.querySelector('#textarea').getBoundingClientRect().width",
          600,
        );
        await page.expect(
          "document.querySelector('#textarea-fixture .dads-form-control-label').getBoundingClientRect().width",
          600,
        );
        await page.evaluate(
          "document.querySelector('#textarea-fixture').style.width = '180px';",
        );
        await page.expect(
          "document.querySelector('#textarea').getBoundingClientRect().width",
          180,
        );
        await page.expect(
          "document.querySelector('#textarea-fixture').scrollWidth <= document.querySelector('#textarea-fixture').clientWidth",
          true,
        );
        await page.evaluate(
          "document.querySelector('#textarea-fixture').style.width = '600px';",
        );
        await page.setState({ fullWidth: false });
        await page.expect(
          "document.querySelector('#textarea').getBoundingClientRect().width",
          initialWidth,
        );
        await page.expect(
          "document.querySelector('#textarea').dataset.fullWidth",
          "false",
        );
      },
    );

    await runCase(
      "Textarea: value binding, character counter, and native custom validity recover",
      async () => {
        await page.expect(
          "document.querySelector('#textarea').checkValidity()",
          true,
        );
        await page.fill("#textarea", "123456");
        await page.expect("window.harness.snapshot().textareaValue", "123456");
        await page.expect(
          "document.querySelector('#textarea-fixture [data-count]').textContent",
          "6 / 5",
        );
        await page.expect(
          "document.querySelector('#textarea').validity.customError",
          true,
        );
        await page.expect(
          "document.querySelector('#textarea').checkValidity()",
          false,
        );
        await page.expect(
          "document.querySelector('#textarea').validationMessage",
          "1文字超過しています",
        );
        await page.setState({ textareaValue: "ok" });
        await page.expect("document.querySelector('#textarea').value", "ok");
        await page.expect(
          "document.querySelector('#textarea-fixture [data-count]').textContent",
          "2 / 5",
        );
        await page.expect(
          "document.querySelector('#textarea').validationMessage",
          "",
        );
        await page.expect(
          "document.querySelector('#textarea').checkValidity()",
          true,
        );
        await page.expect(
          "window.harness.snapshot().events.filter(event => event.type === 'textarea-input')",
          [{ type: "textarea-input", value: "123456" }],
        );
      },
    );
  },
);
