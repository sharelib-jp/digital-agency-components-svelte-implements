<script lang="ts">
    import { onDestroy } from 'svelte';
    import FormControlLabel from './FormControlLabel.svelte';

    /** 必須の内部textareaのID。ページ内で一意にし、ラベルと補足・エラー文の関連付けに使います。 */
    export let id: string;
    /** textareaのname属性（フォーム送信名）。既定値: undefined。 */
    export let name: string | undefined = undefined;
    /** 入力内容。`bind:value`で親と双方向に同期できます。既定値: ''。 */
    export let value: string = '';
    /** 入力欄の前に表示するラベル。空文字列ではlabel要素を描画しません。既定値: ''。 */
    export let label: string = '';
    /** ラベルの文字サイズと周囲の間隔。入力欄の行数ではありません。既定値: 'md'。 */
    export let size: 'sm' | 'md' | 'lg' = 'md';
    /** 入力欄とラベル領域を親要素の幅いっぱいに表示します。既定値: false。 */
    export let fullWidth: boolean = false;
    /** textareaのrows属性（表示行数）。正の整数を指定し、未指定時はブラウザーに委ねます。既定値: undefined。 */
    export let rows: number | undefined = undefined;
    /** textareaのcols属性（表示幅の目安）。正の整数を指定し、未指定時はブラウザーに委ねます。既定値: undefined。 */
    export let cols: number | undefined = undefined;
    /** 編集を禁止します。フォーカス・コピー・フォーム送信は可能です。既定値: false。 */
    export let readonly: boolean = false;
    /** readonlyかつラベルがある場合に、必須・任意表示の代わりに示す文言。既定値: '編集不可'。 */
    export let readonlyText: string = '編集不可';
    /** textareaを無効にし、フォーム送信の対象から外します。既定値: false。 */
    export let disabled: boolean = false;
    /** ネイティブ必須制約と、読み取り専用でない場合のラベルの必須表示を設定します。既定値: false。 */
    export let required: boolean = false;
    /** 入力欄の前に表示する補足文。空文字列では非表示です。既定値: null。 */
    export let supportText: string | null = null;
    /** 後ろに表示するエラー文。非空なら`aria-invalid="true"`も設定しますが、このprop自体は送信を止めません。既定値: null。 */
    export let errorText: string | null = null;
    /** UTF-16コード単位で数えるカウンタと超過検証の上限。非負の有限整数を指定し、nullなら無効。入力は切り詰めません。既定値: null。 */
    export let counterMax: number | null = null;
    /** 超過時のネイティブ制約検証メッセージ。{count}を超過数に置換します。既定値: '{count}文字超過しています'。 */
    export let counterErrorMessage: string = '{count}文字超過しています';
    /** 超過時のassertiveな読み上げ通知。{count}を超過数に置換します。既定値: '{count}文字超過'。 */
    export let counterExceededMessage: string = '{count}文字超過';
    /** 残り数のpoliteな読み上げ通知。{count}を残り数に置換します。既定値: '残り{count}文字'。 */
    export let counterRemainingMessage: string = '残り{count}文字';
    /** 外側のフォームラベル用divのclass属性に追加するCSSクラス。大文字のCで指定します。既定値: ''。 */
    export let Class: string = '';

    let textarea: HTMLTextAreaElement | undefined;
    let composing = false;
    let counterValue = value;
    let politeAnnouncement = '';
    let assertiveAnnouncement = '';
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;
    let announceTimer: ReturnType<typeof setTimeout> | undefined;

    $: supportTextId = supportText ? `${id}-support-text` : undefined;
    $: errorTextId = errorText ? `${id}-error-text` : undefined;
    $: describedBy = [$$restProps['aria-describedby'], supportTextId, errorTextId]
        .filter(Boolean).join(' ') || undefined;
    $: if (!composing) counterValue = value;
    $: count = counterValue.length;
    $: remaining = counterMax === null ? 0 : counterMax - count;
    $: exceeded = counterMax !== null && remaining < 0;
    $: textarea?.setCustomValidity(
        exceeded ? formatMessage(counterErrorMessage, Math.abs(remaining)) : ''
    );
    $: if (counterMax === null) {
        clearTimeout(debounceTimer);
        clearTimeout(announceTimer);
        politeAnnouncement = '';
        assertiveAnnouncement = '';
    }

    function formatMessage(template: string, count: number) {
        return template.replace(/\{count\}/g, String(count));
    }

    function announce(message: string, assertive: boolean) {
        clearTimeout(announceTimer);
        politeAnnouncement = '';
        assertiveAnnouncement = '';
        announceTimer = setTimeout(() => {
            if (assertive) assertiveAnnouncement = message;
            else politeAnnouncement = message;
        }, 100);
    }

    function updateCounter(text: string) {
        counterValue = text;
        if (counterMax === null) return;

        const remaining = counterMax - text.length;
        clearTimeout(debounceTimer);
        clearTimeout(announceTimer);
        if (remaining < 0) {
            announce(formatMessage(counterExceededMessage, Math.abs(remaining)), true);
        } else {
            const delay = remaining <= 1 ? 1000 : Math.max(1, Math.log10(remaining)) * 1000;
            debounceTimer = setTimeout(() => {
                announce(formatMessage(counterRemainingMessage, remaining), false);
            }, delay);
        }
    }

    function handleInput(event: Event) {
        composing = (event as InputEvent).isComposing === true;
        if (!composing) updateCounter((event.currentTarget as HTMLTextAreaElement).value);
    }

    function handleCompositionEnd(event: CompositionEvent) {
        composing = false;
        value = (event.currentTarget as HTMLTextAreaElement).value;
        updateCounter(value);
    }

    onDestroy(() => {
        clearTimeout(debounceTimer);
        clearTimeout(announceTimer);
    });
