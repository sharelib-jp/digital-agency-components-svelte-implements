<script context="module" lang="ts">
    export interface SearchScopeOption {
        value: string;
        label: string;
        disabled?: boolean;
    }

    export interface SearchBoxSearchDetail {
        value: string;
        scope: string;
        formData: FormData;
        originalEvent: SubmitEvent;
    }
</script>

<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { HTMLInputAttributes } from 'svelte/elements';

    export let id: string | undefined = undefined;
    export let size: 'lg' | 'md' | 'sm' = 'lg';
    export let value: string = '';
    export let name: string = 'q';
    export let label: string = '検索';
    export let formLabel: string = 'サイト内検索';
    export let ariaLabelledby: string | undefined = undefined;
    export let placeholder: string = '';
    export let autocomplete: NonNullable<HTMLInputAttributes['autocomplete']> = 'off';
    export let required: boolean = false;
    export let readonly: boolean = false;
    export let disabled: boolean = false;
    export let action: string | undefined = undefined;
    export let method: 'get' | 'post' = 'get';
    export let preventDefault: boolean = true;
    export let buttonLabel: string = '検索';
    export let scopeOptions: SearchScopeOption[] = [];
    export let scope: string = '';
    export let scopeName: string = 'scope';
    export let scopeLabel: string = '検索対象';
    export let detailLabel: string = '詳細検索';
    export let detailOpen: boolean = false;
    export let resetLabel: string = '検索条件をクリア';

    const dispatch = createEventDispatcher<{
        search: SearchBoxSearchDetail;
        reset: { originalEvent: Event };
    }>();

    $: hasScope = scopeOptions.length > 0;
    $: scopeDisabled = disabled || !scopeOptions.some((option) => !option.disabled);
    $: if (hasScope && !scopeOptions.some((option) => option.value === scope && !option.disabled)) {
        scope = scopeOptions.find((option) => !option.disabled)?.value ?? '';
    }

    function handleSubmit(event: SubmitEvent) {
        if (disabled) {
            event.preventDefault();
            return;
        }

        if (preventDefault) event.preventDefault();
        const form = event.currentTarget as HTMLFormElement;
        const accepted = dispatch(
            'search',
            {
                value,
                scope: hasScope && !scopeDisabled ? scope : '',
                formData: new FormData(form),
                originalEvent: event,
            },
            { cancelable: true },
        );
        if (!accepted) event.preventDefault();
    }

    function handleReset(event: Event) {
        if (disabled || !dispatch('reset', { originalEvent: event }, { cancelable: true })) {
            event.preventDefault();
        }
    }
</script>

<form
    class="dads-search-box"
    data-size={size}
    role="search"
    aria-label={formLabel}
    {action}
    {method}
    on:submit={handleSubmit}
    on:reset={handleReset}
