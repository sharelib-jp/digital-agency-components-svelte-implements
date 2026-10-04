<script context="module" lang="ts">
    export interface ImageSource {
        srcset: string;
        media?: string;
        type?: string;
        sizes?: string;
        width?: number;
        height?: number;
    }
</script>

<script lang="ts">
    import type { HTMLAnchorAttributes } from 'svelte/elements';

    /** 必須のimgの画像URL。sources使用時もフォールバックとして必要です。 */
    export let src: string;
    /** 必須の代替テキスト。装飾画像は空文字列、リンク画像はリンクの目的が分かる内容を指定します。 */
    export let alt: string;
    /** imgのsrcset属性。候補画像と幅・解像度を指定します。既定値: undefined。 */
    export let srcset: string | undefined = undefined;
    /** imgのsizes属性。srcsetの幅記述子と組み合わせて表示幅を指定します。既定値: undefined。 */
    export let sizes: string | undefined = undefined;
    /** imgのwidth属性。heightと実画像の比率に合わせると、読み込み前の領域を確保できます。既定値: undefined。 */
    export let width: number | undefined = undefined;
    /** imgのheight属性。widthと実画像の比率に合わせて指定します。既定値: undefined。 */
    export let height: number | undefined = undefined;
    /** レスポンシブ画像の候補。非空ならpictureを生成し、配列順にsourceを配置します。既定値: []。 */
    export let sources: ImageSource[] = [];
    /** imgのloading属性（読み込み方式）。未指定時は属性を付けません。既定値: undefined。 */
    export let loading: 'eager' | 'lazy' | undefined = undefined;
    /** imgのdecoding属性（デコード方式）。既定値: 'auto'。 */
    export let decoding: 'async' | 'sync' | 'auto' = 'auto';
    /** 枠付き・枠なし・リンク付きの表示。linkでは画像領域をa要素にします。既定値: 'border'。 */
    export let type: 'border' | 'borderless' | 'link' = 'border';
    /** figureと画像を親領域の幅いっぱいにします。小さい画像も拡大します。既定値: false。 */
    export let fullWidth: boolean = false;
    /** キャプションのテキスト。captionスロットが優先され、propが空でスロットもなければ非表示です。既定値: null。 */
    export let caption: string | null = null;
    /** キャプションを囲む線のスタイル。既定値: 'dashed'。 */
    export let captionStyle: 'dashed' | 'solid' = 'dashed';
    /** 内部a要素のhref属性。typeがlinkの場合だけ使い、有効なリンク先を指定します。既定値: undefined。 */
    export let href: string | undefined = undefined;
    /** 内部a要素のtarget属性（リンク先の表示先）。typeがlinkの場合だけ使います。既定値: undefined。 */
    export let target: HTMLAnchorAttributes['target'] = undefined;
    /** 内部a要素のrel属性。typeがlinkの場合だけ使い、targetが'_blank'ならnoopener noreferrerを追加します。既定値: undefined。 */
    export let rel: string | undefined = undefined;
    /** ルートのfigureのclass属性に追加するCSSクラス。大文字のCで指定します。既定値: ''。 */
    export let Class: string = '';

    $: linkRel = target === '_blank' ? `${rel ?? ''} noopener noreferrer`.trim() : rel;
</script>

<figure
    {...$$restProps}
    class={`dads-image ${Class}`.trim()}
    data-full-width={fullWidth ? '' : undefined}
>
    <svelte:element
        this={type === 'link' ? 'a' : 'div'}
        class="dads-image__image-area"
        data-bordered={type === 'border' ? '' : undefined}
        href={type === 'link' ? href : undefined}
        target={type === 'link' ? target : undefined}
        rel={type === 'link' ? linkRel : undefined}
    >
        {#if sources.length}
            <picture>
                {#each sources as source}
                    <source
                        srcset={source.srcset}
                        media={source.media}
                        type={source.type}
                        sizes={source.sizes}
                        width={source.width}
                        height={source.height}
                    />
                {/each}
                <img
                    class="dads-image__img"
                    {src}
                    {srcset}
                    {sizes}
                    {alt}
                    {width}
                    {height}
                    {loading}
                    {decoding}
                    on:load
                    on:error
                />
            </picture>
        {:else}
            <img
                class="dads-image__img"
                {src}
                {srcset}
                {sizes}
                {alt}
                {width}
                {height}
                {loading}
                {decoding}
                on:load
                on:error
            />
        {/if}
    </svelte:element>
    {#if caption || $$slots.caption}
        <figcaption class="dads-image__caption" data-style={captionStyle}>
            <slot name="caption">{caption}</slot>
        </figcaption>
    {/if}
</figure>

<style>
    .dads-image {
        margin: 0;
        width: fit-content;
    }

    .dads-image[data-full-width] {
        width: 100%;
    }

    .dads-image[data-full-width] .dads-image__img {
        width: 100%;
    }

    .dads-image__image-area {
        display: block;
    }

    .dads-image__image-area[data-bordered] {
        outline: 1px solid var(--color-neutral-solid-gray-420);
        outline-offset: -1px;
    }

    .dads-image__image-area:any-link {
        outline: 1px solid var(--color-primitive-blue-900);
        outline-offset: -1px;
    }

    @media (hover: hover) {
        .dads-image__image-area:any-link:hover {
            outline-width: 4px;
            outline-offset: -4px;
        }
    }

    .dads-image__image-area:any-link:focus-visible {
        outline: calc(4 / 16 * 1rem) solid var(--color-neutral-black);
        outline-offset: calc(2 / 16 * 1rem);
        box-shadow: 0 0 0 calc(2 / 16 * 1rem) var(--color-primitive-yellow-300);
    }

    .dads-image__img {
        display: block;
        max-width: 100%;
        height: auto;
    }

    .dads-image__caption {
        margin: calc(8 / 16 * 1rem) 0 0;
        contain: inline-size;
        padding: calc(8 / 16 * 1rem) calc(24 / 16 * 1rem);
        color: var(--color-neutral-solid-gray-900);
        font-family: var(--font-family-sans);
        font-weight: normal;
        font-size: calc(16 / 16 * 1rem);
        line-height: 1.7;
        letter-spacing: 0.02em;
    }

    .dads-image__caption[data-style='dashed'] {
        border: 1px dashed var(--color-neutral-solid-gray-700);
    }

    .dads-image__caption[data-style='solid'] {
        border: 1px solid var(--color-neutral-solid-gray-420);
    }
</style>