</script>

<div class={`dads-form-control-label ${Class}`} data-size={size} data-full-width={fullWidth}>
    {#if label}
        {#if readonly}
            <label class="dads-form-control-label__label" for={id}>
                {label}
                <span class="dads-form-control-label__status">{readonlyText}</span>
            </label>
            {#if supportText}
                <p id={supportTextId} class="dads-form-control-label__support-text">{supportText}</p>
            {/if}
        {:else}
            <FormControlLabel For={id} {label} {required} {supportText} {supportTextId} />
        {/if}
    {:else if supportText}
        <p id={supportTextId} class="dads-form-control-label__support-text">{supportText}</p>
    {/if}

    <div>
        <span class="dads-textarea">
            <textarea
                {...$$restProps}
                {id}
                {name}
                class="dads-textarea__textarea"
                data-full-width={fullWidth}
                {rows}
                {cols}
                bind:this={textarea}
                bind:value
                {readonly}
                {disabled}
                {required}
                aria-invalid={errorText ? 'true' : $$restProps['aria-invalid']}
                aria-describedby={describedBy}
                on:input={handleInput}
                on:input
                on:change
                on:focus
                on:blur
                on:compositionstart={() => composing = true}
                on:compositionstart
                on:compositionend={handleCompositionEnd}
                on:compositionend
            ></textarea>

            {#if errorText}
                <span id={errorTextId} class="dads-textarea__error-text">{errorText}</span>
            {/if}

            {#if counterMax !== null}
                <span class="dads-textarea__counter" data-exceeded={exceeded ? '' : undefined}>
                    <span class="dads-u-visually-hidden" aria-live="assertive" data-announcer="assertive">{assertiveAnnouncement}</span>
                    <span class="dads-u-visually-hidden" aria-live="polite" data-announcer="polite">{politeAnnouncement}</span>
                    <span data-count>{count} / {counterMax}</span>
                </span>
            {/if}
        </span>
    </div>
</div>

<style>
    .dads-form-control-label {
        margin: 0;
        display: flex;
        flex-direction: column;
        border: 0;
        padding: 0;
        color: var(--color-neutral-solid-gray-800);
        font-weight: normal;
        font-size: calc(16 / 16 * 1rem);
        line-height: 1.7;
        font-family: var(--font-family-sans);
        letter-spacing: 0.02em;
    }

    .dads-form-control-label[data-size="sm"] {
        gap: calc(4 / 16 * 1rem);
    }

    .dads-form-control-label[data-size="md"],
    .dads-form-control-label[data-size="lg"] {
        gap: calc(8 / 16 * 1rem);
    }

    .dads-form-control-label :global(.dads-form-control-label__label) {
        align-self: start;
        padding: 0;
        font-weight: bold;
    }

    .dads-form-control-label[data-size="sm"] :global(.dads-form-control-label__label) {
        font-size: calc(16 / 16 * 1rem);
    }

    .dads-form-control-label[data-size="md"] :global(.dads-form-control-label__label) {
        font-size: calc(17 / 16 * 1rem);
    }

    .dads-form-control-label[data-size="lg"] :global(.dads-form-control-label__label) {
        font-size: calc(18 / 16 * 1rem);
    }

    .dads-form-control-label :global(.dads-form-control-label__requirement) {
        margin-left: calc(4 / 16 * 1rem);
        font-weight: normal;
        font-size: calc(16 / 16 * 1rem);
    }

    .dads-form-control-label :global(.dads-form-control-label__requirement[data-required="true"]) {
        color: var(--color-semantic-error-1);
    }

    .dads-form-control-label :global(.dads-form-control-label__requirement)::before {
        content: " ";
    }

    .dads-form-control-label__status {
        margin-left: calc(4 / 16 * 1rem);
        display: inline-block;
        outline: 1px solid transparent;
        border-radius: calc(8 / 16 * 1rem);
        background-color: var(--color-neutral-solid-gray-536);
        padding: calc(8 / 16 * 1rem);
        color: var(--color-neutral-white);
        font-weight: normal;
        font-size: calc(16 / 16 * 1rem);
        line-height: 1;
        letter-spacing: 0.02em;
    }

    .dads-form-control-label :global(.dads-form-control-label__support-text) {
        margin-top: 0;
        margin-bottom: 0;
        color: var(--color-neutral-solid-gray-600);
    }

    .dads-textarea {
        display: block;
        color: var(--color-neutral-solid-gray-800);
        font-weight: normal;
        font-size: calc(16 / 16 * 1rem);
        line-height: 1.7;
        font-family: var(--font-family-sans);
        letter-spacing: 0.02em;
    }

    .dads-textarea__textarea {
        display: block;
        box-sizing: border-box;
        max-width: 100%;
        border: 1px solid var(--color-neutral-solid-gray-600);
        background-color: var(--color-neutral-white);
        padding: calc(16 / 16 * 1rem);
        border-radius: calc(8 / 16 * 1rem);
        color: var(--color-neutral-solid-gray-900);
        font: inherit;
        resize: vertical;
    }

    .dads-form-control-label[data-full-width="true"],
    .dads-textarea__textarea[data-full-width="true"] {
        width: 100%;
    }

    .dads-textarea__textarea:read-only:not(:disabled) {
        border-style: dashed;
    }

    .dads-textarea__textarea:focus-visible {
        outline: calc(4 / 16 * 1rem) solid var(--color-neutral-black);
        outline-offset: calc(2 / 16 * 1rem);
        box-shadow: 0 0 0 calc(2 / 16 * 1rem) var(--color-primitive-yellow-300);
    }

    @media (hover: hover) {
        .dads-textarea__textarea:not(:read-only):hover {
            border-color: var(--color-neutral-black);
        }
    }

    .dads-textarea__textarea:is(:user-invalid, [aria-invalid="true"]) {
        border-color: var(--color-semantic-error-1);
    }

    @media (hover: hover) {
        .dads-textarea__textarea:is(:user-invalid, [aria-invalid="true"]):hover {
            border-color: var(--color-primitive-red-1000);
        }
    }

    .dads-textarea__textarea:is(:disabled, [aria-disabled="true"]),
    .dads-textarea__textarea:is(:disabled, [aria-disabled="true"]):hover {
        border-color: var(--color-neutral-solid-gray-300);
        background-color: var(--color-neutral-solid-gray-50);
        color: var(--color-neutral-solid-gray-420);
        resize: none;
    }

    @media (forced-colors: active) {
        .dads-textarea__textarea[aria-disabled="true"],
        .dads-textarea__textarea[aria-disabled="true"]:hover {
            border-color: GrayText;
            color: GrayText;
        }
    }

    .dads-textarea__error-text {
        margin: calc(8 / 16 * 1rem) 0 0 0;
        display: block;
        color: var(--color-semantic-error-1);
    }

    .dads-textarea__counter {
        display: block;
        margin-top: calc(8 / 16 * 1rem);
        color: var(--color-neutral-solid-gray-600);
        font-size: calc(16 / 16 * 1rem);
        line-height: 1;
        letter-spacing: 0.02em;
    }

    .dads-textarea__counter[data-exceeded] {
        color: var(--color-semantic-error-1);
    }

    .dads-u-visually-hidden {
        clip: rect(0 0 0 0) !important;
        clip-path: inset(50%) !important;
        height: 1px !important;
        overflow: hidden !important;
        position: absolute !important;
        white-space: nowrap !important;
        width: 1px !important;
    }
</style>
