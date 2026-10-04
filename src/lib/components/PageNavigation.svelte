<script context="module" lang="ts">
    export type PageNavigationType = 'text' | 'outline' | 'arrow';
    export type PageNavigationSize = 'lg' | 'md' | 'sm' | 'xs';

    export interface PageNavigationChangeDetail {
        currentPage: number;
        previousPage: number;
        direction: 'prev' | 'next';
        originalEvent: MouseEvent;
    }
</script>

<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    /** 前後コントロールの外観（テキスト・枠付き・円形矢印）。既定値: 'text'。 */
    export let type: PageNavigationType = 'text';
    /** 前後コントロールのサイズ。未指定時はtypeがtextならmd、それ以外ならlgを使う。 */
    export let size: PageNavigationSize | undefined = undefined;
    /** 現在ページ。範囲内の整数へ補正され、ボタン操作時の更新をbind:currentPageで受け取る。既定値: 1。 */
    export let currentPage: number = 1;
    /** 総ページ数。内部で非負の安全な整数に補正し、0／1ページなら全体を描画しない。既定値: 1。 */
    export let totalPages: number = 1;
    /** 前後コントロールを無効にする。表示中のカウンターは残る。既定値: false。 */
    export let disabled: boolean = false;
    /** 外側のnavのaria-label。カウンターの接頭辞ではない。既定値: 'ページ'。 */
    export let label: string = 'ページ';
    /** 前のページの文言。矢印型では視覚的に非表示のラベル。既定値: '前のページ'。 */
    export let previousLabel: string = '前のページ';
    /** 次のページの文言。矢印型では視覚的に非表示のラベル。既定値: '次のページ'。 */
    export let nextLabel: string = '次のページ';
    /** 対象ページ番号からURLを返す関数。指定時はリンク方式となり、操作でcurrentPageを更新しない。既定値: undefined。 */
    export let hrefForPage: ((page: number) => string) | undefined = undefined;

    const dispatch = createEventDispatcher<{ change: PageNavigationChangeDetail }>();

    $: pageCount = Number.isFinite(totalPages)
        ? Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, Math.trunc(totalPages)))
        : 0;
    $: {
        const normalized =
            pageCount === 0
                ? 0
                : Math.min(
                      pageCount,
                      Math.max(1, Number.isFinite(currentPage) ? Math.trunc(currentPage) : 1),
                  );
        if (currentPage !== normalized) currentPage = normalized;
    }
    $: buttonSize = size ?? (type === 'text' ? 'md' : 'lg');
    $: buttonClass = type === 'arrow' ? 'dads-page-navigation__arrow-button' : 'dads-button';

    function navigate(event: MouseEvent, direction: 'prev' | 'next') {
        if (disabled) {
            event.preventDefault();
            return;
        }
        if (
            event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
        )
            return;
        const nextPage = currentPage + (direction === 'prev' ? -1 : 1);
        if (nextPage < 1 || nextPage > pageCount) {
            event.preventDefault();
            return;
        }
        if (
            !dispatch(
                'change',
                { currentPage: nextPage, previousPage: currentPage, direction, originalEvent: event },
                { cancelable: true },
            )
        ) {
            event.preventDefault();
            return;
        }
        // A link reflects the page being displayed until its destination is loaded.
        if (!hrefForPage) currentPage = nextPage;
    }
</script>

