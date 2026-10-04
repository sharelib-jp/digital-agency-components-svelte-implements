<script lang="ts">
    import FormControlLabel from './FormControlLabel.svelte';

    /** 必須の一意なID。on-offではinput、modeでは左buttonに設定し、右buttonや説明文の派生IDにも使います。 */
    export let id: string;
    /** オン・オフのcheckboxまたは2モードのbutton表示を選びます。既定値: 'on-off'。 */
    export let type: 'on-off' | 'mode' = 'on-off';
    /** on-offのinputのname属性（送信名）。modeでは使いません。既定値: undefined。 */
    export let name: string | undefined = undefined;
    /** on-offがオンの場合の送信値。modeでは使いません。既定値: 'on'。 */
    export let value: string = 'on';
    /** オン状態。modeではfalseが左、trueが右の有効状態です。`bind:checked`対応。既定値: false。 */
    export let checked: boolean = false;
    /** 項目名。on-offではlabel、modeではlegendとして表示します。既定値: ''。 */
    export let label: string = '';
    /** modeの左buttonの文言。on-offでは使いません。既定値: 'モード1'。 */
    export let leftLabel: string = 'モード1';
    /** modeの右buttonの文言。on-offでは使いません。既定値: 'モード2'。 */
    export let rightLabel: string = 'モード2';
    /** on-offのinputまたはmodeの両buttonをネイティブに無効化します。既定値: false。 */
    export let disabled: boolean = false;
    /** 必須表示。on-offではネイティブ必須制約、modeではaria-requiredのみを設定します。既定値: false。 */
    export let required: boolean = false;
    /** 操作要素の前に表示する補足文。空文字列では非表示です。既定値: null。 */
    export let supportText: string | null = null;
    /** 後ろに表示するエラー文。非空なら`aria-invalid="true"`も設定しますが、ネイティブ検証は変更しません。既定値: null。 */
    export let errorText: string | null = null;
    /** 外側のfieldsetのclass属性に追加するCSSクラス。大文字のCで指定します。既定値: ''。 */
    export let Class: string = '';

    $: supportTextId = supportText ? `${id}-support-text` : undefined;
    $: errorTextId = errorText ? `${id}-error-text` : undefined;
    $: describedBy = [$$restProps['aria-describedby'], supportTextId, errorTextId]
        .filter(Boolean).join(' ') || undefined;

    function preventDisabled(event: MouseEvent) {
        if (disabled || String($$restProps['aria-disabled']) === 'true') {
            event.preventDefault();
        }
    }

    function toggleMode(event: MouseEvent) {
        const button = event.currentTarget as HTMLButtonElement;
        if (disabled || button.getAttribute('aria-disabled') === 'true') return;

        checked = !checked;
        // Update both ARIA states before forwarding the source's native events.
        const options = button.parentElement?.querySelectorAll('.dads-switch-mode__option');
        options?.forEach((option, index) => {
            option.setAttribute('aria-checked', String(index === 0 ? !checked : checked));
        });
        button.dispatchEvent(new Event('input', { bubbles: true }));
        button.dispatchEvent(new Event('change', { bubbles: true }));
    }
</script>

