import assert from "node:assert/strict";
import { browserTest } from "./browser-test-helpers.mjs";

const harnessSource = `<script>
    import NotificationBanner from '../src/lib/components/NotificationBanner.svelte';
    let bannerOpen = true;
    let events = [];
    function record(type, detail = {}) { events = [...events, { type, ...detail }]; }
    export function snapshot() { return { bannerOpen, events }; }
    export function setState(patch) {
        if (Object.hasOwn(patch, 'bannerOpen')) bannerOpen = patch.bannerOpen;
    }
</script>

<main>
<section>
        <NotificationBanner id="notification" heading="保存しました" bind:open={bannerOpen}
            on:close={() => record('notification-close')} />
    </section>
</main>
`;

browserTest(
  "NotificationBanner browser behavior",
  harnessSource,
  async (t, page, runCase) => {
    await runCase(
      "NotificationBanner: dismiss binds open and reopening restores the banner",
      async () => {
        await page.click("#notification .dads-notification-banner__close");
        await page.expect("window.harness.snapshot().bannerOpen", false);
        await page.expect(
          "document.querySelector('#notification') === null",
          true,
        );
        await page.expect(
          "window.harness.snapshot().events.filter(event => event.type === 'notification-close').length",
          1,
        );
        await page.setState({ bannerOpen: true });
        await page.expect(
          "document.querySelector('#notification')?.getAttribute('role')",
          "status",
        );
      },
    );
  },
);