{#if pageCount > 1}
    <nav class="dads-page-navigation" aria-label={label}>
        {#each ['prev', 'counter', 'next'] as control}
            {#if control === 'counter'}
                <span class="dads-page-navigation__counter" aria-live="polite" aria-atomic="true">{currentPage} / {pageCount.toLocaleString('ja-JP')}</span>
            {:else if control === 'prev' ? currentPage > 1 : currentPage < pageCount}
                {@const direction = control === 'prev' ? 'prev' : 'next'}
                {@const controlLabel = direction === 'prev' ? previousLabel : nextLabel}
                {@const targetPage = currentPage + (direction === 'prev' ? -1 : 1)}
                <svelte:element
                    this={hrefForPage ? 'a' : 'button'}
                    role={hrefForPage ? 'link' : 'button'}
                    class={buttonClass}
                    type={hrefForPage ? undefined : 'button'}
                    href={hrefForPage && !disabled ? hrefForPage(targetPage) : undefined}
                    disabled={hrefForPage ? undefined : disabled}
                    aria-disabled={disabled ? 'true' : undefined}
                    tabindex={disabled ? -1 : undefined}
                    data-type={type === 'arrow' ? undefined : type}
                    data-size={buttonSize}
                    data-control={direction}
                    on:click={(event: MouseEvent) => navigate(event, direction)}
                >
                    {#if direction === 'next' && type !== 'arrow'}{controlLabel}{/if}
                    <svg class="dads-button__icon" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
                        <path d={direction === 'prev' ? 'm7.9 12 8-8-1.4-1.4L5.1 12l9.4 9.4 1.4-1.4z' : 'M9 2.6 7.6 4l8 8-8 8L9 21.4l9.4-9.4z'} fill="currentcolor" />
                    </svg>
                    {#if type === 'arrow'}
                        <span class="dads-u-visually-hidden">{controlLabel}</span>
                    {:else if direction === 'prev'}
                        {controlLabel}
                    {/if}
                </svelte:element>
            {/if}
        {/each}
    </nav>
{/if}

<style>
    .dads-page-navigation {
        display: flex;
        align-items: center;
        gap: calc(16 / 16 * 1rem);
        color: var(--color-neutral-solid-gray-800);
        font-weight: normal;
        font-size: calc(16 / 16 * 1rem);
        line-height: 1;
        font-family: var(--font-family-sans);
        letter-spacing: 0.02em;
    }

    .dads-page-navigation__counter {
        min-width: calc(60 / 16 * 1rem);
        color: var(--color-neutral-solid-gray-900);
        font-size: calc(16 / 16 * 1rem);
        line-height: 1;
        letter-spacing: 0.02em;
        text-align: center;
        white-space: nowrap;
    }

    .dads-button[data-type='text'][data-control='prev'] {
        padding-left: calc(8 / 16 * 1rem);
    }

    .dads-button[data-type='text'][data-control='next'] {
        padding-right: calc(8 / 16 * 1rem);
    }

    .dads-button[data-type='outline'][data-control='prev'] {
        padding-right: calc(24 / 16 * 1rem);
    }

    .dads-button[data-type='outline'][data-control='next'] {
        padding-left: calc(24 / 16 * 1rem);
    }

    .dads-page-navigation__arrow-button {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        box-sizing: border-box;
        border: 1px solid;
        border-radius: 50%;
        background-color: var(--color-neutral-white);
        padding: 0;
        color: var(--color-key-1000);
        cursor: pointer;
    }

    .dads-page-navigation__arrow-button[data-size='lg'] {
        width: calc(44 / 16 * 1rem);
        height: calc(44 / 16 * 1rem);
    }

    .dads-page-navigation__arrow-button[data-size='lg'] svg {
        width: calc(24 / 16 * 1rem);
        height: calc(24 / 16 * 1rem);
    }

    .dads-page-navigation__arrow-button[data-size='md'] {
        position: relative;
        width: calc(32 / 16 * 1rem);
        height: calc(32 / 16 * 1rem);
    }

    .dads-page-navigation__arrow-button[data-size='md']::after,
    .dads-page-navigation__arrow-button[data-size='sm']::after,
    .dads-page-navigation__arrow-button[data-size='xs']::after {
        content: '';
        position: absolute;
        inset: -100%;
        margin: auto;
        width: calc(44 / 16 * 1rem);
        height: calc(44 / 16 * 1rem);
    }

    .dads-page-navigation__arrow-button[data-size='md'] svg {
        width: calc(20 / 16 * 1rem);
        height: calc(20 / 16 * 1rem);
    }

    .dads-page-navigation__arrow-button[data-size='sm'] {
        position: relative;
        width: calc(24 / 16 * 1rem);
        height: calc(24 / 16 * 1rem);
    }

    .dads-page-navigation__arrow-button[data-size='xs'] {
        position: relative;
        width: calc(20 / 16 * 1rem);
        height: calc(20 / 16 * 1rem);
    }

    .dads-page-navigation__arrow-button[data-size='sm'] svg,
    .dads-page-navigation__arrow-button[data-size='xs'] svg {
        width: calc(16 / 16 * 1rem);
        height: calc(16 / 16 * 1rem);
    }

    @media (hover: hover) {
        .dads-page-navigation__arrow-button:not([aria-disabled='true']):any-link:hover,
        .dads-page-navigation__arrow-button:enabled:hover {
            border-width: 3px;
            background-color: var(--color-key-200);
        }

        .dads-page-navigation__arrow-button[data-size='sm']:not([aria-disabled='true']):any-link:hover,
        .dads-page-navigation__arrow-button[data-size='sm']:enabled:hover,
        .dads-page-navigation__arrow-button[data-size='xs']:not([aria-disabled='true']):any-link:hover,
        .dads-page-navigation__arrow-button[data-size='xs']:enabled:hover {
            border-width: 2px;
        }
    }

    .dads-page-navigation__arrow-button:not([aria-disabled='true']):any-link:active,
    .dads-page-navigation__arrow-button:enabled:active {
        background-color: var(--color-key-300);
        color: var(--color-key-1200);
    }

    .dads-page-navigation__arrow-button:focus-visible {
        outline: calc(4 / 16 * 1rem) solid var(--color-neutral-black);
        outline-offset: calc(2 / 16 * 1rem);
        box-shadow: 0 0 0 calc(2 / 16 * 1rem) var(--color-primitive-yellow-300);
    }

    .dads-button {
        --button-color: var(--color-key-900);
        --button-hover-color: var(--color-key-1000);
        --button-active-color: var(--color-key-1200);
        --button-outline-hover-bg-color: var(--color-key-200);
        --button-outline-active-bg-color: var(--color-key-300);
        display: flex;
        align-items: center;
        justify-content: center;
        column-gap: calc(4 / 16 * 1rem);
        box-sizing: border-box;
        width: fit-content;
        max-width: 100%;
        font-weight: bold;
        font-size: calc(16 / 16 * 1rem);
        line-height: 1;
        font-family: var(--font-family-sans);
        letter-spacing: 0.02em;
        text-decoration: none;
        text-underline-offset: calc(3 / 16 * 1rem);
        cursor: pointer;
    }

    .dads-button[data-type='outline'] {
        border: 1px solid currentcolor;
        background-color: var(--color-neutral-white);
        color: var(--button-color);
    }

    .dads-button[data-type='text'] {
        border: 0;
        background-color: transparent;
        color: var(--button-color);
        text-decoration: underline;
        text-decoration-thickness: calc(1 / 16 * 1rem);
    }

    @media (hover: hover) {
        .dads-button[data-type='outline']:where(:not(:disabled):not([aria-disabled='true'])):hover {
            background-color: var(--button-outline-hover-bg-color);
            color: var(--button-hover-color);
            text-decoration: underline;
            text-decoration-thickness: calc(1 / 16 * 1rem);
        }

        .dads-button[data-type='text']:where(:not(:disabled):not([aria-disabled='true'])):hover {
            background-color: var(--color-key-50);
            color: var(--button-hover-color);
            text-decoration-thickness: calc(3 / 16 * 1rem);
        }
    }

    .dads-button[data-type='outline']:where(:not(:disabled):not([aria-disabled='true'])):active {
        background-color: var(--button-outline-active-bg-color);
        color: var(--button-active-color);
        text-decoration: underline;
    }

    .dads-button[data-type='text']:where(:not(:disabled):not([aria-disabled='true'])):active {
        background-color: var(--color-key-100);
        color: var(--button-active-color);
    }

    .dads-button:focus-visible {
        outline: calc(4 / 16 * 1rem) solid var(--color-neutral-black);
        outline-offset: calc(2 / 16 * 1rem);
        box-shadow: 0 0 0 calc(2 / 16 * 1rem) var(--color-primitive-yellow-300);
    }

    .dads-button[data-type='text']:focus-visible {
        background-color: var(--color-primitive-yellow-300);
    }

    .dads-button[data-type='outline']:disabled,
    .dads-button[data-type='outline'][aria-disabled='true'] {
        background-color: var(--color-neutral-white);
        color: var(--color-neutral-solid-gray-300);
        text-decoration: none;
    }

    .dads-button[data-type='text']:disabled,
    .dads-button[data-type='text'][aria-disabled='true'] {
        background-color: transparent;
        color: var(--color-neutral-solid-gray-300);
        text-decoration-thickness: revert;
    }

    .dads-page-navigation__arrow-button:disabled,
    .dads-page-navigation__arrow-button[aria-disabled='true'] {
        color: var(--color-neutral-solid-gray-300);
    }

    .dads-button:disabled,
    .dads-button[aria-disabled='true'],
    .dads-page-navigation__arrow-button:disabled,
    .dads-page-navigation__arrow-button[aria-disabled='true'] {
        cursor: default;
    }

    .dads-button[data-size='lg'] {
        min-width: calc(136 / 16 * 1rem);
        min-height: calc(56 / 16 * 1rem);
        border-radius: calc(8 / 16 * 1rem);
        padding: calc(12 / 16 * 1rem) calc(16 / 16 * 1rem);
    }

    .dads-button[data-size='md'] {
        min-width: calc(96 / 16 * 1rem);
        min-height: calc(48 / 16 * 1rem);
        border-radius: calc(8 / 16 * 1rem);
        padding: calc(8 / 16 * 1rem) calc(16 / 16 * 1rem);
    }

    .dads-button[data-size='sm'] {
        position: relative;
        min-width: calc(80 / 16 * 1rem);
        min-height: calc(36 / 16 * 1rem);
        border-radius: calc(6 / 16 * 1rem);
        padding: calc(2 / 16 * 1rem) calc(12 / 16 * 1rem);
    }

    .dads-button[data-size='xs'] {
        position: relative;
        min-width: calc(72 / 16 * 1rem);
        min-height: calc(28 / 16 * 1rem);
        border-radius: calc(4 / 16 * 1rem);
        padding: calc(2 / 16 * 1rem) calc(8 / 16 * 1rem);
        font-size: calc(14 / 16 * 1rem);
    }

    .dads-button[data-size='sm']::after,
    .dads-button[data-size='xs']::after {
        content: '';
        position: absolute;
        inset: 0;
        margin: auto;
        height: calc(44 / 16 * 1rem);
    }

    .dads-button__icon {
        flex-shrink: 0;
    }

    .dads-u-visually-hidden {
        clip: rect(0 0 0 0);
        clip-path: inset(50%);
        height: calc(1 / 16 * 1rem);
        overflow: hidden;
        position: absolute;
        white-space: nowrap;
        width: calc(1 / 16 * 1rem);
    }

    @media (forced-colors: active) {
        .dads-button:disabled,
        .dads-button[aria-disabled='true'],
        .dads-page-navigation__arrow-button:disabled,
        .dads-page-navigation__arrow-button[aria-disabled='true'] {
            border-color: GrayText;
            color: GrayText;
        }
    }
</style>
