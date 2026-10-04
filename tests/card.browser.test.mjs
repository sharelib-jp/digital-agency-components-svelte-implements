import { browserTest } from "./browser-test-helpers.mjs";

const harnessSource = `<script>
    import Card from '../src/lib/components/Card.svelte';
    import '../src/lib/global.css';
    let title = 'お知らせ';
    let content = '初期本文';
    let headingLevel = 'h2';
    let rich = false;
    let count = 0;
    let childTitle = '';
    let childText = 'hoge';
    let childContent = 'props本文';
    let childOverride = false;
    export function snapshot() { return { count }; }
    export function setState(patch) {
        if (Object.hasOwn(patch, 'title')) title = patch.title;
        if (Object.hasOwn(patch, 'content')) content = patch.content;
        if (Object.hasOwn(patch, 'headingLevel')) headingLevel = patch.headingLevel;
        if (Object.hasOwn(patch, 'rich')) rich = patch.rich;
        if (Object.hasOwn(patch, 'childTitle')) childTitle = patch.childTitle;
        if (Object.hasOwn(patch, 'childText')) childText = patch.childText;
        if (Object.hasOwn(patch, 'childContent')) childContent = patch.childContent;
        if (Object.hasOwn(patch, 'childOverride')) childOverride = patch.childOverride;
    }
</script>

{#snippet body()}
    <p id="rich-text">{content}</p>
    <button id="card-action" type="button" on:click={() => count += 1}>確認しました</button>
    <p id="card-count">確認回数: {count}</p>
{/snippet}

<section style="width: 240px; max-width: 100%;">
    <Card id="card" {title} {headingLevel} content={rich ? body : content} />
    <Card id="child-card" title={childTitle} content={childOverride ? childContent : undefined}>
        <p id="child-text">{childText}</p>
        <button id="child-action" type="button" on:click={() => count += 1}>確認する</button>
        <p id="child-count">確認回数: {count}</p>
    </Card>
</section>`;

browserTest(
  "Card browser behavior",
  harnessSource,
  async (t, page, runCase) => {
    await runCase(
      "Card: parent prop updates change content, headings and empty regions",
      async () => {
        await page.expect(
          "document.querySelector('#card h2')?.textContent",
          "お知らせ",
        );
        await page.expect(
          "document.querySelector('#card .dads-card__text')?.textContent",
          "初期本文",
        );
        await page.setState({ title: "", content: "" });
        await page.expect(
          "document.querySelector('#card .dads-card__title') === null",
          true,
        );
        await page.expect(
          "document.querySelector('#card .dads-card__content') === null",
          true,
        );
        await page.setState({
          title: "更新した見出し",
          content: "<strong>更新した本文</strong>",
          headingLevel: "h3",
        });
        await page.expect(
          "document.querySelector('#card h3')?.textContent",
          "更新した見出し",
        );
        await page.expect(
          "document.querySelector('#card .dads-card__text')?.textContent",
          "<strong>更新した本文</strong>",
        );
        await page.expect(
          "document.querySelector('#card strong') === null",
          true,
        );
        await page.setState({ content: "x".repeat(300) });
        await page.expect(
          "document.querySelector('#card').scrollWidth <= document.querySelector('#card').clientWidth",
          true,
        );
      },
    );

    await runCase(
      "Card: Snippet props preserve parent reactivity and native button interaction",
      async () => {
        await page.setState({ rich: true });
        await page.expect(
          "document.querySelector('#rich-text')?.textContent",
          "初期本文",
        );
        await page.click("#card-action");
        await page.expect("window.harness.snapshot().count", 1);
        await page.expect(
          "document.querySelector('#card-count')?.textContent",
          "確認回数: 1",
        );
        await page.setState({ content: "更新したsnippet本文" });
        await page.expect(
          "document.querySelector('#rich-text')?.textContent",
          "更新したsnippet本文",
        );
        await page.setState({ rich: false });
        await page.expect(
          "document.querySelector('#card-action') === null",
          true,
        );
        await page.expect(
          "document.querySelector('#card .dads-card__text')?.textContent",
          "更新したsnippet本文",
        );
      },
    );

    await runCase(
      "Card: tag children remain reactive, respect empty titles and explicit content",
      async () => {
        await page.expect(
          "document.querySelector('#child-card .dads-card__title') === null",
          true,
        );
        await page.expect(
          "document.querySelector('#child-text')?.textContent",
          "hoge",
        );
        await page.click("#child-action");
        await page.expect(
          "document.querySelector('#child-count')?.textContent",
          "確認回数: 1",
        );
        await page.setState({
          childText: "更新した子要素",
          childTitle: "子要素の見出し",
        });
        await page.expect(
          "document.querySelector('#child-text')?.textContent",
          "更新した子要素",
        );
        await page.expect(
          "document.querySelector('#child-card h2')?.textContent",
          "子要素の見出し",
        );
        await page.setState({ childTitle: "" });
        await page.expect(
          "document.querySelector('#child-card .dads-card__title') === null",
          true,
        );
        await page.expect(
          "document.querySelector('#child-card').children.length",
          1,
        );
        await page.setState({ childOverride: true });
        await page.expect(
          "document.querySelector('#child-card .dads-card__text')?.textContent",
          "props本文",
        );
        await page.expect(
          "document.querySelector('#child-text') === null",
          true,
        );
        await page.setState({ childContent: "" });
        await page.expect(
          "document.querySelector('#child-card .dads-card__content') === null",
          true,
        );
        await page.setState({ childOverride: false });
        await page.expect(
          "document.querySelector('#child-text')?.textContent",
          "更新した子要素",
        );
        await page.expect(
          "document.querySelector('#child-count')?.textContent",
          "確認回数: 1",
        );
      },
    );
  },
);
