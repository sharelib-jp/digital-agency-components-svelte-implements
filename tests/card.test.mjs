import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { before, after, test } from "node:test";
import { createComponentTestHarness } from "./component-test-helpers.mjs";
import {
  element,
  getTag,
  matchingTags,
  tags,
  text,
} from "./ssr-assertions.mjs";

let harness;
before(async () => {
  harness = await createComponentTestHarness(["Card"]);
});
after(async () => {
  await harness?.cleanup();
});

const renderCard = (props = {}) => harness.render("Card", props);

test("Card: text props render a heading and body without an implicit action", () => {
  const html = renderCard({
    title: "お知らせ",
    content: "申請を受け付けています。",
  });
  assert.equal(
    text(element(html, "h2", { class: "dads-card__title" }).inner),
    "お知らせ",
  );
  assert.equal(
    text(element(html, "p", { class: "dads-card__text" }).inner),
    "申請を受け付けています。",
  );
  const root = getTag(html, "div", { class: "dads-card" });
  assert.equal(root.attributes.tabindex, undefined);
  assert.equal(root.attributes.role, undefined);
  assert.equal(tags(html, "a").length, 0);
  assert.equal(tags(html, "button").length, 0);
});

test("Card: text props are escaped rather than interpreted as HTML", () => {
  const title = '<script>alert("title")</script>';
  const content = '<img src="x" onerror="alert(1)"> & 本文\n2行目';
  const html = renderCard({ title, content });
  assert.equal(text(element(html, "h2").inner), title);
  assert.equal(text(element(html, "p").inner), content.replace("\n", " "));
  assert.ok(html.includes("\n2行目"));
  assert.equal(tags(html, "script").length, 0);
  assert.equal(tags(html, "img").length, 0);
});

test("Card: empty title/content omit their regions independently", () => {
  const empty = renderCard();
  getTag(empty, "div", { class: "dads-card" });
  assert.equal(
    matchingTags(empty, "div", { class: "dads-card__content" }).length,
    0,
  );
  assert.equal(tags(empty, "h2").length, 0);
  const bodyOnly = renderCard({ title: "", content: "本文のみ" });
  assert.equal(tags(bodyOnly, "h2").length, 0);
  assert.equal(
    matchingTags(bodyOnly, "div", { class: "dads-card__content" }).length,
    1,
  );
  assert.equal(text(element(bodyOnly, "p").inner), "本文のみ");
  assert.equal(
    matchingTags(renderCard({ title: "見出しのみ" }), "div", {
      class: "dads-card__content",
    }).length,
    0,
  );
});

for (const headingLevel of ["h1", "h2", "h3", "h4", "h5", "h6"]) {
  test(`Card: ${headingLevel} respects the document heading hierarchy`, () => {
    const html = renderCard({ title: "見出し", headingLevel });
    assert.equal(
      text(element(html, headingLevel, { class: "dads-card__title" }).inner),
      "見出し",
    );
  });
}

test("Card: id, Class and additional HTML attributes belong to the root", () => {
  const html = renderCard({
    id: "notice",
    Class: "custom-card",
    title: "見出し",
    "data-category": "news",
    "aria-label": "案内",
  });
  const root = getTag(html, "div", {
    id: "notice",
    class: "dads-card",
    "data-category": "news",
    "aria-label": "案内",
  });
  assert.ok(root.attributes.class.split(/\s+/).includes("custom-card"));
  assert.equal(root.attributes.title, undefined);
  assert.equal(root.attributes.content, undefined);
  assert.equal(root.attributes.headingLevel, undefined);
  assert.equal(getTag(html, "h2").attributes.id, undefined);
});

test("Card: content accepts a Snippet with arbitrary markup and components", async () => {
  const html = await harness.renderSource(`<script lang="ts">
    import Card from '../src/lib/components/Card.svelte';
    import Checkbox from '../src/lib/components/Checkbox.svelte';
</script>
{#snippet body()}
    <p>必要な<strong>書類</strong></p>
    <a href="/guide">手続きガイド</a>
    <Checkbox id="agree-card" label="確認しました" />
    <button type="button">申請する</button>
{/snippet}
<Card title="申請の準備" content={body} />`);
  const content = element(html, "div", { class: "dads-card__content" }).inner;
  assert.equal(text(element(content, "strong").inner), "書類");
  getTag(content, "a", { href: "/guide" });
  getTag(content, "input", { id: "agree-card", type: "checkbox" });
  getTag(content, "button", { type: "button" });
  assert.equal(
    matchingTags(content, "p", { class: "dads-card__text" }).length,
    0,
  );
});

test("Card: props-free tag usage renders children without a heading", async () => {
  const html = await harness.renderSource(`<script>
    import Card from '../src/lib/components/Card.svelte';
</script>
<Card>hoge</Card>`);
  assert.equal(
    text(element(html, "div", { class: "dads-card__content" }).inner),
    "hoge",
  );
  assert.equal(tags(html, "h2").length, 0);
  assert.equal(tags(html, "p").length, 0);
});

test("Card: an empty title preserves arbitrary child markup and components", async () => {
  const html = await harness.renderSource(`<script lang="ts">
    import Card from '../src/lib/components/Card.svelte';
    import Checkbox from '../src/lib/components/Checkbox.svelte';
</script>
<Card title="" id="children-card">
    <p>必要な<strong>書類</strong></p>
    <Checkbox id="child-agree" label="確認しました" />
    <button type="button">申請する</button>
</Card>`);
  const content = element(html, "div", { class: "dads-card__content" }).inner;
  assert.equal(tags(html, "h2").length, 0);
  assert.equal(text(element(content, "strong").inner), "書類");
  getTag(content, "input", { id: "child-agree", type: "checkbox" });
  getTag(content, "button", { type: "button" });
  assert.equal(
    getTag(html, "div", { id: "children-card" }).attributes.children,
    undefined,
  );
});

test("Card: explicit content overrides children, including an empty string", async () => {
  for (const [attribute, expected] of [
    ['content="props本文"', "props本文"],
    ["content={body}", "snippet本文"],
    ['content=""', ""],
    ["content={undefined}", "子要素本文"],
  ]) {
    const html = await harness.renderSource(`<script>
    import Card from '../src/lib/components/Card.svelte';
</script>
{#snippet body()}<p>snippet本文</p>{/snippet}
<Card ${attribute}>子要素本文</Card>`);
    assert.equal(
      text(element(html, "div", { class: "dads-card" }).inner),
      expected,
    );
    assert.equal(
      matchingTags(html, "div", { class: "dads-card__content" }).length,
      expected ? 1 : 0,
    );
  }
});

test("Card: all documented Svelte examples compile for client/server and render", async () => {
  const document = await readFile(
    new URL("../docs/Card.md", import.meta.url),
    "utf8",
  );
  const examples = [...document.matchAll(/```svelte\n([\s\S]*?)```/g)];
  assert.equal(examples.length, 4);
  for (const [, source] of examples) {
    const html = await harness.renderSource(
      source.replace(
        /import\s+\{[^}]*\}\s+from\s+['"]@sharelib-jp\/digital-agency-components-svelte-implements['"];?/g,
        "import Card from '../src/lib/components/Card.svelte';",
      ),
    );
    getTag(html, "div", { class: "dads-card" });
  }
});
