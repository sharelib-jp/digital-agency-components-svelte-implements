<script lang="ts">
    import { onMount } from 'svelte';

    /** 必須の内部inputのID。ページ内で一意にし、ラベルと補足・エラー文の関連付けに使います。 */
    export let id: string;
    /** 必須のname属性（グループ名・送信名）。同じ選択肢群ではnameと`bind:group`の親変数を共有します。 */
    export let name: string;
    /** この選択肢の値。選択時にgroupへ代入します。グループ内で重複させないでください。既定値: ''。 */
    export let value: string | number = '';
    /** グループの現在値。`bind:group`対応。valueとの厳密等価で選択を判定し、フォームresetで生成時の値に戻します。既定値: null。 */
    export let group: string | number | null = null;
    /** ラジオボタンの横に表示するラベル。既定値: ''。 */
    export let label: string = '';
    /** ラジオボタンとラベルの寸法・間隔。既定値: 'sm'。 */
    export let size: 'sm' | 'md' | 'lg' = 'sm';
    /** 内部inputを無効にし、操作・フォーカス・フォーム送信の対象から外します。既定値: false。 */
    export let disabled: boolean = false;
    /** グループから1つの選択を求めるネイティブ必須制約。既定値: false。 */
    export let required: boolean = false;
    /** エラー配色と`aria-invalid="true"`を設定します。自動検証は行いません。既定値: false。 */
    export let errored: boolean = false;
    /** ラジオボタンの前に表示する補足文。空文字列では非表示です。既定値: null。 */
    export let supportText: string | null = null;
    /** 後ろに表示するエラー文。非空なら`aria-invalid="true"`も設定しますが、ネイティブ検証は変更しません。既定値: null。 */
    export let errorText: string | null = null;
    /** 外側のdivのclass属性に追加するCSSクラス。大文字のCで指定します。既定値: ''。 */
    export let Class: string = '';

    const initialGroup = group;
    let input: HTMLInputElement;

    onMount(() => {
        const ownerDocument = input.ownerDocument;
        const pendingResets = new Set<ReturnType<typeof setTimeout>>();

        function handleReset(event: Event) {
            if (event.target !== input.form) return;

            // Wait for the native reset and all handlers that may preventDefault.
            const timer = setTimeout(() => {
                pendingResets.delete(timer);
                if (!event.defaultPrevented) group = initialGroup;
            }, 0);
            pendingResets.add(timer);
        }

        // Capture also covers external forms and stopped bubbling.
        ownerDocument.addEventListener('reset', handleReset, true);
        return () => {
            ownerDocument.removeEventListener('reset', handleReset, true);
            for (const timer of pendingResets) clearTimeout(timer);
        };
    });

    $: supportTextId = supportText ? `${id}-support-text` : undefined;
    $: errorTextId = errorText ? `${id}-error-text` : undefined;
    $: describedBy = [$$restProps['aria-describedby'], supportTextId, errorTextId]
        .filter(Boolean).join(' ') || undefined;

    // Native bind:group does not share its binding group across component instances.
    function select(event: Event) {
        if ((event.currentTarget as HTMLInputElement).checked) {
            group = value;
        }
    }
</script>

