import assert from "node:assert/strict";
import { browserTest } from "./browser-test-helpers.mjs";

const harnessSource = `<script>
    import PageNavigation from '../src/lib/components/PageNavigation.svelte';
    let currentPage = 2;
    let events = [];
    function record(type, detail = {}) { events = [...events, { type, ...detail }]; }
    export function snapshot() { return { currentPage, events }; }
    export function setState(patch) {
        if (Object.hasOwn(patch, 'currentPage')) currentPage = patch.currentPage;
    }
</script>

<main>
<section id="page-fixture">
        <PageNavigation bind:currentPage totalPages={3}
            on:change={(event) => record('page-change', {
                currentPage: event.detail.currentPage, previousPage: event.detail.previousPage,
                direction: event.detail.direction,
            })} />
    </section>
</main>
`;

browserTest(
  "PageNavigation browser behavior",
  harnessSource,
  async (t, page, runCase) => {
    await runCase(
      "PageNavigation: currentPage binding, boundary controls, and change detail",
      async () => {
        await page.click('#page-fixture [data-control="next"]');
        await page.expect("window.harness.snapshot().currentPage", 3);
        await page.expect(
          "document.querySelector('#page-fixture [data-control=next]') === null",
          true,
        );
        await page.click('#page-fixture [data-control="prev"]');
        await page.expect("window.harness.snapshot().currentPage", 2);
        await page.setState({ currentPage: 1 });
        await page.expect(
          "document.querySelector('#page-fixture .dads-page-navigation__counter').textContent",
          "1 / 3",
        );
        await page.expect(
          "document.querySelector('#page-fixture [data-control=prev]') === null",
          true,
        );
        await page.expect(
          "window.harness.snapshot().events.filter(event => event.type === 'page-change')",
          [
            {
              type: "page-change",
              currentPage: 3,
              previousPage: 2,
              direction: "next",
            },
            {
              type: "page-change",
              currentPage: 2,
              previousPage: 3,
              direction: "prev",
            },
          ],
        );
      },
    );
  },
);
