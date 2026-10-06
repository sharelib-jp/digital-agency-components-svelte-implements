<script lang="ts">
    import FormControlLabel from './FormControlLabel.svelte';

    /** 内部inputのID。省略時はUUIDで生成するため、SSRでは一意の値の明示指定を推奨します。 */
    export let id: string | undefined = undefined;
    /** 入力欄の高さを決めるサイズ。既定値: 'sm'。 */
    export let size: 'sm' | 'md' | 'lg' = 'sm';
    /** 入力の種類。passwordでは入力文字を伏せて表示します。既定値: 'text'。 */
    export let type: 'text' | 'password' = 'text';
    /** 入力欄とラベル領域を親要素の幅いっぱいに表示します。既定値: false。 */
    export let fullWidth: boolean = false;
    /** 入力欄を読み取り専用にし、ユーザーによる編集を禁止します。既定値: false。 */
    export let readonly: boolean = false;
    /** 内部inputを無効にします。既定値: false。 */
    export let disabled: boolean = false;
    /** 入力値。`bind:value`で親と双方向に同期できます。既定値: ''。 */
    export let value: string = '';
    /** エラー文。非空なら表示と`aria-invalid="true"`を設定しますが、ネイティブ検証は変更しません。既定値: null。 */
    export let errorText: string | null = null;

    /** 入力に関連付けるラベル。空文字列では内部ラベルを表示しません。既定値: ''。 */
    export let label: string = '';
    /** 入力のrequired属性と、ラベルがある場合の必須表示を設定します。既定値: false。 */
    export let required: boolean = false;
    /** ラベルの下に表示する補助文。表示には空でないlabelが必要です。既定値: null。 */
    export let supportText: string | null = null;

    const generatedId = `input-${crypto.randomUUID()}`;

    $: inputId = id ?? generatedId;

    $: supportTextId = supportText
        ? `${inputId}-support-text`
        : undefined;

    $: errorTextId = errorText
        ? `${inputId}-error-text`
        : undefined;

    $: describedBy = [supportTextId, errorTextId]
        .filter(Boolean)
        .join(' ') || undefined;
</script>

<style>
    .dads-input-text-field {
        display: block;
    }

    .dads-input-text {
        display: block;
        color: var(--color-neutral-solid-gray-800);
        font-weight: normal;
        font-size: calc(16 / 16 * 1rem);
        line-height: 1.7;
        font-family: var(--font-family-sans);
        letter-spacing: 0.02em;
    }

    .dads-input-text__input {
        box-sizing: border-box;
        max-width: 100%;
        border: 1px solid var(--color-neutral-solid-gray-600);
        background-color: var(--color-neutral-white);
        padding: calc(12 / 16 * 1rem) calc(16 / 16 * 1rem);
        border-radius: calc(8 / 16 * 1rem);
        color: var(--color-neutral-solid-gray-900);
        font: inherit;
        line-height: 1;
    }

    .dads-input-text-field[data-full-width='true'],
    .dads-input-text__input[data-full-width='true'] {
        width: 100%;
    }

    .dads-input-text__input[data-size='sm'] {
        height: 2.5rem;
    }

    .dads-input-text__input[data-size='md'] {
        height: 3rem;
    }

    .dads-input-text__input[data-size='lg'] {
        height: 3.5rem;
    }

    .dads-input-text__input:read-only:not(:disabled) {
        border-style: dashed;
    }

    .dads-input-text__input:focus-visible {
        outline: calc(4 / 16 * 1rem) solid var(--color-neutral-black);
        outline-offset: calc(2 / 16 * 1rem);
        box-shadow:
            0 0 0 calc(2 / 16 * 1rem)
            var(--color-primitive-yellow-300);
    }

    @media (hover: hover) {
        .dads-input-text__input:not(:read-only):hover {
            border-color: var(--color-neutral-black);
        }
    }

    .dads-input-text__input:is(
        :user-invalid,
        [aria-invalid='true']
    ) {
        border-color: var(--color-semantic-error-1);
    }

    @media (hover: hover) {
        .dads-input-text__input:is(
            :user-invalid,
            [aria-invalid='true']
        ):hover {
            border-color: var(--color-primitive-red-1000);
        }
    }

    .dads-input-text__input:is(
        :disabled,
        [aria-disabled='true']
    ),
    .dads-input-text__input:is(
        :disabled,
        [aria-disabled='true']
    ):hover {
        border-color: var(--color-neutral-solid-gray-300);
        background-color: var(--color-neutral-solid-gray-50);
        color: var(--color-neutral-solid-gray-420);
    }

    @media (forced-colors: active) {
        .dads-input-text__input[aria-disabled='true'],
        .dads-input-text__input[aria-disabled='true']:hover {
            border-color: GrayText;
            color: GrayText;
        }
    }

    .dads-input-text__error-text {
        display: block;
        margin: calc(8 / 16 * 1rem) 0 0;
        color: var(--color-semantic-error-1);
    }
</style>

<div class="dads-input-text-field" data-full-width={fullWidth}>
    {#if label}
        <FormControlLabel
            For={inputId}
            {label}
            {required}
            {supportText}
            {supportTextId}
        />
    {/if}

    <span class="dads-input-text">
        <input
            id={inputId}
            class="dads-input-text__input"
            {type}
            data-size={size}
            data-full-width={fullWidth}
            bind:value
            {readonly}
            {disabled}
            {required}
            aria-invalid={errorText ? 'true' : undefined}
            aria-describedby={describedBy}
        />

        {#if errorText}
            <span
                id={errorTextId}
                class="dads-input-text__error-text"
            >
                {errorText}
            </span>
        {/if}
    </span>
</div>
