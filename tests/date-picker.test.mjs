import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createComponentTestHarness } from "./component-test-helpers.mjs";

let harness;
before(async () => {
  harness = await createComponentTestHarness();
});
after(async () => {
  await harness?.cleanup();
});
const html = (result) => (typeof result === "string" ? result : result.body);
const render = (props) =>
  html(harness.render("DatePicker", { id: "date", ...props }));
const inputTag = (body, id) =>
  [...body.matchAll(/<input\b[^>]*>/g)]
    .map((match) => match[0])
    .find((tag) => tag.includes(`id="${id}"`));
const hiddenTag = (body) =>
  [...body.matchAll(/<input\b[^>]*>/g)]
    .map((match) => match[0])
    .find((tag) => /type="hidden"/.test(tag));

test("DatePicker compiles for SSR and client without warnings", () => {
  for (const generate of ["server", "client"])
    assert.deepEqual(harness.warnings("DatePicker", generate), []);
});

for (const type of ["consolidated", "separated"]) {
  test(`${type}: SSR renders source BEM inputs, labels, descriptions and native submission`, () => {
    const body = render({
      type,
      value: "2024-02-29",
      name: "birthday",
      label: "生年月日",
      supportText: "西暦で入力",
      errorText: "確認してください",
      required: true,
      Class: "custom-date",
    });
    assert.match(body, /<fieldset[^>]*id="date"[^>]*custom-date/);
    assert.match(body, /<legend[^>]*>.*生年月日/s);
    assert.match(body, new RegExp(`data-type="${type}"`));
    assert.match(body, /data-required="true"/);
    assert.match(hiddenTag(body), /name="birthday"/);
    assert.match(hiddenTag(body), /value="2024-02-29"/);
    for (const [field, value] of [
      ["year", "2024"],
      ["month", "02"],
      ["day", "29"],
    ]) {
      const tag = inputTag(body, `date-${field}`);
      assert.match(tag, /type="text"/);
      assert.match(tag, /inputmode="numeric"/);
      assert.match(tag, new RegExp(`value="${value}"`));
      assert.match(tag, /required/);
      assert.match(tag, /aria-invalid="true"/);
      assert.match(tag, /aria-describedby="date-support-text date-error-text"/);
      assert.doesNotMatch(tag, /\bname=/);
    }
    assert.doesNotMatch(body, /type="date"|<dads-calendar|<dads-date-picker/);
    assert.doesNotMatch(body, /role="dialog"/);
    assert.match(body, /aria-expanded="false"/);
  });
}

for (const value of [
  "2023-02-29",
  "1900-02-29",
  "2024-02-30",
  "2024-04-31",
  "2024-13-01",
  "0000-01-01",
  "invalid",
]) {
  test(`SSR does not submit or roll over impossible date ${value}`, () => {
    const body = render({ value, name: "date" });
    assert.match(hiddenTag(body), /value=""/);
    assert.match(body, /aria-invalid="true"/);
    assert.match(body, /正しい範囲内の日付/);
  });
}

for (const value of [
  "2000-02-29",
  "2024-02-29",
  "0099-01-01",
  "0001-01-01",
  "9999-12-31",
]) {
  test(`SSR accepts civil date ${value} without UTC/year conversion`, () => {
    const body = render({ value });
    assert.match(hiddenTag(body), new RegExp(`value="${value}"`));
    assert.doesNotMatch(body, /aria-invalid="true"/);
  });
}

test("minDate/maxDate include both endpoints and reject outside values", () => {
  for (const value of ["2024-02-28", "2024-02-29"])
    assert.match(
      hiddenTag(
        render({ value, minDate: "2024-02-28", maxDate: "2024-02-29" }),
      ),
      new RegExp(`value="${value}"`),
    );
  for (const value of ["2024-02-27", "2024-03-01"])
    assert.match(
      hiddenTag(
        render({ value, minDate: "2024-02-28", maxDate: "2024-02-29" }),
      ),
      /value=""/,
    );
});

test("invalid bounds fail closed rather than silently rolling over", () => {
  for (const bounds of [
    { minDate: "2024-02-30" },
    { maxDate: "bad" },
    { minDate: "2025-01-01", maxDate: "2024-12-31" },
  ]) {
    const body = render({ value: "2024-02-29", open: true, ...bounds });
    assert.match(hiddenTag(body), /value=""/);
    assert.doesNotMatch(body, /tabindex="0"/);
    assert.match(body, /日付の範囲設定/);
  }
});

test("open SSR calendar has Sunday-first grid, leap day selection and one enabled tab stop", () => {
  const body = render({
    value: "2024-02-29",
    open: true,
    minDate: "2024-02-28",
    maxDate: "2024-03-02",
  });
  assert.match(body, /role="dialog"/);
  assert.match(body, /aria-modal="true"/);
  assert.match(body, /aria-label="2024年2月"/);
  assert.match(body, /aria-live="polite"/);
  assert.match(body, /2024年\(令和6年\)/);
  assert.equal([...body.matchAll(/tabindex="0"/g)].length, 1);
  assert.match(
    body,
    /data-iso="2024-02-29"[^>]*data-selected="true"[^>]*tabindex="0"/,
  );
  assert.match(body, /data-iso="2024-02-27"[^>]*disabled/);
  assert.match(body, /data-iso="2024-03-01"[^>]*disabled/);
  assert.deepEqual(
    [...body.matchAll(/<th\b[^>]*>(.*?)<\/th>/g)].map((match) => match[1]),
    ["日", "月", "火", "水", "木", "金", "土"],
  );
});

test("readonly and disabled suppress calendar opening and retain source variants", () => {
  for (const state of [{ readonly: true }, { disabled: true }]) {
    const body = render({ value: "2024-02-29", open: true, ...state });
    assert.doesNotMatch(body, /role="dialog"/);
    assert.match(body, /aria-expanded="false"/);
    assert.match(
      inputTag(body, "date-year"),
      state.readonly ? /readonly/ : /disabled/,
    );
    assert.match(body, state.readonly ? /data-readonly/ : /data-disabled/);
  }
  assert.doesNotMatch(render({ calendar: false }), /data-js-calendar-button/);
});

test("a stable non-empty id is required", () => {
  assert.throws(() => render({ id: "" }), /stable, non-empty id/);
});

test("legacy parent bindings and typed component events compile independently", async () => {
  const body = html(
    await harness.renderSource(`
<script>
import DatePicker from '../src/lib/components/DatePicker.svelte';
let value = '2024-02-29';
let open = true;
let detail;
</script>
<DatePicker id="bound-date" bind:value bind:open minDate="2024-01-01" maxDate="2024-12-31" on:change={event => detail = event.detail} />
<output>{value}</output>`),
  );
  assert.match(body, /id="bound-date"/);
  assert.match(body, /<output>2024-02-29<\/output>/);
});