>
    <div class="dads-search-box__fields">
        {#if hasScope}
            <label class="dads-search-box__select">
                <span>{scopeLabel}</span>
                <select name={scopeName} bind:value={scope} disabled={scopeDisabled}>
                    {#each scopeOptions as option}
                        <option value={option.value} disabled={option.disabled}>{option.label}</option>
                    {/each}
                </select>
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 17L3 8L4 7L12 15L20 7L21 8L12 17Z" fill="currentcolor" />
                </svg>
            </label>
        {/if}
        <label class="dads-search-box__input">
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
                <path d="m21 20.5-6-6a7.4 7.4 0 0 0 1.9-5A7.4 7.4 0 0 0 9.5 2 7.5 7.5 0 1 0 14 15.5l6 6 1-1ZM3.5 9.5a6 6 0 0 1 6-6 6 6 0 0 1 6 6 6 6 0 0 1-6 6 6 6 0 0 1-6-6Z" fill="currentcolor" />
            </svg>
            <span class="dads-u-visually-hidden">{label}</span>
            <input
                {id}
                type="search"
                {name}
                bind:value
                {placeholder}
                {autocomplete}
                {required}
                {readonly}
                {disabled}
                aria-labelledby={ariaLabelledby}
            />
        </label>
    </div>

    {#if $$slots.detail}
        <details class="dads-search-box__detail dads-disclosure" bind:open={detailOpen}>
            <summary class="dads-disclosure__summary">
                <svg class="dads-disclosure__icon" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="11" fill="currentcolor" />
                    <circle class="dads-disclosure__icon-circle" cx="12" cy="12" r="8" fill="currentcolor" />
                    <path class="dads-disclosure__icon-triangle" d="M17 10H7L12 15L17 10Z" fill="Canvas" />
                </svg>
                {detailLabel}
            </summary>
            <div class="dads-disclosure__content">
                <fieldset class="dads-search-box__detail-fields" {disabled}>
                    <slot name="detail" />
                </fieldset>
                <div class="dads-search-box__detail-actions">
                    <button class="dads-button" type="submit" data-type="solid-fill" data-size={size} {disabled}>
                        <svg class="dads-button__icon" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="m21 20.5-6-6a7.4 7.4 0 0 0 1.9-5A7.4 7.4 0 0 0 9.5 2 7.5 7.5 0 1 0 14 15.5l6 6 1-1ZM3.5 9.5a6 6 0 0 1 6-6 6 6 0 0 1 6 6 6 6 0 0 1-6 6 6 6 0 0 1-6-6Z" fill="currentcolor" />
                        </svg>
                        {buttonLabel}
                    </button>
                    <button class="dads-button" type="reset" data-type="text" data-size="sm" {disabled}>{resetLabel}</button>
                </div>
            </div>
        </details>
    {/if}

    <button class="dads-button" type="submit" data-type="solid-fill" data-size={size} {disabled}>{buttonLabel}</button>
</form>

<style>
    .dads-search-box {
        display: grid;
        grid-template-areas: 'fields submit' 'detail detail';
        grid-template-columns: minmax(0, 1fr) auto;
        column-gap: calc(16 / 16 * 1rem);
        margin: 0;
        color: var(--color-neutral-solid-gray-900);
        font-weight: normal;
        font-size: calc(16 / 16 * 1rem);
        line-height: 1;
        font-family: var(--font-family-sans);
        letter-spacing: 0.02em;
    }

    .dads-search-box__fields {
        position: relative;
        z-index: 0;
        display: flex;
        min-width: 0;
        grid-area: fields;
    }

    .dads-search-box__select {
        position: relative;
        display: flex;
        flex-shrink: 0;
    }

    .dads-search-box__select > span {
        position: absolute;
        top: calc(50% - 20 / 16 * 1rem);
        left: calc(17 / 16 * 1rem);
        color: var(--color-neutral-solid-gray-700);
        pointer-events: none;
        z-index: 2;
    }

    .dads-search-box__select > select {
        appearance: none;
        display: flex;
        align-items: center;
        overflow: hidden;
        box-sizing: border-box;
        width: calc(160 / 16 * 1rem);
        border-radius: calc(8 / 16 * 1rem) 0 0 calc(8 / 16 * 1rem);
        border: 1px solid var(--color-neutral-solid-gray-600);
        background-color: var(--color-neutral-solid-gray-50);
        padding: calc(20 / 16 * 1rem) calc(40 / 16 * 1rem) 0 calc(16 / 16 * 1rem);
        color: var(--color-neutral-solid-gray-900);
        font: inherit;
        font-size: calc(17 / 16 * 1rem);
        line-height: 1;
        letter-spacing: 0.02em;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

    @supports (appearance: base-select) {
        .dads-search-box__select > select {
            appearance: base-select;
        }

        .dads-search-box__select > select::picker-icon {
            display: none;
        }

        .dads-search-box__select > select::picker(select) {
            appearance: base-select;
            border: 1px solid var(--color-neutral-solid-gray-420);
            box-shadow: var(--elevation-1);
            padding: calc(16 / 16 * 1rem) 0;
        }
    }

    .dads-search-box__select > svg {
        position: absolute;
        top: 0;
        right: calc(16 / 16 * 1rem);
        bottom: 0;
        z-index: 1;
        margin: auto 0;
        display: flex;
        align-items: center;
        width: calc(16 / 16 * 1rem);
        height: calc(16 / 16 * 1rem);
        pointer-events: none;
    }

    .dads-search-box__select > select:focus-visible {
        position: relative;
        z-index: 1;
        outline: calc(4 / 16 * 1rem) solid var(--color-neutral-black);
        outline-offset: calc(2 / 16 * 1rem);
        box-shadow: 0 0 0 calc(2 / 16 * 1rem) var(--color-primitive-yellow-300);
    }

    @media (hover: hover) {
        .dads-search-box__select > select:enabled:hover {
            border-color: var(--color-neutral-black);
        }
    }

    .dads-search-box__select option {
        display: flex;
        align-items: center;
        box-sizing: border-box;
        min-height: calc(44 / 16 * 1rem);
        padding: calc(10 / 16 * 1rem) calc(16 / 16 * 1rem);
        color: var(--color-neutral-solid-gray-900);
    }

    .dads-search-box__select option::checkmark {
        display: none;
    }

    @media (hover: hover) {
        .dads-search-box__select option:enabled:hover {
            background-color: var(--color-neutral-solid-gray-50);
            text-decoration: underline;
            text-decoration-thickness: calc(1 / 16 * 1rem);
            text-underline-offset: calc(3 / 16 * 1rem);
        }
    }

    .dads-search-box__select option:checked {
        font-weight: bold;
        background-color: var(--color-key-100);
        color: var(--color-key-1000);
    }

    @media (hover: hover) {
        .dads-search-box__select option:checked:enabled:hover {
            background-color: var(--color-key-50);
            color: var(--color-key-900);
        }
    }

    .dads-search-box__select option:focus-visible {
        border-radius: 0;
        outline: calc(4 / 16 * 1rem) solid var(--color-neutral-black);
        outline-offset: calc(-4 / 16 * 1rem);
        box-shadow: none;
    }

    .dads-search-box__select option:not(:checked):focus-visible {
        background-color: var(--color-primitive-yellow-300);
    }

    .dads-search-box__select option:checked:focus-visible {
        box-shadow: inset 0 0 0 calc(6 / 16 * 1rem) var(--color-primitive-yellow-300);
    }

    .dads-search-box__input {
        flex-grow: 1;
        min-width: 0;
        position: relative;
        display: flex;
    }

    .dads-search-box__input > svg {
        position: absolute;
        top: 0;
        bottom: 0;
        left: calc(16 / 16 * 1rem);
        z-index: 1;
        margin: auto 0;
        width: calc(24 / 16 * 1rem);
        height: calc(24 / 16 * 1rem);
        color: var(--color-neutral-solid-gray-600);
        pointer-events: none;
    }

    .dads-search-box__input > input {
        flex-grow: 1;
        box-sizing: border-box;
        width: calc(128 / 16 * 1rem);
        min-width: 0;
        border: 1px solid var(--color-neutral-solid-gray-600);
        border-radius: calc(8 / 16 * 1rem);
        background-color: var(--color-neutral-white);
        padding: calc(12 / 16 * 1rem) calc(16 / 16 * 1rem) calc(12 / 16 * 1rem) calc(48 / 16 * 1rem);
        color: inherit;
        font: inherit;
    }

    .dads-search-box__input:not(:first-child) > input {
        margin-left: calc(-1 / 16 * 1rem);
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
    }

    @media (hover: hover) {
        .dads-search-box__input > input:enabled:hover {
            border-color: var(--color-neutral-black);
        }
    }

    .dads-search-box__input > input::-webkit-search-cancel-button {
        display: none;
    }

    .dads-search-box__input > input::placeholder {
        color: var(--color-neutral-solid-gray-600);
    }

    .dads-search-box__input > input:focus-visible {
        position: relative;
        outline: calc(4 / 16 * 1rem) solid var(--color-neutral-black);
        outline-offset: calc(2 / 16 * 1rem);
        box-shadow: 0 0 0 calc(2 / 16 * 1rem) var(--color-primitive-yellow-300);
    }

    .dads-search-box__input > input:disabled,
    .dads-search-box__select > select:disabled {
        border-color: var(--color-neutral-solid-gray-300);
        background-color: var(--color-neutral-solid-gray-50);
        color: var(--color-neutral-solid-gray-420);
        cursor: default;
    }

    .dads-search-box__detail {
        margin-top: calc(16 / 16 * 1rem);
        grid-area: detail;
        width: fit-content;
        border: 1px solid var(--color-neutral-solid-gray-600);
        border-radius: calc(8 / 16 * 1rem);
        padding: calc(12 / 16 * 1rem) calc(16 / 16 * 1rem);
        color: var(--color-neutral-solid-gray-800);
        font-weight: normal;
        font-size: calc(16 / 16 * 1rem);
        line-height: 1.7;
        font-family: var(--font-family-sans);
        letter-spacing: 0.02em;
    }

    .dads-search-box__detail[open] {
        width: auto;
        padding-bottom: calc(24 / 16 * 1rem);
    }

    .dads-disclosure__summary {
        display: flex;
        align-items: start;
        justify-content: start;
        gap: calc(8 / 16 * 1rem);
        width: fit-content;
        margin: calc(-12 / 16 * 1rem) calc(-16 / 16 * 1rem);
        padding: calc(12 / 16 * 1rem) calc(16 / 16 * 1rem);
        cursor: default;
        list-style-type: none;
    }

    .dads-disclosure__summary::marker {
        content: '';
    }

    .dads-disclosure__summary::-webkit-details-marker {
        display: none;
    }

    .dads-disclosure__summary:focus-visible {
        outline: calc(4 / 16 * 1rem) solid var(--color-neutral-black);
        outline-offset: calc(2 / 16 * 1rem);
        border-radius: calc(4 / 16 * 1rem);
        background-color: var(--color-primitive-yellow-300);
        box-shadow: 0 0 0 calc(2 / 16 * 1rem) var(--color-primitive-yellow-300);
    }

    .dads-disclosure__icon {
        flex-shrink: 0;
        margin-top: calc((1lh - 24 / 16 * 1rem) / 2);
        color: var(--color-key-1000);
    }

    .dads-disclosure[open] .dads-disclosure__icon {
        rotate: 180deg;
    }

    @media (hover: hover) {
        .dads-disclosure__summary:hover {
            text-decoration: underline;
            text-underline-offset: calc(3 / 16 * 1rem);
        }

        .dads-disclosure__summary:hover .dads-disclosure__icon-circle {
            fill: Canvas;
        }

        .dads-disclosure__summary:hover .dads-disclosure__icon-triangle {
            fill: currentcolor;
        }
    }

    .dads-disclosure__content {
        margin: calc(32 / 16 * 1rem) 0 0;
        padding-left: 0;
    }

    .dads-search-box__detail-fields {
        min-width: 0;
        margin: 0 0 calc(32 / 16 * 1rem);
        border: 0;
        padding: 0;
    }

    .dads-search-box__detail-actions {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: calc(16 / 16 * 1rem);
    }

    .dads-search-box__detail-actions .dads-button[data-type='solid-fill'] {
        width: 100%;
    }

    @media (min-width: 48rem) {
        .dads-search-box__detail-actions .dads-button[data-type='solid-fill'] {
            width: fit-content;
            min-width: 50%;
        }
    }

    .dads-search-box > .dads-button {
        grid-area: submit;
    }

    .dads-search-box__detail[open] + .dads-button {
        visibility: hidden;
    }

    .dads-search-box[data-size='md'] .dads-search-box__select > span {
        top: calc(50% - 18 / 16 * 1rem);
    }

    .dads-search-box[data-size='md'] .dads-search-box__select > select {
        padding-top: calc(18 / 16 * 1rem);
    }

    .dads-search-box[data-size='md'] .dads-search-box__input > input {
        padding-top: calc(11 / 16 * 1rem);
        padding-bottom: calc(11 / 16 * 1rem);
    }

    .dads-search-box[data-size='sm'] .dads-search-box__select > span,
    .dads-u-visually-hidden {
        clip: rect(0 0 0 0);
        clip-path: inset(50%);
        height: calc(1 / 16 * 1rem);
        overflow: hidden;
        position: absolute;
        white-space: nowrap;
        width: calc(1 / 16 * 1rem);
    }

    .dads-search-box[data-size='sm'] .dads-search-box__select > select {
        padding-top: 0;
    }

    .dads-search-box[data-size='sm'] .dads-search-box__input > input {
        padding-top: calc(7 / 16 * 1rem);
        padding-bottom: calc(7 / 16 * 1rem);
    }

    .dads-button {
        --button-color: var(--color-key-900);
        --button-hover-color: var(--color-key-1000);
        --button-active-color: var(--color-key-1200);
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

    .dads-button[data-type='solid-fill'] {
        border: 4px double transparent;
        background-color: var(--button-color);
        color: var(--color-neutral-white);
    }

    .dads-button[data-type='text'] {
        border: 0;
        background-color: transparent;
        color: var(--button-color);
        text-decoration: underline;
        text-decoration-thickness: calc(1 / 16 * 1rem);
    }

    @media (hover: hover) {
        .dads-button[data-type='solid-fill']:where(:enabled):hover {
            background-color: var(--button-hover-color);
            text-decoration: underline;
            text-decoration-thickness: calc(1 / 16 * 1rem);
        }

        .dads-button[data-type='text']:where(:enabled):hover {
            background-color: var(--color-key-50);
            color: var(--button-hover-color);
            text-decoration-thickness: calc(3 / 16 * 1rem);
        }
    }

    .dads-button[data-type='solid-fill']:where(:enabled):active {
        background-color: var(--button-active-color);
        text-decoration: underline;
    }

    .dads-button[data-type='text']:where(:enabled):active {
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

    .dads-button:disabled {
        cursor: default;
    }

    .dads-button[data-type='solid-fill']:disabled {
        background-color: var(--color-neutral-solid-gray-300);
        color: var(--color-neutral-solid-gray-50);
        text-decoration: none;
    }

    .dads-button[data-type='text']:disabled {
        background-color: transparent;
        color: var(--color-neutral-solid-gray-300);
        text-decoration-thickness: revert;
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

    .dads-button[data-size='sm']::after {
        content: '';
        position: absolute;
        inset: 0;
        margin: auto;
        height: calc(44 / 16 * 1rem);
    }

    .dads-button__icon {
        flex-shrink: 0;
    }

    @media (forced-colors: active) {
        .dads-search-box__input > svg {
            color: CanvasText;
        }

        .dads-disclosure__icon {
            color: inherit;
        }

        .dads-search-box__input > input:disabled,
        .dads-search-box__select > select:disabled,
        .dads-button:disabled {
            border-color: GrayText;
            color: GrayText;
        }
    }
</style>