<fieldset class={`dads-form-control-label ${Class}`} data-size="md" data-type={type}>
    {#if label}
        {#if type === 'mode'}
            <legend class="dads-form-control-label__label">
                {label}
                <span class="dads-form-control-label__requirement" data-required={required}>
                    {required ? '※必須' : '※任意'}
                </span>
            </legend>
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
        {#if type === 'mode'}
            <span class="dads-switch-mode">
                <button
                    {...$$restProps}
                    {id}
                    class="dads-switch-mode__option"
                    type="button"
                    role="switch"
                    aria-checked={!checked}
                    aria-required={required || undefined}
                    aria-invalid={errorText ? 'true' : $$restProps['aria-invalid']}
                    aria-describedby={describedBy}
                    {disabled}
                    on:click={toggleMode}
                    on:input
                    on:change
                    on:focus
                    on:blur
                >
                    <span class="dads-switch-mode__label">{leftLabel}</span>
                </button>
                <span class="dads-switch-mode__control" aria-hidden="true">
                    <span class="dads-switch-mode__rail">
                        <span class="dads-switch-mode__thumb"></span>
                    </span>
                </span>
                <button
                    {...$$restProps}
                    id={`${id}-right`}
                    class="dads-switch-mode__option"
                    type="button"
                    role="switch"
                    aria-checked={checked}
                    aria-required={required || undefined}
                    aria-invalid={errorText ? 'true' : $$restProps['aria-invalid']}
                    aria-describedby={describedBy}
                    {disabled}
                    on:click={toggleMode}
                    on:input
                    on:change
                    on:focus
                    on:blur
                >
                    <span class="dads-switch-mode__label">{rightLabel}</span>
                </button>
            </span>
        {:else}
            <span class="dads-switch-on-off">
                <span class="dads-switch-on-off__button">
                    <!-- A native checkbox provides binding, form submission and validation. -->
                    <input
                        {...$$restProps}
                        {id}
                        {name}
                        {value}
                        class="dads-switch-on-off__input"
                        type="checkbox"
                        role="switch"
                        bind:checked
                        {disabled}
                        {required}
                        aria-invalid={errorText ? 'true' : $$restProps['aria-invalid']}
                        aria-describedby={describedBy}
                        on:click={preventDisabled}
                        on:input
                        on:change
                        on:focus
                        on:blur
                    />
                    <span class="dads-switch-on-off__track" aria-hidden="true">
                        <span class="dads-switch-on-off__thumb">
                            <svg class="dads-switch-on-off__icon" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                                <path d="m10.4 16.3-4.1-4.1 1.2-1.3 2.9 2.9 6-6.1 1.3 1.2z" fill="currentcolor" />
                            </svg>
                        </span>
                    </span>
                </span>
            </span>
        {/if}
    </div>

    {#if errorText}
        <p id={errorTextId} class="dads-form-control-label__error-text">{errorText}</p>
    {/if}
</fieldset>

<style>
    .dads-form-control-label {
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: calc(8 / 16 * 1rem);
        border: 0;
        padding: 0;
        color: var(--color-neutral-solid-gray-800);
        font-weight: normal;
        font-size: calc(16 / 16 * 1rem);
        line-height: 1.7;
        font-family: var(--font-family-sans);
        letter-spacing: 0.02em;
    }

    .dads-form-control-label :global(.dads-form-control-label__label) {
        align-self: start;
        padding: 0;
        font-weight: bold;
        font-size: calc(17 / 16 * 1rem);
    }

    legend.dads-form-control-label__label {
        margin-bottom: calc(8 / 16 * 1rem);
        float: none;
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

    .dads-form-control-label :global(.dads-form-control-label__support-text) {
        margin-top: 0;
        margin-bottom: 0;
        color: var(--color-neutral-solid-gray-600);
    }

    .dads-form-control-label__error-text {
        margin: 0;
        color: var(--color-semantic-error-1);
        line-height: 1.3;
        letter-spacing: 0;
    }

    .dads-switch-on-off {
        display: inline-flex;
        align-items: center;
    }

    .dads-switch-on-off__button {
        --switch-on-off-track-bg-color: var(--color-neutral-white);
        --switch-on-off-track-border-color: var(--color-neutral-solid-gray-600);
        --switch-on-off-track-shadow: none;
        --switch-on-off-thumb-color: var(--color-neutral-solid-gray-800);
        position: relative;
        box-sizing: border-box;
        flex-shrink: 0;
        border: 0;
        background: none;
        padding: 0;
        color: inherit;
        font: inherit;
        -webkit-tap-highlight-color: transparent;
        -webkit-user-select: none;
        user-select: none;
    }

    .dads-switch-on-off__input {
        position: absolute;
        inset: calc(-4 / 16 * 1rem) 0;
        z-index: 1;
        box-sizing: border-box;
        margin: 0;
        width: 100%;
        height: calc(100% + 8 / 16 * 1rem);
        opacity: 0;
    }

    .dads-switch-on-off__button:has(.dads-switch-on-off__input:focus-visible) {
        outline: calc(4 / 16 * 1rem) solid var(--color-neutral-black);
        outline-offset: calc(2 / 16 * 1rem);
        box-shadow: 0 0 0 calc(2 / 16 * 1rem) var(--color-primitive-yellow-300);
        border-radius: calc(9999 / 16 * 1rem);
    }

    .dads-switch-on-off__track {
        position: relative;
        display: block;
        box-sizing: border-box;
        width: calc(56 / 16 * 1rem);
        border-radius: calc(9999 / 16 * 1rem);
        border: 2px solid var(--switch-on-off-track-border-color);
        background-color: var(--switch-on-off-track-bg-color);
        box-shadow: var(--switch-on-off-track-shadow);
        padding: calc(4 / 16 * 1rem);
    }

    .dads-switch-on-off__thumb {
        display: block;
        width: calc(24 / 16 * 1rem);
        height: calc(24 / 16 * 1rem);
        border-radius: 50%;
        background-color: var(--switch-on-off-thumb-color);
    }

    .dads-switch-on-off__icon {
        display: none;
        width: calc(24 / 16 * 1rem);
        height: calc(24 / 16 * 1rem);
        flex-shrink: 0;
        color: var(--color-neutral-white);
    }

    .dads-switch-on-off__button:has(:checked) {
        --switch-on-off-track-bg-color: var(--color-key-50);
        --switch-on-off-track-border-color: var(--color-key-900);
        --switch-on-off-thumb-color: var(--color-key-900);
    }

    .dads-switch-on-off__button:has(:checked) .dads-switch-on-off__thumb {
        margin-left: auto;
    }

    .dads-switch-on-off__button:has(:checked) .dads-switch-on-off__icon {
        display: block;
    }

    @media (hover: hover) {
        .dads-switch-on-off__button:hover {
            --switch-on-off-track-border-color: var(--color-neutral-black);
            --switch-on-off-track-shadow: 0 0 0 calc(4 / 16 * 1rem) var(--color-neutral-solid-gray-420);
            --switch-on-off-thumb-color: var(--color-neutral-black);
        }

        .dads-switch-on-off__button:where(:has(:checked)):hover {
            --switch-on-off-track-border-color: var(--color-key-1100);
            --switch-on-off-thumb-color: var(--color-key-1100);
        }

        .dads-switch-on-off__button:active {
            --switch-on-off-track-shadow: 0 0 0 calc(6 / 16 * 1rem) var(--color-neutral-solid-gray-600);
        }
    }

    .dads-switch-on-off__button:has(:disabled, [aria-disabled="true"]) {
        --switch-on-off-track-bg-color: var(--color-neutral-solid-gray-50);
        --switch-on-off-track-border-color: var(--color-neutral-solid-gray-300);
        --switch-on-off-track-shadow: none;
        --switch-on-off-thumb-color: var(--color-neutral-solid-gray-300);
    }

    @media (forced-colors: active) {
        .dads-switch-on-off__track {
            border-color: ButtonText;
        }

        .dads-switch-on-off__thumb {
            background-color: ButtonText;
        }

        .dads-switch-on-off__icon {
            color: Canvas;
        }

        .dads-switch-on-off__button:has(:checked) .dads-switch-on-off__track {
            border-color: Highlight;
        }

        .dads-switch-on-off__button:has(:checked) .dads-switch-on-off__thumb {
            background-color: Highlight;
        }

        .dads-switch-on-off__button:has(:disabled, [aria-disabled="true"]) .dads-switch-on-off__track {
            border-color: GrayText;
        }

        .dads-switch-on-off__button:has(:disabled, [aria-disabled="true"]) .dads-switch-on-off__thumb {
            background-color: GrayText;
        }
    }

    .dads-switch-mode {
        isolation: isolate;
        display: inline-flex;
        align-items: center;
        gap: calc(16 / 16 * 1rem);
        color: var(--color-neutral-solid-gray-800);
        font-weight: normal;
        font-size: calc(16 / 16 * 1rem);
        line-height: 1;
        font-family: var(--font-family-sans);
        letter-spacing: 0.02em;
    }

    .dads-switch-mode__option {
        position: relative;
        display: flex;
        align-self: stretch;
        align-items: center;
        border: 0;
        background: none;
        padding: 0;
        color: inherit;
        font: inherit;
        letter-spacing: inherit;
        text-align: inherit;
        -webkit-tap-highlight-color: transparent;
        -webkit-user-select: none;
        user-select: none;
    }

    /* The source's hit area includes the rail between the two options. */
    .dads-switch-mode__option::before {
        position: absolute;
        inset: calc(-8 / 16 * 1rem) 0;
        content: "";
    }

    .dads-switch-mode__option::after {
        position: absolute;
        inset: 0;
        content: "";
    }

    .dads-switch-mode__option:first-of-type::before,
    .dads-switch-mode__option:first-of-type::after {
        right: calc(-1 * (60 + 16) / 16 * 1rem);
    }

    .dads-switch-mode__option:last-of-type::before,
    .dads-switch-mode__option:last-of-type::after {
        left: calc(-1 * (60 + 16) / 16 * 1rem);
    }

    .dads-switch-mode__option[aria-checked="true"] {
        z-index: -1;
    }

    .dads-switch-mode__option:focus-visible {
        outline: none;
        box-shadow: none;
    }

    .dads-switch-mode__option:focus-visible::after {
        outline: calc(4 / 16 * 1rem) solid var(--color-neutral-black);
        outline-offset: calc(2 / 16 * 1rem);
        box-shadow: 0 0 0 calc(2 / 16 * 1rem) var(--color-primitive-yellow-300);
        border-radius: calc(9999 / 16 * 1rem);
    }

    .dads-switch-mode__control {
        position: relative;
        box-sizing: border-box;
        flex-shrink: 0;
        width: calc(60 / 16 * 1rem);
        border-radius: calc(9999 / 16 * 1rem);
        padding: calc(6 / 16 * 1rem);
        pointer-events: none;
    }

    @media (hover: hover) {
        .dads-switch-mode:hover .dads-switch-mode__control {
            box-shadow: 0 0 0 calc(4 / 16 * 1rem) var(--color-neutral-solid-gray-420);
        }

        .dads-switch-mode:active .dads-switch-mode__control {
            box-shadow: 0 0 0 calc(6 / 16 * 1rem) var(--color-neutral-solid-gray-600);
        }
    }

    .dads-switch-mode__rail {
        box-sizing: border-box;
        display: block;
        height: calc(16 / 16 * 1rem);
        border-radius: calc(8 / 16 * 1rem);
        background-color: var(--color-primitive-blue-100);
        border: 2px solid var(--color-primitive-blue-900);
    }

    @media (hover: hover) {
        .dads-switch-mode:hover .dads-switch-mode__rail {
            border-color: var(--color-primitive-blue-1100);
        }
    }

    .dads-switch-mode__thumb {
        position: absolute;
        inset: -100% auto -100% 0;
        margin-top: auto;
        margin-bottom: auto;
        box-sizing: content-box;
        width: calc(24 / 16 * 1rem);
        height: calc(24 / 16 * 1rem);
        border-radius: 50%;
        border: 2px solid var(--color-neutral-white);
        background-color: var(--color-primitive-blue-900);
    }

    .dads-switch-mode:has(:last-of-type[aria-checked="true"]) .dads-switch-mode__thumb {
        left: calc(32 / 16 * 1rem);
    }

    @media (hover: hover) {
        .dads-switch-mode:hover .dads-switch-mode__thumb {
            background-color: var(--color-primitive-blue-1100);
        }
    }

    .dads-switch-mode:has(:disabled, [aria-disabled="true"]) {
        color: var(--color-neutral-solid-gray-300);
    }

    .dads-switch-mode:has(:disabled, [aria-disabled="true"]) .dads-switch-mode__control {
        box-shadow: none;
    }

    .dads-switch-mode__option[aria-disabled="true"]:focus-visible::before {
        box-shadow: 0 0 0 calc(2 / 16 * 1rem) var(--color-primitive-yellow-300);
    }

    .dads-switch-mode:has(:disabled, [aria-disabled="true"]) .dads-switch-mode__rail {
        border-color: var(--color-neutral-solid-gray-300);
        background-color: var(--color-neutral-solid-gray-50);
    }

    .dads-switch-mode:has(:disabled, [aria-disabled="true"]) .dads-switch-mode__thumb {
        background-color: var(--color-neutral-solid-gray-300);
    }

    @media (forced-colors: active) {
        .dads-switch-mode:has(:disabled, [aria-disabled="true"]) {
            color: GrayText;
        }

        .dads-switch-mode__option:focus-visible::after {
            outline-color: Highlight;
        }

        .dads-switch-mode__rail,
        .dads-switch-mode:hover .dads-switch-mode__rail {
            border-color: ButtonText;
        }

        .dads-switch-mode__thumb,
        .dads-switch-mode:hover .dads-switch-mode__thumb {
            background-color: ButtonText;
            border-color: Canvas;
        }

        .dads-switch-mode:has(:disabled, [aria-disabled="true"]) .dads-switch-mode__thumb {
            background-color: GrayText;
        }
    }
</style>
