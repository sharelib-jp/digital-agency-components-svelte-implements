<script lang="ts">
    import FormControlLabel from './FormControlLabel.svelte';

    export let id: string | undefined = undefined;
    export let size: 'sm' | 'md' | 'lg' = 'sm';
    export let readonly: boolean = false;
    export let disabled: boolean = false;
    export let value: string = '';
    export let errorText: string | null = null;

    export let label: string = '';
    export let required: boolean = false;
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

<div class="dads-input-text-field">
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
            type="text"
            data-size={size}
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
