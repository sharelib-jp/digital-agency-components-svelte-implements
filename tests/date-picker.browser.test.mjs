import assert from "node:assert/strict";
import { browserTest } from "./browser-test-helpers.mjs";

const harnessSource = `
<script>
    import { onDestroy } from 'svelte';
    import DatePicker from '../src/lib/components/DatePicker.svelte';
    const NativeDate = window.Date;
    window.Date = class extends NativeDate {
        constructor(...args) { if (args.length) super(...args); else super(2024, 1, 20, 12); }
        static now() { return new NativeDate(2024, 1, 20, 12).getTime(); }
    };
    onDestroy(() => { window.Date = NativeDate; });
    let value = '2024-02-28';
    let open = false;
    let type = 'consolidated';
    let minDate = '2024-02-20';
    let maxDate = '2024-03-10';
    let disabled = false;
    let readonly = false;
    let required = true;
    let calendar = true;
        let form = undefined;
    let cancelReset = false;
    let show = true;
    let events = [];
    function record(type, detail) {
        events = [...events, { type, value: detail?.value, valid: detail?.valid, source: detail?.source,
            date: detail?.date ? [detail.date.getFullYear(), detail.date.getMonth() + 1, detail.date.getDate()] : null }];
    }
    export function snapshot() { return { value, open, type, minDate, maxDate, disabled, readonly, required, calendar, form, cancelReset, show, events }; }
    export function setState(patch) {
        if (Object.hasOwn(patch, 'value')) value = patch.value;
        if (Object.hasOwn(patch, 'open')) open = patch.open;
        if (Object.hasOwn(patch, 'type')) type = patch.type;
        if (Object.hasOwn(patch, 'minDate')) minDate = patch.minDate;
        if (Object.hasOwn(patch, 'maxDate')) maxDate = patch.maxDate;
        if (Object.hasOwn(patch, 'disabled')) disabled = patch.disabled;
        if (Object.hasOwn(patch, 'readonly')) readonly = patch.readonly;
        if (Object.hasOwn(patch, 'required')) required = patch.required;
        if (Object.hasOwn(patch, 'calendar')) calendar = patch.calendar;
                if (Object.hasOwn(patch, 'form')) form = patch.form ?? undefined;
        if (Object.hasOwn(patch, 'cancelReset')) cancelReset = patch.cancelReset;
        if (Object.hasOwn(patch, 'show')) show = patch.show;
    }
</script>
<form id="date-form" on:reset={event => { if (cancelReset) event.preventDefault(); }}>
    {#if show}
        <DatePicker id="date" name="birthday" label="生年月日" supportText="西暦で入力" {type} {minDate} {maxDate} {disabled} {readonly} {required} {calendar} {form} bind:value bind:open
            on:input={event => record('input', event.detail)} on:change={event => record('change', event.detail)}
            on:date-selected={event => record('date-selected', event.detail)} on:open={() => record('open')}
            on:close={() => record('close')} on:reset={() => record('reset')} />
    {/if}
    <button id="date-reset" type="reset">リセット</button>
</form>
<form id="external-date-form"></form>
<button id="outside" type="button" style="position: fixed; top: 8px; right: 8px;">外側</button>
`;

const opener = "[data-js-calendar-button]";
const year = "[data-js-year-input]";
const month = "[data-js-month-input]";
const day = "[data-js-day-input]";
const dateButton = (text) => `[data-js-date-button][data-iso="${text}"]`;
const activeDate = 'document.activeElement.getAttribute("data-iso")';
const tabStops =
  'document.querySelectorAll("[data-js-date-button][tabindex=\\"0\\"]").length';
const formValue =
  'new FormData(document.getElementById("date-form")).get("birthday")';

