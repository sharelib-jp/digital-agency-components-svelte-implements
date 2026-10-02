<script lang="ts">
    import { onDestroy } from 'svelte';
    import FormControlLabel from './FormControlLabel.svelte';

    export let id: string;
    export let name: string | undefined = undefined;
    export let value: string = '';
    export let label: string = '';
    export let size: 'sm' | 'md' | 'lg' = 'md';
    export let rows: number | undefined = undefined;
    export let cols: number | undefined = undefined;
    export let readonly: boolean = false;
    export let readonlyText: string = '編集不可';
    export let disabled: boolean = false;
    export let required: boolean = false;
    export let supportText: string | null = null;
    export let errorText: string | null = null;
    export let counterMax: number | null = null;
    export let counterErrorMessage: string = '{count}文字超過しています';
    export let counterExceededMessage: string = '{count}文字超過';
    export let counterRemainingMessage: string = '残り{count}文字';
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

<div class={`dads-form-control-label ${Class}`} data-size={size}>
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
