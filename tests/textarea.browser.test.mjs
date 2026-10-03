import assert from "node:assert/strict";
import { browserTest } from "./browser-test-helpers.mjs";

const harnessSource = `<script>
    import Textarea from '../src/lib/components/Textarea.svelte';
    let textareaValue = "ab";
    let events = [];
    function record(type, detail = {}) { events = [...events, { type, ...detail }]; }
    export function snapshot() { return { textareaValue, events }; }
    export function setState(patch) {
        if (Object.hasOwn(patch, 'textareaValue')) textareaValue = patch.textareaValue;
    }
</script>

<main>
<section id="textarea-fixture">
        <Textarea id="textarea" label="メッセージ" counterMax={5} bind:value={textareaValue}
            on:input={(event) => record('textarea-input', { value: event.target.value })} />
    </section>
</main>
`;

browserTest(
  "Textarea browser behavior",
  harnessSource,
  async (t, page, runCase) => {
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
