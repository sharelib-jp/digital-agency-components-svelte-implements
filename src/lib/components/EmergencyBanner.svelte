<script lang="ts">
    /** ルートのarticle要素のID。既定値: undefined。 */
    export let id: string | undefined = undefined;
    /** ルートのHTML class属性に追加するクラス。大文字のCで指定。既定値: ''。 */
    export let Class: string = '';
    /** h2の見出しテキスト。heading slotが優先される。既定値: '緊急のお知らせ'。 */
    export let heading: string = '緊急のお知らせ';
    /** 本文の文字列。デフォルトslot未指定時にp要素で表示。既定値: ''。 */
    export let message: string = '';
    /** 表示用の日時。空文字ならtime要素を表示しない。既定値: ''。 */
    export let timestamp: string = '';
    /** time要素の機械可読なdatetime属性。timestampと組み合わせて指定。既定値: undefined。 */
    export let datetime: string | undefined = undefined;
    /** 詳細リンクのURL。actions slotが優先され、空または未指定なら既定リンクは非表示。既定値: undefined。 */
    export let href: string | undefined = undefined;
    /** actions slot未指定時の詳細リンクのテキスト。既定値: '詳細を確認する'。 */
    export let linkLabel: string = '詳細を確認する';
    /** 既定リンクの表示先。_blankでは安全なrelと新規タブの案内を付ける。既定値: '_self'。 */
    export let target: '_self' | '_blank' = '_self';
</script>

<article {id} class={`dads-emergency-banner ${Class}`}>
    <header class="dads-emergency-banner__header">
        <h2 class="dads-emergency-banner__heading"><slot name="heading">{heading}</slot></h2>
        {#if timestamp}
            <time class="dads-emergency-banner__timestamp" style:text-autospace="normal" {datetime}>{timestamp}</time>
        {/if}
    </header>
    {#if $$slots.default || message}
        <div class="dads-emergency-banner__body">
            <slot><p>{message}</p></slot>
        </div>
    {/if}
    {#if $$slots.actions || href}
        <div class="dads-emergency-banner__action">
            <slot name="actions">
                {#if href}
                    <a
                        class="dads-emergency-banner__button"
                        {href}
                        target={target === '_blank' ? '_blank' : undefined}
                        rel={target === '_blank' ? 'noopener noreferrer' : undefined}
                    >
                        {linkLabel}
                        {#if target === '_blank'}
                            <span class="dads-emergency-banner__button-icon">
                                <svg class="dads-emergency-banner__button-icon-glyph" width="16" height="16" viewBox="0 0 48 48" role="img" aria-label="新規タブで開きます">
                                    <path d="M22 6V9H9V39H39V26H42V42H6V6H22ZM42 6V20H39V11.2L21 29L19 27L36.8 9H28V6H42Z" fill="currentcolor" />
                                </svg>
                            </span>
                        {/if}
                    </a>
                {/if}
            </slot>
        </div>
    {/if}
</article>

<style>
    .dads-emergency-banner {
        display: grid;
        row-gap: calc(8 / 16 * 1rem);
        border: 6px solid var(--color-semantic-warning-orange-1);
        background-color: var(--color-neutral-white);
        padding: calc(14 / 16 * 1rem) calc(10 / 16 * 1rem);
        color: var(--color-neutral-solid-gray-800);
        font-weight: normal;
        font-size: calc(16 / 16 * 1rem);
        line-height: 1.7;
        font-family: var(--font-family-sans);
        letter-spacing: 0.02em;
    }

    @media (min-width: 48rem) {
        .dads-emergency-banner {
            row-gap: calc(16 / 16 * 1rem);
            padding: calc(26 / 16 * 1rem);
        }
    }

    .dads-emergency-banner__header {
        display: grid;
        row-gap: calc(8 / 16 * 1rem);
    }

    .dads-emergency-banner__heading {
        margin-top: 0;
        margin-bottom: 0;
        font-weight: bold;
        font-size: calc(20 / 16 * 1rem);
        line-height: 1.5;
        text-spacing-trim: trim-start;
    }

    @media (min-width: 48rem) {
        .dads-emergency-banner__heading {
            font-size: calc(24 / 16 * 1rem);
        }
    }

    .dads-emergency-banner__timestamp {
        display: block;
    }

    .dads-emergency-banner__body {
        display: grid;
        row-gap: calc(8 / 16 * 1rem);
    }

    .dads-emergency-banner__body > :global(*) {
        margin-top: 0;
        margin-bottom: 0;
    }

    @media (min-width: 48rem) {
        .dads-emergency-banner__body {
            font-size: var(--font-size-20, calc(20 / 16 * 1rem));
            line-height: var(--line-height-150, 1.5);
            row-gap: calc(16 / 16 * 1rem);
        }
    }

    .dads-emergency-banner__action {
        padding-top: calc(8 / 16 * 1rem);
    }

    @media (min-width: 48rem) {
        .dads-emergency-banner__action {
            display: flex;
            justify-content: center;
            padding-top: calc(12 / 16 * 1rem);
            padding-bottom: calc(4 / 16 * 1rem);
        }
    }

    .dads-emergency-banner__button,
    .dads-emergency-banner__button:any-link {
        position: relative;
        display: block;
        box-sizing: border-box;
        width: 100%;
        border: 2px solid transparent;
        border-radius: calc(12 / 16 * 1rem);
        background-color: var(--color-semantic-error-1);
        padding: calc(18 / 16 * 1rem);
        color: var(--color-neutral-white);
        text-align: center;
        font-weight: bold;
        font-size: calc(16 / 16 * 1rem);
        line-height: 1;
        letter-spacing: 0.02em;
        text-decoration: none;
    }

    @media (min-width: 48rem) {
        .dads-emergency-banner__button,
        .dads-emergency-banner__button:any-link {
            width: fit-content;
            min-width: 50%;
            border-width: 4px;
            border-radius: calc(16 / 16 * 1rem);
            padding: calc(20 / 16 * 1rem);
        }
    }

    @media (hover: hover) {
        .dads-emergency-banner__button:hover {
            background-color: var(--color-semantic-error-2);
            text-decoration: underline;
            text-decoration-thickness: calc(1 / 16 * 1rem);
            text-underline-offset: calc(3 / 16 * 1rem);
        }
    }

    .dads-emergency-banner__button:focus-visible {
        outline: calc(4 / 16 * 1rem) solid var(--color-neutral-black);
        outline-offset: calc(2 / 16 * 1rem);
        box-shadow: 0 0 0 calc(2 / 16 * 1rem) var(--color-primitive-yellow-300);
    }

    .dads-emergency-banner__button::after {
        position: absolute;
        inset: 0;
        border: 2px solid var(--color-neutral-white);
        border-radius: calc(10 / 16 * 1rem);
        content: '';
    }

    @media (min-width: 48rem) {
        .dads-emergency-banner__button::after {
            border-width: 4px;
            border-radius: calc(12 / 16 * 1rem);
        }
    }

    @media (forced-colors: active) {
        .dads-emergency-banner__button::after {
            inset: calc(4 / 16 * 1rem);
            border-width: 2px;
            border-radius: calc(8 / 16 * 1rem);
        }
    }

    .dads-emergency-banner__button-icon {
        display: inline-block;
        fill: currentcolor;
        vertical-align: -0.15em;
    }

    .dads-emergency-banner__button-icon::before {
        content: ' ';
    }

    .dads-emergency-banner__button-icon-glyph {
        display: block;
        width: calc(16 / 16 * 1rem);
        height: calc(16 / 16 * 1rem);
    }
</style>
