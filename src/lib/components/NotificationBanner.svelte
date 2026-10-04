<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    type NotificationType = 'success' | 'error' | 'warning' | 'info-1' | 'info-2';

    /** ルートのdiv要素のID。既定値: undefined。 */
    export let id: string | undefined = undefined;
    /** ルートのHTML class属性に追加するクラス。大文字のCで指定。既定値: ''。 */
    export let Class: string = '';
    /** 通知種別。アイコン・配色・未指定時のroleを決める。既定値: 'info-1'。 */
    export let type: NotificationType = 'info-1';
    /** 囲み枠・左側カラーチップの外観。CSSのstyle文字列ではない。既定値: 'standard'。 */
    export let style: 'standard' | 'color-chip' = 'standard';
    /** 表示状態。bind:open対応。falseではバナーをDOMから取り除く。既定値: true。 */
    export let open: boolean = true;
    /** 組み込みの閉じるボタンを表示する。slotのclose()は無効化しない。既定値: true。 */
    export let dismissible: boolean = true;
    /** 閉じるボタンの外観。mobile-compactは画面幅での自動切り替えではない。既定値: 'standard'。 */
    export let closeButton: 'standard' | 'mobile-compact' = 'standard';
    /** 閉じるボタンのaria-label。通常形式では表示テキストにも使う。既定値: '閉じる'。 */
    export let closeLabel: string = '閉じる';
    /** h2の見出しテキスト。heading slotが優先される。既定値: 'お知らせ'。 */
    export let heading: string = 'お知らせ';
    /** 本文。デフォルトslot未指定時、空でなければp要素で表示。既定値: ''。 */
    export let message: string = '';
    /** 表示用の日時。空文字なら時刻を表示しない。既定値: ''。 */
    export let timestamp: string = '';
    /** time要素の機械可読なdatetime属性。timestampと組み合わせて指定。既定値: undefined。 */
    export let datetime: string | undefined = undefined;
    /** ルートのrole。未指定時はerror／warningでalert、それ以外でstatusを使う。 */
    export let role: 'status' | 'alert' | undefined = undefined;
    /** ルートのaria-live属性。未指定なら属性を付けず、roleの暗黙の通知特性を使う。既定値: undefined。 */
    export let ariaLive: 'off' | 'polite' | 'assertive' | undefined = undefined;

    const dispatch = createEventDispatcher<{ close: undefined }>();
    const iconLabels: Record<NotificationType, string> = {
        success: '成功',
        error: 'エラー',
        warning: '警告',
        'info-1': 'インフォメーション',
        'info-2': 'インフォメーション',
    };

    $: bannerRole = role ?? (type === 'error' || type === 'warning' ? 'alert' : 'status');

    function close() {
        if (!open) return;
        open = false;
        dispatch('close');
    }
</script>

