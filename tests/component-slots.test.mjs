import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { render } from "svelte/server";
import { createComponentTestHarness } from "./component-test-helpers.mjs";
import { fixtures, representativeTags } from "./component-fixtures.mjs";
import {
  tags,
  matchingTags,
  getTag,
  element,
  text,
  assertAbsentAttribute,
  assertInternalDescriptions,
} from "./ssr-assertions.mjs";

const componentNames = [
  "Image",
  "Heading",
  "EmergencyBanner",
  "NotificationBanner",
  "ModalDialog",
];
let harness, compiled, components;
before(async () => {
  harness = await createComponentTestHarness(componentNames);
  compiled = harness.compiled;
  components = harness.components;
});
after(async () => {
  await harness?.cleanup();
});
const renderComponent = (name, props = structuredClone(fixtures[name])) =>
  harness.render(name, props);
const compileHarness = (source) => harness.compileSource(source);

test("Named slots: image caption and heading content replace fallbacks", async () => {
  const harness = await compileHarness(`
        <script>
            import Image from '../src/lib/components/Image.svelte';
            import Heading from '../src/lib/components/Heading.svelte';
        </script>
        <Image src="/test-image.png" alt="庁舎" caption="fallback-caption">
            <span slot="caption">スロットの説明</span>
        </Image>
        <Heading text="fallback-heading">
            <span slot="shoulder">スロットの肩見出し</span>
            <span slot="icon">装飾</span>
            主見出しのスロット
        </Heading>
    `);
  const html = render(harness).body;
  assert.equal(text(element(html, "figcaption").inner), "スロットの説明");
  getTag(html, "hgroup");
  assert.equal(
    text(element(html, "p", { class: "dads-heading__shoulder" }).inner),
    "スロットの肩見出し",
  );
  assert.match(text(element(html, "h2").inner), /主見出しのスロット/);
  assert.doesNotMatch(text(html), /fallback-caption|fallback-heading/);
});

test("Named slots: emergency/notification banners render custom content and action structure", async () => {
  const harness = await compileHarness(`
        <script>
            import EmergencyBanner from '../src/lib/components/EmergencyBanner.svelte';
            import NotificationBanner from '../src/lib/components/NotificationBanner.svelte';
        </script>
        <EmergencyBanner message="fallback-emergency">
            <span slot="heading">緊急スロット</span>
            <p>緊急本文</p>
            <a slot="actions" href="/emergency-slot">緊急詳細</a>
        </EmergencyBanner>
        <NotificationBanner dismissible={false} message="fallback-notification">
            <span slot="heading">通知スロット</span>
            <p>通知本文</p>
            <a slot="actions" href="/notification-slot">通知詳細</a>
        </NotificationBanner>
    `);
  const html = render(harness).body;
  for (const content of [
    "緊急スロット",
    "緊急本文",
    "通知スロット",
    "通知本文",
  ])
    assert.ok(text(html).includes(content));
  getTag(html, "a", { href: "/emergency-slot" });
  getTag(html, "a", { href: "/notification-slot" });
  assert.equal(tags(html, "button").length, 0);
  assert.doesNotMatch(text(html), /fallback-emergency|fallback-notification/);
});

test("Named slots: modal label, description, body and actions preserve ARIA references", async () => {
  const harness = await compileHarness(`
        <script>import ModalDialog from '../src/lib/components/ModalDialog.svelte';</script>
        <ModalDialog id="slot-modal" heading="fallback-heading" message="fallback-body" actionLabel="fallback-action">
            <span slot="heading">スロットのタイトル</span>
            <span slot="description">スロットの説明</span>
            <p>スロットの本文</p>
            <button slot="actions" type="button">スロットの操作</button>
        </ModalDialog>
    `);
  const html = render(harness).body;
  getTag(html, "dialog", {
    "aria-labelledby": "slot-modal-heading",
    "aria-describedby": "slot-modal-description",
  });
  assert.equal(
    text(element(html, "h2", { id: "slot-modal-heading" }).inner),
    "スロットのタイトル",
  );
  assert.equal(
    text(element(html, "p", { id: "slot-modal-description" }).inner),
    "スロットの説明",
  );
  assert.equal(
    text(element(html, "div", { class: "dads-modal-dialog__body" }).inner),
    "スロットの説明 スロットの本文",
  );
  assert.equal(
    text(element(html, "div", { class: "dads-modal-dialog__actions" }).inner),
    "スロットの操作",
  );
  assert.doesNotMatch(
    text(html),
    /fallback-heading|fallback-body|fallback-action/,
  );
});
