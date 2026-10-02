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

    export let src: string;
    export let alt: string;
    export let srcset: string | undefined = undefined;
    export let sizes: string | undefined = undefined;
    export let width: number | undefined = undefined;
    export let height: number | undefined = undefined;
    export let sources: ImageSource[] = [];
    export let loading: 'eager' | 'lazy' | undefined = undefined;
    export let decoding: 'async' | 'sync' | 'auto' = 'auto';
    export let type: 'border' | 'borderless' | 'link' = 'border';
    export let fullWidth: boolean = false;
    export let caption: string | null = null;
    export let captionStyle: 'dashed' | 'solid' = 'dashed';
    export let href: string | undefined = undefined;
    export let target: HTMLAnchorAttributes['target'] = undefined;
    export let rel: string | undefined = undefined;
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
