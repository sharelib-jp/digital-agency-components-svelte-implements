import assert from "node:assert/strict";
import { browserTest } from "./browser-test-helpers.mjs";

const harnessSource = `
<script>
  import MenuList from '../src/lib/components/MenuList.svelte';
  import MenuListBox from '../src/lib/components/MenuListBox.svelte';
  let selectedId = null;
  let listSelectedId = null;
  let open = false;
  let disabled = false;
  let cancel = false;
  let show = true;
  let empty = false;
  let events = [];
  const items = [
    { id: 'blocked', label: '利用不可', disabled: true },
    { id: 'edit', label: '編集' },
    { id: 'disabled-link', label: '無効リンク', href: '#blocked', disabled: true },
    { id: 'docs', label: '資料', href: '#menu-docs' },
    { id: 'save', label: '保存' },
  ];
  const listItems = [
    { id: 'parent', label: '親項目', children: [
      { id: 'child', label: '子項目', href: '#list-child' },
      { id: 'grandparent', label: '中間項目', children: [{ id: 'leaf', label: '末端項目' }] },
    ] },
    { id: 'list-disabled', label: '無効', href: '#list-blocked', disabled: true },
  ];
  function record(event, source) {
    events = [...events, { source, id: event.detail.id, parentId: event.detail.parentId,
      index: event.detail.index ?? null, cancelable: event.cancelable,
      native: event.detail.originalEvent instanceof MouseEvent }];
    if (cancel) event.preventDefault();
  }
  export function snapshot() { return { selectedId, listSelectedId, open, events }; }
  export function setState(patch) {
    if (Object.hasOwn(patch, 'selectedId')) selectedId = patch.selectedId;
    if (Object.hasOwn(patch, 'listSelectedId')) listSelectedId = patch.listSelectedId;
    if (Object.hasOwn(patch, 'open')) open = patch.open;
    if (Object.hasOwn(patch, 'disabled')) disabled = patch.disabled;
    if (Object.hasOwn(patch, 'cancel')) cancel = patch.cancel;
    if (Object.hasOwn(patch, 'show')) show = patch.show;
    if (Object.hasOwn(patch, 'empty')) empty = patch.empty;
  }
</script>
<button id="before" type="button">前へ</button>
{#if show}
  <MenuListBox id="box" items={empty ? [] : items} bind:selectedId bind:open {disabled}
    on:select={(event) => record(event, 'box')} />
{/if}
<button id="outside" type="button" style="margin-top: calc(320 / 16 * 1rem);">外側</button>
<MenuList id="list" items={listItems} bind:selectedId={listSelectedId}
  on:select={(event) => record(event, 'list')} />
`;

const opener = "#box-opener";
const item = (id) => `#box [data-item-id="${id}"]`;
const focused = 'document.activeElement.getAttribute("data-item-id")';
const zeroTabStops =
  '[...document.querySelectorAll("#box [data-js-menu-item]")].filter(item => item.tabIndex === 0).map(item => item.dataset.itemId)';

