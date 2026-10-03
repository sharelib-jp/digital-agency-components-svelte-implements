import assert from "node:assert/strict";
import { browserTest } from "./browser-test-helpers.mjs";

const harnessSource = `<script>
    import HorizontalMenu from '../src/lib/components/HorizontalMenu.svelte';
    let selectedId = "overview";
    let expandedId = null;
    let events = [];
    const menuItems = [
        { id: 'overview', label: '概要', href: '#overview' },
        { id: 'contact', label: 'お問い合わせ', href: '#contact' },
        { id: 'services', label: 'サービス', children: [
            { id: 'tax', label: '税金' }, { id: 'records', label: '記録' },
        ] },
    ];
    function record(type, detail = {}) { events = [...events, { type, ...detail }]; }
    export function snapshot() { return { selectedId, expandedId, events }; }
    export function setState(patch) {
        if (Object.hasOwn(patch, 'selectedId')) selectedId = patch.selectedId;
        if (Object.hasOwn(patch, 'expandedId')) expandedId = patch.expandedId;
    }
</script>

<main>
<section id="menu-fixture">
        <HorizontalMenu items={menuItems} bind:selectedId bind:expandedId
            on:select={(event) => record('menu-select', { id: event.detail.id })} />
    </section>
</main>
`;

browserTest(
  "HorizontalMenu browser behavior",
  harnessSource,
  async (t, page, runCase) => {
    await runCase(
      "HorizontalMenu: selectedId updates current markers; Escape closes submenu and restores focus",
      async () => {
        const overview = '[data-item-id="overview"] [data-js-top-level]';
        const contact = '[data-item-id="contact"] [data-js-top-level]';
        const services = '[data-item-id="services"] [data-js-top-level]';
        await page.expect(
          `document.querySelector('${overview}').getAttribute('aria-current')`,
          "page",
        );
        await page.setState({ selectedId: "contact" });
        await page.expect(
          `document.querySelector('${contact}').getAttribute('aria-current')`,
          "page",
        );
        await page.expect(
          `document.querySelector('${overview}').getAttribute('aria-current')`,
          null,
        );
        await page.click(overview);
        await page.expect("window.harness.snapshot().selectedId", "overview");
        await page.expect(
          `document.querySelector('${overview}').getAttribute('aria-current')`,
          "page",
        );
        await page.click(services);
        await page.key("\uE015"); // ArrowDown: native trusted key event.
        await page.expect("document.activeElement.textContent.trim()", "税金");
        await page.setState({ selectedId: "records" });
        await page.expect(
          `document.querySelector('${services}').getAttribute('aria-current')`,
          "true",
        );
        await page.expect(
          "[...document.querySelectorAll('[data-js-submenu-item]')].map(item => [item.getAttribute('aria-current'), item.hasAttribute('data-current')])",
          [
            [null, false],
            ["page", true],
          ],
        );
        await page.setState({ selectedId: "tax" });
        await page.expect(
          "[...document.querySelectorAll('[data-js-submenu-item]')].map(item => [item.getAttribute('aria-current'), item.hasAttribute('data-current')])",
          [
            ["page", true],
            [null, false],
          ],
        );
        await page.key("\uE00C"); // Escape.
        await page.expect("window.harness.snapshot().expandedId", null);
        await page.expect(
          "document.querySelector('.dads-horizontal-menu__submenu') === null",
          true,
        );
        await page.expect(
          `document.activeElement === document.querySelector('${services}')`,
          true,
        );
      },
    );
  },
);