browserTest(
  "DatePicker browser behavior",
  harnessSource,
  async (t, page, runCase) => {
    await runCase(
      "pointer leap-day selection updates bind:value, events, local Date and native form data",
      async (page) => {
        await page.click(opener);
        await page.expect(activeDate, "2024-02-28");
        await page.expect(tabStops, 1);
        await page.click(dateButton("2024-02-29"));
        const state = await page.snapshot();
        assert.equal(state.value, "2024-02-29");
        assert.equal(state.open, false);
        assert.deepEqual(
          state.events.find((event) => event.type === "date-selected").date,
          [2024, 2, 29],
        );
        assert.deepEqual(
          state.events
            .filter((event) => ["input", "change"].includes(event.type))
            .map((event) => [
              event.type,
              event.value,
              event.source,
              event.valid,
            ]),
          [
            ["input", "2024-02-29", "calendar", true],
            ["change", "2024-02-29", "calendar", true],
          ],
        );
        await page.expect(formValue, "2024-02-29");
        await page.expect(
          'document.activeElement.hasAttribute("data-js-calendar-button")',
          true,
        );
        await page.expect(
          'document.querySelector("[data-js-month-input]").value',
          "02",
        );
      },
    );

    await runCase(
      "keyboard crosses leap day and month, Enter selects and Escape restores focus without selection",
      async (page) => {
        await page.click(opener);
        await page.key("\uE014"); // ArrowRight
        await page.expect(activeDate, "2024-02-29");
        await page.expect(tabStops, 1);
        await page.key("\uE014");
        await page.expect(activeDate, "2024-03-01");
        await page.expect(
          'document.querySelector("[data-js-current-month]").textContent',
          "3月",
        );
        await page.key("\uE015");
        await page.expect(activeDate, "2024-03-08");
        await page.key("\uE012"); // ArrowLeft
        await page.expect(activeDate, "2024-03-07");
        await page.key("\uE007");
        assert.equal((await page.snapshot()).value, "2024-03-07");
        await page.click(opener);
        await page.key("\uE013"); // ArrowUp
        await page.expect(activeDate, "2024-02-29");
        await page.key("\uE00C");
        assert.equal((await page.snapshot()).value, "2024-03-07");
        assert.equal((await page.snapshot()).open, false);
        await page.expect(
          'document.activeElement.hasAttribute("data-js-calendar-button")',
          true,
        );
      },
    );

    await runCase(
      "min/max disable cells and prevent keyboard movement or pointer selection outside range",
      async (page) => {
        await page.setState({
          value: "2024-02-28",
          minDate: "2024-02-28",
          maxDate: "2024-02-29",
        });
        await page.click(opener);
        await page.expect(
          'document.querySelector("[data-iso=\\"2024-02-27\\"]").disabled',
          true,
        );
        await page.key("\uE013");
        await page.expect(activeDate, "2024-02-28");
        await page.key("\uE014");
        await page.expect(activeDate, "2024-02-29");
        await page.key("\uE014");
        await page.expect(activeDate, "2024-02-29");
        await page.evaluate(
          'document.querySelector("[data-iso=\\"2024-02-27\\"]").click(); await window.settle();',
        );
        assert.equal((await page.snapshot()).value, "2024-02-28");
        await page.expect(
          'document.querySelector("[data-js-prev-month-button]").getAttribute("aria-disabled")',
          "true",
        );
        await page.expect(
          'document.querySelector("[data-js-next-month-button]").getAttribute("aria-disabled")',
          "true",
        );
        await page.key("\uE007");
        await page.expect(formValue, "2024-02-29");
      },
    );

    await runCase(
      "Home/End and PageUp/Down clamp days instead of rolling into another month",
      async (page) => {
        await page.setState({
          value: "2024-01-31",
          minDate: "2023-01-01",
          maxDate: "2025-12-31",
        });
        await page.click(opener);
        await page.key("\uE00F"); // PageDown
        await page.expect(activeDate, "2024-02-29");
        await page.key("\uE00E"); // PageUp
        await page.expect(activeDate, "2024-01-29");
        await page.key("\uE011"); // Home
        await page.expect(activeDate, "2024-01-28");
        await page.key("\uE010"); // End
        await page.expect(activeDate, "2024-02-03");
        await page.expect(tabStops, 1);
      },
    );

    await runCase(
      "manual impossible date remains visible, clears ISO value and blocks native validation",
      async (page) => {
        await page.fill(day, "30");
        assert.equal((await page.snapshot()).value, "");
        await page.expect(
          'document.querySelector("[data-js-day-input]").value',
          "30",
        );
        await page.expect(formValue, "");
        await page.expect(
          'document.getElementById("date-form").checkValidity()',
          false,
        );
        await page.expect(
          'document.querySelector("[data-js-day-input]").getAttribute("aria-invalid")',
          "true",
        );
        await page.fill(day, "29");
        assert.equal((await page.snapshot()).value, "2024-02-29");
        await page.expect(
          'document.getElementById("date-form").checkValidity()',
          true,
        );
        await page.fill(year, "2023");
        assert.equal((await page.snapshot()).value, "");
        await page.setState({ minDate: "2023-01-01", maxDate: "2024-12-31" });
        await page.expect(
          'document.getElementById("date-form").checkValidity()',
          false,
        );
        await page.fill(day, "28");
        assert.equal((await page.snapshot()).value, "2023-02-28");
        await page.fill(month, "04");
        await page.fill(day, "31");
        assert.equal((await page.snapshot()).value, "");
      },
    );

    await runCase(
      "separated manual inputs and parent values update the calendar, fields and validity",
      async (page) => {
        await page.setState({ type: "separated", value: "2024-03-02" });
        await page.expect(
          'document.querySelector("[data-js-day-input]").value',
          "02",
        );
        await page.fill(day, "03");
        assert.equal((await page.snapshot()).value, "2024-03-03");
        await page.setState({ open: true });
        await page.expect(activeDate, "2024-03-03");
        await page.setState({ value: "2024-02-29" });
        await page.expect(activeDate, "2024-02-29");
        await page.expect(
          'document.querySelector("[data-selected=\\"true\\"]").getAttribute("data-iso")',
          "2024-02-29",
        );
        await page.setState({ minDate: "2024-03-01" });
        await page.expect(tabStops, 1);
        await page.expect(activeDate, "2024-03-01");
        await page.expect(formValue, "");
        await page.setState({ open: false, value: "" });
        await page.expect(
          'document.querySelector("[data-js-year-input]").value',
          "",
        );
      },
    );

    await runCase(
      "month and year controls preserve a single tab stop and Tab wraps inside dialog",
      async (page) => {
        await page.setState({ minDate: "2023-01-01", maxDate: "2025-12-31" });
        await page.click(opener);
        await page.click("[data-js-next-month-button]");
        await page.expect(
          'document.querySelector("[data-js-current-month]").textContent',
          "3月",
        );
        await page.expect(tabStops, 1);
        await page.evaluate(
          'const select = document.querySelector("[data-js-year-select]"); select.value = "2025"; select.dispatchEvent(new Event("change", {bubbles:true})); await window.settle();',
        );
        await page.expect(
          'document.querySelector("[data-js-calendar-heading]").textContent',
          "2025年3月",
        );
        await page.expect(tabStops, 1);
        await page.focus("[data-js-today-button]");
        await page.key("\uE004");
        await page.expect(
          'document.activeElement.hasAttribute("data-js-year-select")',
          true,
        );
      },
    );

    await runCase(
      "today and delete use the fixed local date and clear the whole value",
      async (page) => {
        await page.click(opener);
        await page.click("[data-js-today-button]");
        assert.equal((await page.snapshot()).value, "2024-02-20");
        await page.click(opener);
        await page.click("[data-js-delete-button]");
        assert.equal((await page.snapshot()).value, "");
        await page.expect(
          'document.querySelector("[data-js-year-input]").value',
          "",
        );
        await page.expect(
          'document.getElementById("date-form").checkValidity()',
          false,
        );
        await page.setState({ required: false });
        await page.expect(
          'document.getElementById("date-form").checkValidity()',
          true,
        );
      },
    );

    await runCase(
      "reset restores mount-time value, closes dialog, and respects preventDefault",
      async (page) => {
        await page.setState({ value: "2024-03-05", open: true });
        await page.evaluate(
          'document.getElementById("date-form").reset(); await window.settle();',
        );
        assert.equal((await page.snapshot()).value, "2024-02-28");
        assert.equal((await page.snapshot()).open, false);
        await page.expect(formValue, "2024-02-28");
        await page.expect(
          'document.querySelector("[data-js-day-input]").value',
          "28",
        );
        await page.setState({ value: "2024-02-29", cancelReset: true });
        await page.click("#date-reset");
        assert.equal((await page.snapshot()).value, "2024-02-29");
        assert.equal(
          (await page.snapshot()).events.filter(
            (event) => event.type === "reset",
          ).length,
          1,
        );
      },
    );

    await runCase(
      "disabled/readonly suppress opening, disabled omits form data, outside click closes and restores focus",
      async (page) => {
        await page.setState({ disabled: true, open: true });
        assert.equal((await page.snapshot()).open, false);
        await page.expect(
          'document.querySelector("[data-js-calendar-button]").disabled',
          true,
        );
        await page.expect(
          'new FormData(document.getElementById("date-form")).has("birthday")',
          false,
        );
        await page.setState({ disabled: false, readonly: true, open: true });
        assert.equal((await page.snapshot()).open, false);
        await page.expect(
          'document.querySelector("[data-js-year-input]").readOnly',
          true,
        );
        await page.expect(formValue, "2024-02-28");
        await page.setState({ readonly: false });
        await page.click(opener);
        await page.click("#outside");
        assert.equal((await page.snapshot()).open, false);
        await page.expect(
          'document.activeElement.hasAttribute("data-js-calendar-button")',
          true,
        );
      },
    );

    await runCase(
      "consolidated edge arrows move between inputs; ArrowDown opens calendar",
      async (page) => {
        await page.focus(year);
        await page.evaluate("document.activeElement.setSelectionRange(4, 4);");
        await page.key("\uE014");
        await page.expect(
          'document.activeElement.hasAttribute("data-js-month-input")',
          true,
        );
        await page.key("\uE015");
        assert.equal((await page.snapshot()).open, true);
        await page.expect(activeDate, "2024-02-28");
      },
    );

    await runCase(
      "dynamic external form association moves submission and reset listeners",
      async (page) => {
        await page.setState({
          form: "external-date-form",
          value: "2024-03-05",
        });
        await page.expect(
          'new FormData(document.getElementById("external-date-form")).get("birthday")',
          "2024-03-05",
        );
        await page.expect(formValue, null);
        await page.evaluate(
          'document.getElementById("date-form").reset(); await window.settle();',
        );
        assert.equal((await page.snapshot()).value, "2024-03-05");
        await page.evaluate(
          'document.getElementById("external-date-form").reset(); await window.settle();',
        );
        assert.equal((await page.snapshot()).value, "2024-02-28");
        await page.setState({ form: null, value: "2024-02-29" });
        await page.evaluate(
          'document.getElementById("external-date-form").reset(); await window.settle();',
        );
        assert.equal((await page.snapshot()).value, "2024-02-29");
        await page.evaluate(
          'document.getElementById("date-form").reset(); await window.settle();',
        );
        assert.equal((await page.snapshot()).value, "2024-02-28");
      },
    );

    await runCase(
      "unmount removes document/form listeners and remount starts cleanly",
      async (page) => {
        await page.click(opener);
        await page.setState({ show: false });
        const count = (await page.snapshot()).events.length;
        await page.click("#outside");
        await page.evaluate(
          'document.getElementById("date-form").reset(); await window.settle();',
        );
        assert.equal((await page.snapshot()).events.length, count);
        await page.setState({ show: true, open: false });
        await page.click(opener);
        await page.expect(tabStops, 1);
        await page.key("\uE00C");
        assert.equal((await page.snapshot()).open, false);
      },
    );
  },
);
