import assert from "node:assert/strict";
import { browserTest } from "./browser-test-helpers.mjs";

const harnessSource = `<script>
    import SearchBox from '../src/lib/components/SearchBox.svelte';
    let searchValue = "seed";
    let searchScope = "all";
    let events = [];
    const scopeOptions = [
        { value: 'all', label: 'すべて' }, { value: 'docs', label: '資料' },
    ];
    function record(type, detail = {}) { events = [...events, { type, ...detail }]; }
    export function snapshot() { return { searchValue, searchScope, events }; }
    export function setState(patch) {
        if (Object.hasOwn(patch, 'searchValue')) searchValue = patch.searchValue;
        if (Object.hasOwn(patch, 'searchScope')) searchScope = patch.searchScope;
    }
</script>

<main>
<section id="search-fixture">
        <SearchBox id="search" bind:value={searchValue} bind:scope={searchScope} {scopeOptions} detailOpen={true}
            on:search={(event) => record('search', {
                value: event.detail.value, scope: event.detail.scope,
                formData: [...event.detail.formData], nativeSubmit: event.detail.originalEvent instanceof SubmitEvent,
            })} on:reset={() => record('search-reset')}>
            <label slot="detail">絞り込み <input name="filter" value="available" /></label>
        </SearchBox>
    </section>
</main>
`;

browserTest(
  "SearchBox browser behavior",
  harnessSource,
  async (t, page, runCase) => {
    await runCase(
      "SearchBox: native Enter submission emits bound values/FormData; reset updates bindings",
      async () => {
        const resetValue = await page.read(
          "document.querySelector('#search').defaultValue",
        );
        await page.fill("#search", "税金");
        await page.evaluate(
          "const select = document.querySelector('#search-fixture select'); select.value = 'docs'; select.dispatchEvent(new Event('change', { bubbles: true })); await window.settle();",
        );
        await page.focus("#search");
        await page.key("\uE007"); // Enter invokes Firefox's implicit form submission.
        await page.expect(
          "window.harness.snapshot().events.filter(event => event.type === 'search')",
          [
            {
              type: "search",
              value: "税金",
              scope: "docs",
              formData: [
                ["scope", "docs"],
                ["q", "税金"],
                ["filter", "available"],
              ],
              nativeSubmit: true,
            },
          ],
        );
        await page.click('#search-fixture button[type="reset"]');
        await page.expect(
          "[window.harness.snapshot().searchValue, window.harness.snapshot().searchScope]",
          [resetValue, "all"],
        );
        await page.expect(
          "document.querySelector('#search').value",
          resetValue,
        );
        await page.expect(
          "window.harness.snapshot().events.filter(event => event.type === 'search-reset').length",
          1,
        );
      },
    );
  },
);
