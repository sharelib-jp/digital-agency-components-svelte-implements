<script lang="ts">
    import type { Snippet } from 'svelte';

    /** カードの見出し。空文字列なら見出しを表示しません。既定値: ''。 */
    export let title: string = '';
    /** 中身の文字列または引数なしのSnippet。未指定なら子要素を表示し、空文字列なら中身を非表示にします。文字列はHTMLとして解釈しません。既定値: undefined。 */
    export let content: string | Snippet | undefined = undefined;
    /** <Card>...</Card> の子要素。contentが未指定の場合に表示します。既定値: undefined。 */
    export let children: Snippet | undefined = undefined;
    /** 文書の階層に合わせる見出し要素。表示サイズとは独立。既定値: 'h2'。 */
    export let headingLevel: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' = 'h2';
    /** ルートのdiv要素のID。既定値: undefined。 */
    export let id: string | undefined = undefined;
    /** ルートのHTML class属性に追加するクラス。大文字のCで指定します。既定値: ''。 */
    export let Class: string = '';

    $: resolvedContent = content === undefined ? children : content;
</script>

<div {...$$restProps} {id} class={`dads-card ${Class}`.trim()}>
    {#if title}
        <svelte:element this={headingLevel} class="dads-card__title">{title}</svelte:element>
    {/if}
    {#if resolvedContent}
        <div class="dads-card__content">
            {#if typeof resolvedContent === 'string'}
                <p class="dads-card__text">{resolvedContent}</p>
            {:else}
                {@render resolvedContent()}
            {/if}
        </div>
    {/if}
</div>

<style>
    .dads-card {
        display: grid;
        align-content: start;
        gap: calc(16 / 16 * 1rem);
        box-sizing: border-box;
        min-width: 0;
        width: 100%;
        max-width: 100%;
        border: 1px solid var(--color-neutral-solid-gray-420);
        border-radius: calc(16 / 16 * 1rem);
        background-color: var(--color-neutral-white);
        padding: calc(24 / 16 * 1rem);
        color: var(--color-neutral-solid-gray-800);
        font-weight: normal;
        font-size: calc(16 / 16 * 1rem);
        line-height: 1.7;
        font-family: var(--font-family-sans);
        letter-spacing: 0.02em;
        overflow-wrap: anywhere;
    }

    .dads-card__title {
        margin: 0;
        min-width: 0;
        font-weight: bold;
        font-size: calc(20 / 16 * 1rem);
        line-height: 1.5;
    }

    .dads-card__content {
        display: grid;
        gap: calc(12 / 16 * 1rem);
        min-width: 0;
    }

    .dads-card__content > :global(*) {
        margin-top: 0;
        margin-bottom: 0;
    }

    .dads-card__text {
        margin: 0;
        white-space: pre-line;
    }

    @media (forced-colors: active) {
        .dads-card {
            border-color: CanvasText;
            background-color: Canvas;
            color: CanvasText;
        }
    }
</style>