<div class={`dads-radio-field ${Class}`}>
    {#if supportText}
        <p id={supportTextId} class="dads-form-control-label__support-text">{supportText}</p>
    {/if}
    <label class="dads-radio" data-size={size} for={id}>
        <span class="dads-radio__radio">
            <!-- svelte-ignore a11y_role_supports_aria_props_implicit (Keep the source's per-radio aria-invalid error styling.) -->
            <input
                {...$$restProps}
                {id}
                {name}
                {value}
                class="dads-radio__input"
                type="radio"
                bind:this={input}
                defaultChecked={initialGroup === value}
                checked={group === value}
                {disabled}
                {required}
                aria-invalid={errored || errorText ? 'true' : $$restProps['aria-invalid']}
                aria-describedby={describedBy}
                on:input={select}
                on:input
                on:change={select}
                on:change
                on:focus
                on:blur
            />
        </span>
        <span class="dads-radio__label">{label}</span>
    </label>
    {#if errorText}
        <p id={errorTextId} class="dads-form-control-label__error-text">{errorText}</p>
    {/if}
</div>

<style>
    .dads-radio-field {
        color: var(--color-neutral-solid-gray-800);
        font-weight: normal;
        font-size: calc(16 / 16 * 1rem);
        line-height: 1.7;
        font-family: var(--font-family-sans);
        letter-spacing: 0.02em;
    }

    .dads-radio {
        display: flex;
        align-items: start;
        gap: var(--_gap);
        width: fit-content;
    }

    .dads-radio:has(.dads-radio__label:not(:empty)) {
        padding-top: calc(8 / 16 * 1rem);
        padding-bottom: calc(8 / 16 * 1rem);
    }

    .dads-radio[data-size="sm"] {
        --_gap: calc(4 / 16 * 1rem);
        --_radio-size: calc(24 / 16 * 1rem);
        --_radio-outer-size: calc(20 / 16 * 1rem);
        --_radio-inner-size: calc(10 / 16 * 1rem);
        --_radio-border-width: calc(2 / 16 * 1rem);
        --_label-padding-top: calc(1 / 16 * 1rem);
        --_label-font-size: calc(16 / 16 * 1rem);
    }

    .dads-radio[data-size="md"] {
        --_gap: calc(8 / 16 * 1rem);
        --_radio-size: calc(32 / 16 * 1rem);
        --_radio-outer-size: calc(26 / 16 * 1rem);
        --_radio-inner-size: calc(12 / 16 * 1rem);
        --_radio-border-width: calc(2 / 16 * 1rem);
        --_label-padding-top: calc(4 / 16 * 1rem);
        --_label-font-size: calc(16 / 16 * 1rem);
    }

    .dads-radio[data-size="lg"] {
        --_gap: calc(12 / 16 * 1rem);
        --_radio-size: calc(44 / 16 * 1rem);
        --_radio-outer-size: calc(36 / 16 * 1rem);
        --_radio-inner-size: calc(16 / 16 * 1rem);
        --_radio-border-width: calc(3 / 16 * 1rem);
        --_label-padding-top: calc(10 / 16 * 1rem);
        --_label-font-size: calc(17 / 16 * 1rem);
    }

    .dads-radio__radio {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-shrink: 0;
        width: var(--_radio-size);
        height: var(--_radio-size);
        border-radius: 50%;
    }

    @media (hover: hover) {
        .dads-radio__radio:has(:not(:focus, :disabled, [aria-disabled="true"]):hover) {
            background-color: var(--color-neutral-solid-gray-420);
        }
    }

    .dads-radio__input {
        --_base-color: var(--color-neutral-white);
        --_accent-color: var(--color-key-900);
        --_accent-hover-color: var(--color-key-1100);
        --_border-color: var(--color-neutral-solid-gray-600);
        --_border-hover-color: var(--color-neutral-black);
        position: relative;
        margin: 0;
        appearance: none;
        width: var(--_radio-outer-size);
        height: var(--_radio-outer-size);
        border-radius: 51%;
        background-color: var(--_base-color);
        border: var(--_radio-border-width) solid var(--_border-color);
    }

    .dads-radio__input:focus {
        outline: calc(4 / 16 * 1rem) solid var(--color-neutral-black);
        outline-offset: calc(2 / 16 * 1rem);
        box-shadow: 0 0 0 calc(2 / 16 * 1rem) var(--color-primitive-yellow-300);
    }

    @media (hover: hover) {
        .dads-radio__input:not(:disabled, [aria-disabled="true"]):hover {
            border-color: var(--_border-hover-color);
        }
    }

    .dads-radio__input:checked {
        border-color: var(--_accent-color);
    }

    @media (hover: hover) {
        .dads-radio__input:checked:not(:disabled, [aria-disabled="true"]):hover {
            border-color: var(--_accent-hover-color);
        }
    }

    .dads-radio__input:checked::before {
        position: absolute;
        inset: 0;
        margin: auto;
        width: var(--_radio-inner-size);
        height: var(--_radio-inner-size);
        border-radius: 51%;
        background-color: var(--_accent-color);
        content: "";
    }

    @media (hover: hover) {
        .dads-radio__input:checked:not(:disabled, [aria-disabled="true"]):hover::before {
            background-color: var(--_accent-hover-color);
        }
    }

    .dads-radio__input[aria-invalid="true"] {
        --_accent-color: var(--color-semantic-error-1);
        --_accent-hover-color: var(--color-primitive-red-1000);
        --_border-color: var(--color-semantic-error-1);
        --_border-hover-color: var(--color-primitive-red-1000);
    }

    .dads-radio__input:is(:disabled, [aria-disabled="true"]) {
        --_base-color: var(--color-neutral-solid-gray-50);
        --_accent-color: var(--color-neutral-solid-gray-300);
        --_accent-hover-color: var(--color-neutral-solid-gray-300);
        --_border-color: var(--color-neutral-solid-gray-300);
        --_border-hover-color: var(--color-neutral-solid-gray-300);
    }

    @media (forced-colors: active) {
        .dads-radio__input,
        .dads-radio__input[aria-invalid="true"] {
            --_accent-color: Highlight;
            --_accent-hover-color: Highlight;
            --_border-color: ButtonText;
            --_border-hover-color: ButtonText;
        }

        .dads-radio__input:is(:disabled, [aria-disabled="true"]) {
            --_accent-color: GrayText;
            --_accent-hover-color: GrayText;
            --_border-color: GrayText;
            --_border-hover-color: GrayText;
        }
    }

    .dads-radio__label {
        padding-top: var(--_label-padding-top);
        color: var(--color-neutral-solid-gray-800);
        font-weight: normal;
        font-size: var(--_label-font-size);
        line-height: 1.3;
        font-family: var(--font-family-sans);
        letter-spacing: 0;
    }

    .dads-form-control-label__support-text {
        margin: 0;
        color: var(--color-neutral-solid-gray-600);
    }

    .dads-form-control-label__error-text {
        margin: 0;
        color: var(--color-semantic-error-1);
        line-height: 1.3;
        letter-spacing: 0;
    }
</style>