{#if open}
    <div
        {id}
        class={`dads-notification-banner ${Class}`}
        data-style={style}
        data-type={type}
        role={bannerRole}
        aria-live={ariaLive}
    >
        <h2 class="dads-notification-banner__heading">
            <svg class="dads-notification-banner__icon" width="24" height="24" viewBox="0 0 24 24" role="img" aria-label={iconLabels[type]}>
                {#if type === 'success'}
                    <circle cx="12" cy="12" r="10" fill="currentcolor" />
                    <path d="m17.6 9.6-7 7-4.3-4.3L7.7 11l2.9 2.9 5.7-5.6 1.3 1.4Z" fill="Canvas" />
                {:else if type === 'error'}
                    <path d="M8.25 21 3 15.75v-7.5L8.25 3h7.5L21 8.25v7.5L15.75 21h-7.5Z" fill="currentcolor" />
                    <path d="m12 13.4-2.85 2.85-1.4-1.4L10.6 12 7.75 9.15l1.4-1.4L12 10.6l2.85-2.85 1.4 1.4L13.4 12l2.85 2.85-1.4 1.4L12 13.4Z" fill="Canvas" />
                {:else if type === 'warning'}
                    <path d="M1 21 12 2l11 19H1Z" fill="currentcolor" />
                    <path d="M13 15h-2v-5h2v5Z" fill="Canvas" />
                    <circle cx="12" cy="17" r="1" fill="Canvas" />
                {:else}
                    <circle cx="12" cy="12" r="10" fill="currentcolor" />
                    <circle cx="12" cy="8" r="1" fill="Canvas" />
                    <path d="M11 11h2v6h-2z" fill="Canvas" />
                {/if}
            </svg>
            <span class="dads-notification-banner__heading-text"><slot name="heading">{heading}</slot></span>
        </h2>
        {#if dismissible}
            {#if closeButton === 'mobile-compact'}
                <button class="dads-notification-banner__mobile-close" type="button" aria-label={closeLabel} on:click={close}>
                    <svg class="dads-notification-banner__mobile-close-icon" width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
                        <path d="m13 26-2-2 9-9-9-9 2-2 9 9 9-9 2 2-9 9 9 9-2 2-9-9-9 9ZM11.8 30v3.6H9v5.3H8V30h3.8ZM9 32.1v.7h1.7V32H9Zm0-.7h1.7v-.6H9v.6ZM16.4 30v7.6c0 .5 0 1-.5 1.1-.4.2-1 .2-2 .2 0-.3-.1-.7-.3-1h1.5c.2 0 .2-.1.2-.3v-4h-2.8V30h4Zm-2.8 2.1v.7h1.7v-.7h-1.7Zm0-1.3v.6h1.7v-.6h-1.7ZM13.3 34.6h1.4v.9h-1.4v2.2c0 .5 0 .7-.4.8-.3.2-.7.2-1.3.2l-.3-.9h.9l.1-.1v-1.5a8 8 0 0 1-2.3 1.9l-.6-.8c1-.4 1.8-1 2.5-1.8H9.7v-1h2.6v-.7h1v.8ZM23 31l1 1.6-.9.4c-.2-.6-.5-1.1-.9-1.6l.8-.3Zm1.3-.5 1 1.6-.8.4-1-1.6.8-.4Zm-4-.3c-.2 2-.1 4-.2 6 0 .3 0 .6.2.8.3.4.7.5 1.3.5 1.7 0 2.7-1 3.4-2l.9 1a5.3 5.3 0 0 1-4.3 2.2c-1 0-2-.3-2.3-1-.3-.3-.3-.6-.3-1.2v-6.3h1.4ZM28.8 30.5H31a60.3 60.3 0 0 0 2.8-.1l.6.8c-1.1.6-2 1.5-3 2.3l1-.1c1.5 0 3 .9 3 2.4 0 1.1-.6 2-1.6 2.4-.5.3-1.2.4-2 .4-1 0-2.3-.4-2.3-1.6 0-.9.8-1.5 1.7-1.5a2 2 0 0 1 2.1 2l-1 .2c0-.7-.4-1.3-1.1-1.3-.3 0-.7.2-.7.5 0 .6.7.7 1.1.7 1.7 0 2.6-.7 2.6-1.8 0-1-1.2-1.6-2-1.6-.9 0-1.5.2-2 .6-.7.3-1.2.8-1.8 1.5l-.8-.9 2.6-2.1 2.1-1.8c-1.1 0-2.2 0-3.3.2v-1.2Z" fill="currentcolor" />
                    </svg>
                </button>
            {:else}
                <button class="dads-notification-banner__close" type="button" aria-label={closeLabel} on:click={close}>
                    <svg class="dads-notification-banner__close-icon" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="m6.4 18.6-1-1 5.5-5.6-5.6-5.6 1.1-1 5.6 5.5 5.6-5.6 1 1.1L13 12l5.6 5.6-1 1L12 13l-5.6 5.6Z" fill="currentcolor" />
                    </svg>
                    <span class="dads-notification-banner__close-label">{closeLabel}</span>
                </button>
            {/if}
        {/if}
        {#if timestamp || message || $$slots.default}
            <div class="dads-notification-banner__body">
                {#if timestamp}
                    <p class="dads-notification-banner__timestamp"><time style:text-autospace="normal" {datetime}>{timestamp}</time></p>
                {/if}
                <slot>{#if message}<p>{message}</p>{/if}</slot>
            </div>
        {/if}
        {#if $$slots.actions}
            <div class="dads-notification-banner__actions"><slot name="actions" {close} /></div>
        {/if}
    </div>
{/if}

<style>
    .dads-notification-banner {
        --_base-color: var(--color-primitive-blue-900);
        --_color-chip-color: var(--color-primitive-blue-900);
        display: grid;
        grid-template-columns: calc(24 / 16 * 1rem) 1fr auto;
        grid-template-rows: minmax(calc(36 / 16 * 1rem), auto);
        border: solid var(--_base-color);
        background-color: var(--color-neutral-white);
        padding: calc(8 / 16 * 1rem) calc(16 / 16 * 1rem) calc(24 / 16 * 1rem);
        gap: calc(16 / 16 * 1rem);
        color: var(--color-neutral-solid-gray-800);
        font-weight: normal;
        font-size: calc(16 / 16 * 1rem);
        line-height: 1.7;
        font-family: var(--font-family-sans);
        letter-spacing: 0.02em;
    }

    .dads-notification-banner[data-style='standard'] {
        border-radius: calc(12 / 16 * 1rem);
        border-width: calc(3 / 16 * 1rem);
    }

    .dads-notification-banner[data-style='color-chip'] {
        border-width: calc(2 / 16 * 1rem);
        padding-left: calc(24 / 16 * 1rem);
        box-shadow: inset calc(8 / 16 * 1rem) 0 0 0 var(--_color-chip-color);
    }

    @media (min-width: 48rem) {
        .dads-notification-banner {
            grid-template-columns: calc(36 / 16 * 1rem) 1fr auto;
            padding: calc(24 / 16 * 1rem) calc(24 / 16 * 1rem) calc(32 / 16 * 1rem);
            column-gap: calc(24 / 16 * 1rem);
        }
        .dads-notification-banner[data-style='color-chip'] {
            padding-left: calc(40 / 16 * 1rem);
            box-shadow: inset calc(16 / 16 * 1rem) 0 0 0 var(--_color-chip-color);
        }
    }

    .dads-notification-banner[data-type='success'] {
        --_base-color: var(--color-semantic-success-2);
        --_color-chip-color: var(--color-semantic-success-2);
    }
    .dads-notification-banner[data-type='error'] {
        --_base-color: var(--color-semantic-error-1);
        --_color-chip-color: var(--color-semantic-error-1);
    }
    .dads-notification-banner[data-type='warning'] {
        --_base-color: var(--color-semantic-warning-yellow-2);
        --_color-chip-color: var(--color-primitive-yellow-400);
    }
    .dads-notification-banner[data-type='info-1'] {
        --_base-color: var(--color-primitive-blue-900);
        --_color-chip-color: var(--color-primitive-blue-900);
    }
    .dads-notification-banner[data-type='info-2'] {
        --_base-color: var(--color-neutral-solid-gray-536);
        --_color-chip-color: var(--color-neutral-solid-gray-536);
    }

    .dads-notification-banner__icon {
        justify-self: center;
        width: calc(28 / 16 * 1rem);
        height: calc(28 / 16 * 1rem);
        max-width: none;
        max-height: none;
        padding-top: calc(3 / 16 * 1rem);
        color: var(--_base-color);
    }
    @media (min-width: 48rem) {
        .dads-notification-banner__icon {
            margin-top: calc(-4 / 16 * 1rem);
            margin-bottom: calc(-4 / 16 * 1rem);
            width: calc(44 / 16 * 1rem);
            height: calc(44 / 16 * 1rem);
            padding: 0;
        }
    }
    @media (forced-colors: active) {
        .dads-notification-banner__icon {
            color: currentcolor;
        }
    }

    .dads-notification-banner__heading {
        grid-column: span 2;
        margin-top: 0;
        margin-bottom: 0;
        display: grid;
        grid-template-columns: inherit;
        gap: inherit;
    }
    .dads-notification-banner__heading-text {
        padding-top: calc(3 / 16 * 1rem);
        color: var(--color-neutral-solid-gray-900);
        font-weight: bold;
        font-size: calc(17 / 16 * 1rem);
        line-height: 1.7;
        letter-spacing: 0.02em;
    }
    @media (min-width: 48rem) {
        .dads-notification-banner__heading-text {
            padding-top: calc(2 / 16 * 1rem);
            font-size: calc(20 / 16 * 1rem);
            line-height: 1.5;
        }
    }

    .dads-notification-banner__close {
        margin-right: calc(-12 / 16 * 1rem);
        display: flex;
        align-self: start;
        align-items: center;
        column-gap: calc(4 / 16 * 1rem);
        background: transparent;
        border-radius: calc(8 / 16 * 1rem);
        border: 0;
        padding: calc(4 / 16 * 1rem) calc(12 / 16 * 1rem) calc(6 / 16 * 1rem);
        color: var(--color-neutral-solid-gray-900);
        font: inherit;
        line-height: 1;
        letter-spacing: inherit;
    }
    @media (hover: hover) {
        .dads-notification-banner__close:hover {
            background-color: var(--color-neutral-solid-gray-50);
            text-decoration: underline;
            text-decoration-thickness: calc(1 / 16 * 1rem);
            text-underline-offset: calc(3 / 16 * 1rem);
        }
    }
    .dads-notification-banner__close:focus-visible,
    .dads-notification-banner__mobile-close:focus-visible {
        outline: calc(4 / 16 * 1rem) solid var(--color-neutral-black);
        outline-offset: calc(2 / 16 * 1rem);
        background-color: var(--color-primitive-yellow-300);
        box-shadow: 0 0 0 calc(2 / 16 * 1rem) var(--color-primitive-yellow-300);
    }
    .dads-notification-banner__close-icon {
        margin-top: calc(2 / 16 * 1rem);
        width: calc(24 / 16 * 1rem);
        height: calc(24 / 16 * 1rem);
    }
    .dads-notification-banner__mobile-close {
        margin-top: calc(4 / 16 * 1rem);
        border: 0;
        border-radius: calc(4 / 16 * 1rem);
        background: transparent;
        padding: 0;
        color: var(--color-neutral-black);
        touch-action: manipulation;
    }
    @media (hover: hover) {
        .dads-notification-banner__mobile-close:hover {
            outline: 1px solid;
            background-color: var(--color-neutral-solid-gray-50);
        }
    }
    .dads-notification-banner__mobile-close-icon {
        display: block;
        width: calc(44 / 16 * 1rem);
        height: calc(44 / 16 * 1rem);
    }

    .dads-notification-banner__body {
        margin-top: calc(-4 / 16 * 1rem);
        display: grid;
        row-gap: calc(8 / 16 * 1rem);
        grid-column: 1 / 4;
        color: var(--color-neutral-solid-gray-800);
    }
    @media (min-width: 48rem) {
        .dads-notification-banner__body {
            margin-top: 0;
            grid-column: 2 / 4;
        }
    }
    .dads-notification-banner__body > :global(*) {
        margin-top: 0;
        margin-bottom: 0;
    }

    .dads-notification-banner__actions {
        margin-bottom: calc(-8 / 16 * 1rem);
        display: grid;
        gap: calc(8 / 16 * 1rem);
        grid-column: 1 / 4;
    }
    @media (min-width: 48rem) {
        .dads-notification-banner__actions {
            grid-auto-flow: column;
            gap: calc(16 / 16 * 1rem);
            grid-column: 2 / 4;
            justify-content: end;
        }
    }

    /* Slot内のnative controlsにだけ依存ボタンCSSを適用する。 */
    .dads-notification-banner__actions :global(.dads-button) {
        --button-color: var(--color-primitive-blue-900);
        --button-hover-color: var(--color-primitive-blue-1000);
        --button-active-color: var(--color-primitive-blue-1200);
        --button-outline-hover-bg-color: var(--color-primitive-blue-200);
        --button-outline-active-bg-color: var(--color-primitive-blue-300);
        display: flex;
        align-items: center;
        justify-content: center;
        column-gap: calc(4 / 16 * 1rem);
        box-sizing: border-box;
        width: auto;
        max-width: 100%;
        font-weight: bold;
        font-size: calc(16 / 16 * 1rem);
        line-height: 1;
        font-family: var(--font-family-sans);
        letter-spacing: 0.02em;
        text-decoration: none;
        text-underline-offset: calc(3 / 16 * 1rem);
    }
    .dads-notification-banner[data-type='success'] :global(.dads-button) {
        --button-color: var(--color-semantic-success-2);
        --button-hover-color: var(--color-primitive-green-1000);
        --button-active-color: var(--color-primitive-green-1200);
        --button-outline-hover-bg-color: var(--color-primitive-green-200);
        --button-outline-active-bg-color: var(--color-primitive-green-300);
    }
    .dads-notification-banner[data-type='error'] :global(.dads-button) {
        --button-color: var(--color-semantic-error-1);
        --button-hover-color: var(--color-primitive-red-1000);
        --button-active-color: var(--color-primitive-red-1200);
        --button-outline-hover-bg-color: var(--color-primitive-red-200);
        --button-outline-active-bg-color: var(--color-primitive-red-300);
    }
    .dads-notification-banner[data-type='warning'] :global(.dads-button) {
        --button-color: var(--color-semantic-warning-yellow-2);
        --button-hover-color: var(--color-primitive-yellow-1000);
        --button-active-color: var(--color-primitive-yellow-1200);
        --button-outline-hover-bg-color: var(--color-primitive-yellow-200);
        --button-outline-active-bg-color: var(--color-primitive-yellow-300);
    }
    .dads-notification-banner[data-type='info-2'] :global(.dads-button) {
        --button-color: var(--color-neutral-solid-gray-800);
        --button-hover-color: var(--color-neutral-solid-gray-900);
        --button-active-color: var(--color-neutral-black);
        --button-outline-hover-bg-color: var(--color-neutral-solid-gray-200);
        --button-outline-active-bg-color: var(--color-neutral-solid-gray-300);
    }
    .dads-notification-banner__actions :global(.dads-button[data-type='solid-fill']) {
        border: 4px double transparent;
        background-color: var(--button-color);
        color: var(--color-neutral-white);
    }
    .dads-notification-banner__actions :global(.dads-button[data-type='outline']) {
        border: 1px solid currentcolor;
        background-color: var(--color-neutral-white);
        color: var(--button-color);
    }
    .dads-notification-banner__actions :global(.dads-button[data-type='text']) {
        border: 0;
        background-color: transparent;
        color: var(--button-color);
        text-decoration: underline;
        text-decoration-thickness: calc(1 / 16 * 1rem);
    }
    @media (hover: hover) {
        .dads-notification-banner__actions :global(.dads-button[data-type='solid-fill']:hover) {
            background-color: var(--button-hover-color);
            text-decoration: underline;
            text-decoration-thickness: calc(1 / 16 * 1rem);
        }
        .dads-notification-banner__actions :global(.dads-button[data-type='outline']:hover) {
            background-color: var(--button-outline-hover-bg-color);
            color: var(--button-hover-color);
            text-decoration: underline;
            text-decoration-thickness: calc(1 / 16 * 1rem);
        }
        .dads-notification-banner__actions :global(.dads-button[data-type='text']:hover) {
            background-color: var(--color-key-50);
            color: var(--button-hover-color);
            text-decoration-thickness: calc(3 / 16 * 1rem);
        }
    }
    .dads-notification-banner__actions :global(.dads-button[data-type='solid-fill']:active) {
        background-color: var(--button-active-color);
        text-decoration: underline;
    }
    .dads-notification-banner__actions :global(.dads-button[data-type='outline']:active) {
        background-color: var(--button-outline-active-bg-color);
        color: var(--button-active-color);
        text-decoration: underline;
    }
    .dads-notification-banner__actions :global(.dads-button[data-type='text']:active) {
        background-color: var(--color-key-100);
        color: var(--button-active-color);
    }
    .dads-notification-banner__actions :global(.dads-button:focus-visible) {
        outline: calc(4 / 16 * 1rem) solid var(--color-neutral-black);
        outline-offset: calc(2 / 16 * 1rem);
        box-shadow: 0 0 0 calc(2 / 16 * 1rem) var(--color-primitive-yellow-300);
    }
    .dads-notification-banner__actions :global(.dads-button[data-type='text']:focus-visible) {
        background-color: var(--color-primitive-yellow-300);
    }
    .dads-notification-banner__actions :global(.dads-button:disabled),
    .dads-notification-banner__actions :global(.dads-button[aria-disabled='true']) {
        cursor: default;
    }
    .dads-notification-banner__actions
        :global(.dads-button[data-type='solid-fill']:is(:disabled, [aria-disabled='true'])) {
        background-color: var(--color-neutral-solid-gray-300);
        color: var(--color-neutral-solid-gray-50);
        text-decoration: none;
    }
    .dads-notification-banner__actions
        :global(.dads-button[data-type='outline']:is(:disabled, [aria-disabled='true'])) {
        background-color: var(--color-neutral-white);
        color: var(--color-neutral-solid-gray-300);
        text-decoration: none;
    }
    .dads-notification-banner__actions
        :global(.dads-button[data-type='text']:is(:disabled, [aria-disabled='true'])) {
        background-color: transparent;
        color: var(--color-neutral-solid-gray-300);
        text-decoration-thickness: revert;
    }
    @media (forced-colors: active) {
        .dads-notification-banner__actions :global(.dads-button:is(:disabled, [aria-disabled='true'])) {
            border-color: GrayText;
            color: GrayText;
        }
    }
    .dads-notification-banner__actions :global(.dads-button[data-size='lg']) {
        min-width: calc(136 / 16 * 1rem);
        min-height: calc(56 / 16 * 1rem);
        border-radius: calc(8 / 16 * 1rem);
        padding: calc(12 / 16 * 1rem) calc(16 / 16 * 1rem);
    }
    .dads-notification-banner__actions :global(.dads-button[data-size='md']) {
        min-width: calc(96 / 16 * 1rem);
        min-height: calc(48 / 16 * 1rem);
        border-radius: calc(8 / 16 * 1rem);
        padding: calc(8 / 16 * 1rem) calc(16 / 16 * 1rem);
    }
    .dads-notification-banner__actions :global(.dads-button[data-size='sm']) {
        position: relative;
        min-width: calc(80 / 16 * 1rem);
        min-height: calc(36 / 16 * 1rem);
        border-radius: calc(6 / 16 * 1rem);
        padding: calc(2 / 16 * 1rem) calc(12 / 16 * 1rem);
    }
    .dads-notification-banner__actions :global(.dads-button[data-size='xs']) {
        position: relative;
        min-width: calc(72 / 16 * 1rem);
        min-height: calc(28 / 16 * 1rem);
        border-radius: calc(4 / 16 * 1rem);
        padding: calc(2 / 16 * 1rem) calc(8 / 16 * 1rem);
        font-size: calc(14 / 16 * 1rem);
    }
    .dads-notification-banner__actions
        :global(.dads-button:is([data-size='sm'], [data-size='xs'])::after) {
        content: '';
        position: absolute;
        inset: 0;
        margin: auto;
        height: calc(44 / 16 * 1rem);
    }
    .dads-notification-banner__actions :global(.dads-button__icon) {
        flex-shrink: 0;
    }
</style>