browserTest(
  "MenuList and MenuListBox regressions",
  harnessSource,
  async (t, page, runCase) => {
    await runCase(
      "MenuListBox: arrows skip disabled items, wrap, Home/End, Escape restores focus",
      async (page) => {
        await page.focus(opener);
        await page.key("\uE015");
        await page.expect(focused, "edit");
        await page.expect(zeroTabStops, ["edit"]);
        await page.key("\uE015");
        await page.expect(focused, "docs");
        await page.key("\uE015");
        await page.expect(focused, "save");
        await page.key("\uE015");
        await page.expect(focused, "edit");
        await page.key("\uE010"); // End.
        await page.expect(focused, "save");
        await page.key("\uE011"); // Home.
        await page.expect(focused, "edit");
        await page.key("\uE013"); // ArrowUp (WebDriver key code).
        await page.expect(focused, "save");
        await page.expect(zeroTabStops, ["save"]);
        await page.key("\uE00C");
        await page.expect("window.harness.snapshot().open", false);
        await page.expect("document.activeElement.id", "box-opener");
        await page.expect(zeroTabStops, []);
        await page.key("\uE013");
        await page.expect(focused, "save");
      },
    );

    await runCase(
      "MenuListBox: Enter opens, selects and restores focus with typed event details",
      async (page) => {
        await page.focus(opener);
        await page.key("\uE007");
        await page.expect(focused, "edit");
        await page.key("\uE007");
        assert.deepEqual(await page.snapshot(), {
          selectedId: "edit",
          listSelectedId: null,
          open: false,
          events: [
            {
              source: "box",
              id: "edit",
              parentId: null,
              index: 1,
              cancelable: true,
              native: true,
            },
          ],
        });
        await page.expect("document.activeElement.id", "box-opener");
      },
    );

    await runCase(
      "MenuListBox: canceled selection retains open/current state and blocks link navigation",
      async (page) => {
        await page.setState({ cancel: true, selectedId: "save" });
        await page.click(opener);
        await page.click(item("docs"));
        await page.expect("location.hash", "");
        await page.expect(
          "[window.harness.snapshot().selectedId, window.harness.snapshot().open]",
          ["save", true],
        );
        await page.expect(focused, "docs");
        await page.setState({ cancel: false });
        await page.click(item("docs"));
        await page.expect("location.hash", "#menu-docs");
        await page.expect(
          "[window.harness.snapshot().selectedId, window.harness.snapshot().open]",
          ["docs", false],
        );
        await page.expect("document.activeElement.id", "box-opener");
      },
    );

    await runCase(
      "MenuListBox: disabled items and opener cannot select/open, even with synthetic clicks",
      async (page) => {
        await page.click(opener);
        await page.evaluate(
          `document.querySelector('${item("disabled-link")}').click(); document.querySelector('${item("blocked")}').click(); await window.settle();`,
        );
        await page.expect("window.harness.snapshot().events", []);
        await page.expect("location.hash", "");
        await page.setState({ disabled: true });
        await page.expect("window.harness.snapshot().open", false);
        await page.evaluate(
          `document.querySelector('${opener}').click(); await window.settle();`,
        );
        await page.expect("window.harness.snapshot().open", false);
        await page.expect(
          'document.querySelector("#box-opener").disabled',
          true,
        );
      },
    );

    await runCase(
      "MenuListBox: outside click/focus and native Tab close without stealing outside focus",
      async (page) => {
        await page.click(opener);
        await page.click("#outside");
        await page.expect("window.harness.snapshot().open", false);
        await page.expect("document.activeElement.id", "outside");
        await page.click(opener);
        await page.focus("#before");
        await page.expect("window.harness.snapshot().open", false);
        await page.expect("document.activeElement.id", "before");
        await page.click(opener);
        await page.key("\uE004");
        await page.expect("window.harness.snapshot().open", false);
        await page.expect("document.activeElement.id", "outside");
      },
    );

    await runCase(
      "MenuListBox: bindings update current/open and closing a focused popup restores opener",
      async (page) => {
        await page.setState({ open: true, selectedId: "save" });
        await page.expect(
          'document.querySelector("#box-opener").getAttribute("aria-expanded")',
          "true",
        );
        await page.expect(
          'document.querySelector("#box [data-item-id=save]").getAttribute("aria-current")',
          "true",
        );
        await page.focus(item("save"));
        await page.setState({ open: false });
        await page.expect("document.activeElement.id", "box-opener");
        await page.expect(
          'document.querySelector("#box [data-js-popup]").hidden',
          true,
        );
      },
    );

    await runCase(
      "MenuList: recursive selection forwards immediate parentId, cancellation and native navigation",
      async (page) => {
        const child = '#list [data-item-id="child"]';
        await page.setState({ cancel: true });
        await page.click(child);
        await page.expect("location.hash", "");
        await page.expect("window.harness.snapshot().listSelectedId", null);
        await page.setState({ cancel: false });
        await page.click(child);
        await page.expect("location.hash", "#list-child");
        await page.expect("window.harness.snapshot().listSelectedId", "child");
        await page.click('#list [data-item-id="leaf"]');
        await page.expect("window.harness.snapshot().listSelectedId", "leaf");
        await page.expect(
          "window.harness.snapshot().events.at(-1).parentId",
          "grandparent",
        );
        await page.evaluate(
          'document.querySelector("#list [data-item-id=list-disabled]").click(); await window.settle();',
        );
        await page.expect("window.harness.snapshot().listSelectedId", "leaf");
        await page.expect("location.hash", "#list-child");
      },
    );

    await runCase(
      "MenuListBox: modified native link clicks do not select or close",
      async (page) => {
        await page.click(opener);
        await page.evaluate(
          `const link = document.querySelector('${item("docs")}'); link.addEventListener('click', event => event.preventDefault(), { once: true }); link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true })); await window.settle();`,
        );
        await page.expect(
          "[window.harness.snapshot().selectedId, window.harness.snapshot().open]",
          [null, true],
        );
        await page.expect("window.harness.snapshot().events", []);
      },
    );

    await runCase(
      "MenuListBox: empty menu keeps opener focus and Escape remains usable",
      async (page) => {
        await page.setState({ empty: true });
        await page.click(opener);
        await page.expect("window.harness.snapshot().open", true);
        await page.expect("document.activeElement.id", "box-opener");
        await page.key("\uE00C");
        await page.expect("window.harness.snapshot().open", false);
      },
    );

    await runCase(
      "MenuListBox: unmount removes document listeners and remount navigates once",
      async (page) => {
        await page.click(opener);
        await page.focus("#outside");
        await page.setState({ show: false, open: true });
        await page.key("\uE00C");
        await page.expect("window.harness.snapshot().open", true);
        await page.expect("document.activeElement.id", "outside");
        await page.setState({ show: true, open: false });
        await page.click(opener);
        await page.key("\uE015");
        await page.expect(focused, "docs");
        await page.expect(zeroTabStops, ["docs"]);
      },
    );
  },
);
