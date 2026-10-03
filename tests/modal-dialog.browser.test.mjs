import assert from "node:assert/strict";
import { browserTest } from "./browser-test-helpers.mjs";

const harnessSource = `<script>
    import ModalDialog from '../src/lib/components/ModalDialog.svelte';
    let modalOpen = false;
    let cancelModal = false;
    let events = [];
    function record(type, detail = {}) { events = [...events, { type, ...detail }]; }
    export function snapshot() { return { modalOpen, cancelModal, events }; }
    export function setState(patch) {
        if (Object.hasOwn(patch, 'modalOpen')) modalOpen = patch.modalOpen;
        if (Object.hasOwn(patch, 'cancelModal')) cancelModal = patch.cancelModal;
    }
</script>

<main>
<section>
        <button id="modal-opener" type="button" on:click={() => modalOpen = true}>確認を開く</button>
        <button id="native-modal-opener" type="button" on:click={() => document.getElementById('modal').showModal()}>Nativeで開く</button>
        <ModalDialog id="modal" heading="確認" message="続行しますか" bind:open={modalOpen}
            on:open={() => record('modal-open')}
            on:close={(event) => record('modal-close', event.detail)}
            on:cancel={(event) => { record('modal-cancel'); if (cancelModal) event.preventDefault(); }} />
    </section>
</main>
`;

browserTest(
  "ModalDialog browser behavior",
  harnessSource,
  async (t, page, runCase) => {
    await runCase(
      "ModalDialog: bound/native open and close, cancelable Escape, events, and focus restoration",
      async () => {
        const modalEvents =
          "window.harness.snapshot().events.filter(event => event.type.startsWith('modal-'))";
        const isOpen =
          "[window.harness.snapshot().modalOpen, document.querySelector('#modal').open, document.querySelector('#modal').matches(':modal')]";
        await page.click("#modal-opener");
        await page.expect(isOpen, [true, true, true]);
        await page.expect("document.activeElement.id", "modal-heading");
        await page.setState({ modalOpen: false });
        await page.expect(isOpen, [false, false, false]);
        await page.expect("document.activeElement.id", "modal-opener");
        await page.expect(modalEvents, [
          { type: "modal-open" },
          {
            type: "modal-close",
            reason: "binding",
            returnValue: "",
          },
        ]);
        await page.click("#modal-opener");
        await page.setState({ cancelModal: true });
        await page.key("\uE00C");
        await page.expect(isOpen, [true, true, true]);
        await page.expect(
          `${modalEvents}.filter(event => event.type === 'modal-cancel').length`,
          1,
        );
        await page.expect(
          `${modalEvents}.filter(event => event.type === 'modal-close').length`,
          1,
        );
        await page.setState({ cancelModal: false });
        await page.key("\uE00C");
        await page.expect(isOpen, [false, false, false]);
        await page.expect("document.activeElement.id", "modal-opener");
        await page.click("#native-modal-opener");
        await page.expect(isOpen, [true, true, true]);
        await page.expect("document.activeElement.id", "modal-heading");
        await page.evaluate(
          "document.querySelector('#modal').close('native-result'); await window.settle();",
        );
        await page.expect(isOpen, [false, false, false]);
        await page.expect("document.activeElement.id", "native-modal-opener");
        await page.expect(modalEvents, [
          { type: "modal-open" },
          {
            type: "modal-close",
            reason: "binding",
            returnValue: "",
          },
          { type: "modal-open" },
          { type: "modal-cancel" },
          { type: "modal-cancel" },
          {
            type: "modal-close",
            reason: "cancel",
            returnValue: "",
          },
          { type: "modal-open" },
          {
            type: "modal-close",
            reason: "native",
            returnValue: "native-result",
          },
        ]);
      },
    );
  },
);
