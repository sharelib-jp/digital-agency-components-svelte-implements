<script context="module" lang="ts">
    import type { HTMLAnchorAttributes } from 'svelte/elements';

    export type ResourceListStyle = 'list' | 'frame';
    export type ResourceListInteraction = 'inline' | 'whole';

    export interface ResourceListAction {
        label: string;
        icon?: 'menu' | 'download';
        disabled?: boolean;
    }

    interface ResourceListItemBase {
        // IDs are supplied by the parent so label associations are stable during SSR.
        id: string;
        title: string;
        label?: string;
        supportText?: string;
        subLabel?: string;
        icon?: boolean;
        style?: ResourceListStyle;
        interaction?: ResourceListInteraction;
        square?: boolean;
        action?: ResourceListAction;
    }

    interface ResourceListControl {
        checked?: boolean;
        disabled?: boolean;
        required?: boolean;
        value?: string;
        form?: string;
        invalid?: boolean;
        describedBy?: string;
    }

    export type ResourceListItem = ResourceListItemBase &
        (
            | { type?: 'plain' }
            | {
                  type: 'link';
                  href: string;
                  target?: HTMLAnchorAttributes['target'];
                  rel?: string;
              }
            | (ResourceListControl & { type: 'checkbox'; name?: string })
            | (ResourceListControl & { type: 'radio'; name: string })
        );

    export interface ResourceListChangeDetail {
        item: ResourceListItem;
        index: number;
        checked: boolean;
        items: ResourceListItem[];
        originalEvent: Event;
    }

    export interface ResourceListActionDetail {
        item: ResourceListItem;
        index: number;
        originalEvent: MouseEvent;
    }
</script>

<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    export let items: ResourceListItem[] = [];
    export let style: ResourceListStyle = 'list';
    export let interaction: ResourceListInteraction = 'inline';
    export let headingLevel: 'h2' | 'h3' | 'h4' | 'h5' | 'h6' = 'h2';
    export let gap: number = 16;
    export let square: boolean = false;
    export let Class: string = '';

    const dispatch = createEventDispatcher<{
        change: ResourceListChangeDetail;
        action: ResourceListActionDetail;
    }>();

    function linkRel(item: ResourceListItem): string | undefined {
        if (item.type !== 'link') return undefined;
        return item.target === '_blank' ? `${item.rel ?? ''} noopener noreferrer`.trim() : item.rel;
    }

    function handleChange(item: ResourceListItem, index: number, event: Event): void {
        if (item.type !== 'checkbox' && item.type !== 'radio') return;
        if (item.disabled) return;

        const checked = (event.currentTarget as HTMLInputElement).checked;
        items = items.map((entry, entryIndex) => {
            if (entryIndex === index) return { ...entry, checked };
            if (
                checked &&
                item.type === 'radio' &&
                entry.type === 'radio' &&
                entry.name === item.name &&
                entry.form === item.form
            ) {
                return { ...entry, checked: false };
            }
            return entry;
        });
        dispatch('change', { item: items[index], index, checked, items, originalEvent: event });
    }
</script>

<ul
    {...$$restProps}
    class={`dads-resource-list__items ${Class}`.trim()}
    style:--resource-list-gap={`${gap / 16}rem`}
    role="list"
>
    {#each items as item, index (item.id)}
        {@const isControl = item.type === 'checkbox' || item.type === 'radio'}
        {@const whole = (item.interaction ?? interaction) === 'whole'}
        <li class="dads-resource-list__item">
            <div
                class="dads-resource-list"
                data-style={item.style ?? style}
                data-interaction={isControl && whole ? 'whole' : undefined}
                data-square={(item.square ?? square) ? '' : undefined}
            >
                <svelte:element
                    this={item.type === 'link' && whole ? 'a' : 'div'}
                    class="dads-resource-list__body"
                    href={item.type === 'link' && whole ? item.href : undefined}
                    target={item.type === 'link' && whole ? item.target : undefined}
                    rel={item.type === 'link' && whole ? linkRel(item) : undefined}
                >
                    {#if item.type === 'checkbox'}
                        <label class="dads-checkbox" data-size="md" for={item.id}>
                            <span class="dads-checkbox__checkbox">
                                <input
                                    id={item.id}
                                    class="dads-checkbox__input"
                                    type="checkbox"
                                    name={item.name}
                                    value={item.value ?? item.id}
                                    checked={item.checked ?? false}
                                    disabled={item.disabled ?? false}
                                    required={item.required ?? false}
                                    form={item.form}
                                    aria-invalid={item.invalid ? 'true' : undefined}
                                    aria-describedby={item.describedBy}
                                    on:change={(event) => handleChange(item, index, event)}
                                />
                            </span>
                        </label>
                    {:else if item.type === 'radio'}
                        <label class="dads-radio" data-size="md" for={item.id}>
                            <span class="dads-radio__radio">
                                <input
                                    id={item.id}
                                    class="dads-radio__input"
                                    type="radio"
                                    name={item.name}
                                    value={item.value ?? item.id}
                                    checked={item.checked ?? false}
                                    disabled={item.disabled ?? false}
                                    required={item.required ?? false}
                                    form={item.form}
                                    data-invalid={item.invalid ? '' : undefined}
                                    aria-describedby={item.describedBy}
                                    on:change={(event) => handleChange(item, index, event)}
                                />
                            </span>
                        </label>
                    {/if}
                    {#if item.icon || $$slots.icon}
                        <span class="dads-resource-list__icon" aria-hidden="true">
                            <slot name="icon" {item} {index}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentcolor" aria-hidden="true">
                                    <path d="M4.6 20.5c-.5-.1-1-.6-1.1-1l16-16c.5.1.9.6 1 1l-16 16Zm-1.1-6.4v-2L12 3.4h2.1L3.5 14.1Zm0-7.4V5.3c0-1 .8-1.8 1.8-1.8h1.4L3.5 6.7Zm13.8 13.8 3.2-3.2v1.4c0 1-.8 1.8-1.8 1.8h-1.4Zm-7.4 0L20.5 9.9v2L12 20.6H9.9Z" />
                                </svg>
                            </slot>
                        </span>
                    {/if}
                    <div class="dads-resource-list__contents">
                        <svelte:element this={isControl ? 'p' : headingLevel} class="dads-resource-list__title">
                            {#if isControl}
                                <label for={item.id}>{item.title}</label>
                            {:else if item.type === 'link' && !whole}
                                <a href={item.href} target={item.target} rel={linkRel(item)}>{item.title}</a>
                            {:else}
                                {item.title}
                            {/if}
                        </svelte:element>
                        {#if item.label}
                            <div class="dads-resource-list__label"><p>{item.label}</p></div>
                        {/if}
                        {#if item.supportText}
                            <div class="dads-resource-list__support"><p>{item.supportText}</p></div>
                        {/if}
                    </div>
                    {#if item.subLabel}
                        <div class="dads-resource-list__sub"><p>{item.subLabel}</p></div>
                    {/if}
                </svelte:element>
                {#if item.action || $$slots.action}
                    <div class="dads-resource-list__action">
                        <slot name="action" {item} {index}>
                            {#if item.action}
                                <button
                                    class="dads-resource-list__action-button"
                                    type="button"
                                    aria-label={item.action.label}
                                    disabled={item.action.disabled || (isControl && whole && 'disabled' in item && item.disabled)}
                                    on:click={(originalEvent) => dispatch('action', { item, index, originalEvent })}
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentcolor" aria-hidden="true">
                                        {#if item.action.icon === 'download'}
                                            <path d="m12 15.8-4.3-4.3 1-1 2.6 2.4V4.5h1.4v8.4l2.5-2.5 1 1.1-4.2 4.3Zm-5.7 3.7c-.5 0-1-.2-1.3-.5-.3-.4-.5-.8-.5-1.3V15H6v2.7l.1.2.2.1h11.4l.2-.1.1-.2V15h1.5v2.7c0 .5-.2 1-.5 1.3-.4.3-.8.5-1.3.5H6.3Z" />
                                        {:else}
                                            <circle cx="12" cy="4.5" r="1.5" />
                                            <circle cx="12" cy="12" r="1.5" />
                                            <circle cx="12" cy="19.5" r="1.5" />
                                        {/if}
                                    </svg>
                                </button>
                            {/if}
                        </slot>
                    </div>
                {/if}
            </div>
        </li>
    {/each}
</ul>

<style>
    .dads-resource-list__items {
        margin: 0;
        display: grid;
        row-gap: var(--resource-list-gap);
        padding: 0;
        list-style-type: none;
    }

    .dads-resource-list__item {
        margin: 0;
        padding: 0;
    }

    .dads-resource-list {
        display: flex;
        align-items: center;
        background: var(--color-neutral-white);
        color: var(--color-neutral-solid-gray-800);
        font-family: var(--font-family-sans);
        overflow-wrap: anywhere;
        --_border-color: var(--color-neutral-solid-gray-420);
        --_padding-block: calc(16 / 16 * 1rem);
        --_padding-inline: calc(16 / 16 * 1rem);
    }

    .dads-resource-list[data-style='list'] {
        border: 1px solid transparent;
        border-bottom-color: var(--_border-color);
    }

    .dads-resource-list[data-style='frame'] {
        border-radius: calc(16 / 16 * 1rem);
        border: 1px solid var(--_border-color);
    }

    .dads-resource-list[data-square] {
        border-radius: 0;
    }

    .dads-resource-list:has(:checked:enabled) {
        background: var(--color-key-50);
        --_border-color: var(--color-neutral-solid-gray-500);
    }

    .dads-resource-list[data-interaction='whole']:has(:disabled) {
        background: var(--color-neutral-solid-gray-50);
        color: var(--color-neutral-solid-gray-420);
    }

    .dads-resource-list[data-style='list']:has(:disabled) {
        border-bottom-color: var(--color-neutral-solid-gray-300);
    }

    .dads-resource-list[data-style='frame']:has(:disabled) {
        border-color: var(--color-neutral-solid-gray-300);
    }

    .dads-resource-list__body {
        position: relative;
        z-index: 0;
        display: flex;
        flex-grow: 1;
        align-items: center;
        gap: calc(16 / 16 * 1rem);
        outline-offset: calc(-1 / 16 * 1rem);
        border-radius: inherit;
        padding: var(--_padding-block) var(--_padding-inline);
        color: inherit;
        text-decoration: none;
    }

    .dads-resource-list__body:not(:last-child) {
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
    }

    @media (hover: hover) {
        .dads-resource-list__body:any-link:hover,
        .dads-resource-list[data-interaction='whole']
            .dads-resource-list__body:has(:enabled):hover:not(:focus-visible) {
            outline: calc(2 / 16 * 1rem) solid var(--color-neutral-black);
            background: var(--color-neutral-solid-gray-50);
        }
    }

    .dads-resource-list__body:any-link:focus-visible {
        outline: calc(4 / 16 * 1rem) solid var(--color-neutral-black);
        outline-offset: calc(2 / 16 * 1rem);
        box-shadow: 0 0 0 calc(2 / 16 * 1rem) var(--color-primitive-yellow-300);
    }

    .dads-resource-list__body > * {
        flex-shrink: 0;
    }

    .dads-resource-list__body .dads-checkbox,
    .dads-resource-list__body .dads-radio {
        align-self: stretch;
        margin: calc(-1 * var(--_padding-block)) calc(-1 * var(--_padding-block));
        margin-right: 0;
        padding: var(--_padding-block) var(--_padding-inline);
        padding-right: 0;
        align-items: center;
    }

    .dads-resource-list__icon {
        display: flex;
        align-items: center;
    }

    .dads-resource-list__icon :global(svg) {
        display: block;
        width: calc(24 / 16 * 1rem);
        height: calc(24 / 16 * 1rem);
    }

    .dads-resource-list__contents {
        width: 0;
        display: flex;
        flex-grow: 1;
        flex-shrink: 1;
        flex-direction: column;
        gap: calc(4 / 16 * 1rem);
        font-weight: normal;
        font-size: calc(16 / 16 * 1rem);
        line-height: 1.3;
        letter-spacing: 0;
    }

    .dads-resource-list__contents > * {
        max-width: 100%;
    }

    .dads-resource-list__label {
        order: -1;
    }

    .dads-resource-list__label > * {
        margin: 0;
    }

    .dads-resource-list__title {
        margin: 0;
        color: var(--color-neutral-solid-gray-900);
        font-weight: bold;
        font-size: calc(20 / 16 * 1rem);
        line-height: 1.5;
        letter-spacing: 0.02em;
    }

    .dads-resource-list[data-interaction='whole']:has(:disabled) .dads-resource-list__title {
        color: inherit;
    }

    .dads-resource-list__body:any-link .dads-resource-list__title,
    .dads-resource-list__title a {
        color: var(--color-primitive-blue-1000);
        text-decoration: underline;
        text-decoration-thickness: calc(1 / 16 * 1rem);
        text-underline-offset: calc(3 / 16 * 1rem);
    }

    .dads-resource-list__title a,
    .dads-resource-list__title label {
        isolation: isolate;
        margin-top: calc(-8 / 16 * 1rem);
        margin-bottom: calc(-8 / 16 * 1rem);
        display: block;
        padding-top: calc(8 / 16 * 1rem);
        padding-bottom: calc(8 / 16 * 1rem);
    }

    .dads-resource-list[data-interaction='whole'] .dads-resource-list__title label::before {
        position: absolute;
        inset: 0;
        z-index: 1;
        border-radius: inherit;
        content: '';
    }

    @media (hover: hover) {
        .dads-resource-list__body:any-link:hover .dads-resource-list__title,
        .dads-resource-list__title a:hover {
            color: var(--color-primitive-blue-900);
            text-decoration-thickness: calc(3 / 16 * 1rem);
        }
    }

    .dads-resource-list__body:any-link:active .dads-resource-list__title,
    .dads-resource-list__title a:active {
        color: var(--color-primitive-orange-800);
        text-decoration-thickness: calc(1 / 16 * 1rem);
    }

    .dads-resource-list__title a:focus-visible {
        margin-top: 0;
        margin-bottom: 0;
        outline: calc(4 / 16 * 1rem) solid var(--color-neutral-black);
        outline-offset: calc(2 / 16 * 1rem);
        border-radius: calc(4 / 16 * 1rem);
        background-color: var(--color-primitive-yellow-300);
        padding-top: 0;
        padding-bottom: 0;
        box-shadow: 0 0 0 calc(2 / 16 * 1rem) var(--color-primitive-yellow-300);
    }

    .dads-resource-list__support > * {
        margin: 0;
        white-space: pre-line;
    }

    .dads-resource-list__sub {
        flex-shrink: 0;
        font-weight: normal;
        font-size: calc(16 / 16 * 1rem);
        line-height: 1.3;
        letter-spacing: 0;
    }

    .dads-resource-list__sub > * {
        margin: 0;
    }

    .dads-resource-list__action {
        flex-shrink: 0;
        align-self: stretch;
        border-top-right-radius: inherit;
        border-bottom-right-radius: inherit;
    }

    .dads-resource-list__action-button {
        box-sizing: border-box;
        width: calc(44 / 16 * 1rem);
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        border: 0;
        border-radius: inherit;
        background: transparent;
        padding: 0;
        color: inherit;
    }

    @media (hover: hover) {
        .dads-resource-list__action-button:enabled:hover {
            outline: calc(2 / 16 * 1rem) solid var(--color-neutral-black);
            outline-offset: calc(-1 / 16 * 1rem);
            background: var(--color-neutral-solid-gray-50);
        }
    }

    .dads-resource-list__action-button:focus-visible {
        outline: calc(4 / 16 * 1rem) solid var(--color-neutral-black);
        outline-offset: calc(-3 / 16 * 1rem);
        background: var(--color-primitive-yellow-300);
        box-shadow: none;
    }

    /* Resource lists use the md, label-free checkbox/radio variants. */
    .dads-checkbox,
    .dads-radio {
        display: flex;
        align-items: start;
        gap: calc(8 / 16 * 1rem);
        width: fit-content;
    }

    .dads-checkbox[data-size='md'] {
        --_checkbox-size: calc(32 / 16 * 1rem);
        --_checkbox-border-width: calc(2 / 16 * 1rem);
        --_checkbox-scale: calc(20 / 14);
    }

    .dads-radio[data-size='md'] {
        --_radio-size: calc(32 / 16 * 1rem);
        --_radio-outer-size: calc(26 / 16 * 1rem);
        --_radio-inner-size: calc(12 / 16 * 1rem);
        --_radio-border-width: calc(2 / 16 * 1rem);
    }

    .dads-checkbox__checkbox,
    .dads-radio__radio {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-shrink: 0;
    }

    .dads-checkbox__checkbox {
        width: var(--_checkbox-size);
        height: var(--_checkbox-size);
        border-radius: 12.5%;
    }

    .dads-radio__radio {
        width: var(--_radio-size);
        height: var(--_radio-size);
        border-radius: 50%;
    }

    @media (hover: hover) {
        .dads-checkbox__checkbox:has(:not(:focus, :disabled, [aria-disabled='true']):hover),
        .dads-radio__radio:has(:not(:focus, :disabled, [aria-disabled='true']):hover) {
            background-color: var(--color-neutral-solid-gray-420);
        }
    }

    .dads-checkbox__input,
    .dads-radio__input {
        --_base-color: var(--color-neutral-white);
        --_accent-color: var(--color-key-900);
        --_accent-hover-color: var(--color-key-1100);
        --_border-color: var(--color-neutral-solid-gray-600);
        --_border-hover-color: var(--color-neutral-black);
        box-sizing: border-box;
        margin: 0;
        appearance: none;
        background-color: var(--_base-color);
    }

    .dads-checkbox__input {
        --_check-color: var(--color-neutral-white);
        width: 75%;
        height: 75%;
        border-radius: calc(2 / 18 * 100%);
        background-clip: padding-box;
        border: var(--_checkbox-border-width) solid var(--_border-color);
    }

    .dads-radio__input {
        position: relative;
        width: var(--_radio-outer-size);
        height: var(--_radio-outer-size);
        border-radius: 51%;
        border: var(--_radio-border-width) solid var(--_border-color);
    }

    .dads-checkbox__input:focus,
    .dads-radio__input:focus {
        outline: calc(4 / 16 * 1rem) solid var(--color-neutral-black);
        outline-offset: calc(2 / 16 * 1rem);
        box-shadow: 0 0 0 calc(2 / 16 * 1rem) var(--color-primitive-yellow-300);
    }

    @media (hover: hover) {
        .dads-checkbox__input:not(:disabled, [aria-disabled='true']):hover,
        .dads-radio__input:not(:disabled, [aria-disabled='true']):hover {
            border-color: var(--_border-hover-color);
        }
    }

    .dads-checkbox__input:is(:checked, :indeterminate) {
        border-color: var(--_accent-color);
        background-color: var(--_accent-color);
    }

    .dads-radio__input:checked {
        border-color: var(--_accent-color);
    }

    @media (hover: hover) {
        .dads-checkbox__input:is(:checked, :indeterminate):not(
                :disabled,
                [aria-disabled='true']
            ):hover {
            border-color: var(--_accent-hover-color);
            background-color: var(--_accent-hover-color);
        }

        .dads-radio__input:checked:not(:disabled, [aria-disabled='true']):hover {
            border-color: var(--_accent-hover-color);
        }
    }

    .dads-checkbox__input::before {
        display: none;
        width: calc(14 / 16 * 1rem);
        height: calc(14 / 16 * 1rem);
        background-color: var(--_check-color);
        transform-origin: left top;
        transform: scale(var(--_checkbox-scale, 1));
        content: '';
    }

    .dads-checkbox__input:checked::before {
        display: block;
        clip-path: path('M5.6,11.2L12.65,4.15L11.25,2.75L5.6,8.4L2.75,5.55L1.35,6.95L5.6,11.2Z');
    }

    .dads-checkbox__input:indeterminate::before {
        display: block;
        clip-path: path('M2,6h10v2H2Z');
    }

    .dads-radio__input:checked::before {
        position: absolute;
        inset: 0;
        margin: auto;
        width: var(--_radio-inner-size);
        height: var(--_radio-inner-size);
        border-radius: 51%;
        background-color: var(--_accent-color);
        content: '';
    }

    @media (hover: hover) {
        .dads-radio__input:checked:not(:disabled, [aria-disabled='true']):hover::before {
            background-color: var(--_accent-hover-color);
        }
    }

    .dads-checkbox__input[aria-invalid='true'],
    .dads-radio__input[data-invalid] {
        --_accent-color: var(--color-semantic-error-1);
        --_accent-hover-color: var(--color-primitive-red-1000);
        --_border-color: var(--color-semantic-error-1);
        --_border-hover-color: var(--color-primitive-red-1000);
    }

    .dads-checkbox__input:is(:disabled, [aria-disabled='true']),
    .dads-radio__input:is(:disabled, [aria-disabled='true']) {
        --_base-color: var(--color-neutral-solid-gray-50);
        --_accent-color: var(--color-neutral-solid-gray-300);
        --_accent-hover-color: var(--color-neutral-solid-gray-300);
        --_border-color: var(--color-neutral-solid-gray-300);
        --_border-hover-color: var(--color-neutral-solid-gray-300);
    }

    @media (forced-colors: active) {
        .dads-checkbox__input,
        .dads-checkbox__input[aria-invalid='true'],
        .dads-radio__input,
        .dads-radio__input[data-invalid] {
            --_accent-color: Highlight;
            --_accent-hover-color: Highlight;
            --_border-color: ButtonText;
            --_border-hover-color: ButtonText;
        }

        .dads-checkbox__input,
        .dads-checkbox__input[aria-invalid='true'] {
            --_check-color: HighlightText;
        }

        .dads-checkbox__input:is(:disabled, [aria-disabled='true']),
        .dads-radio__input:is(:disabled, [aria-disabled='true']) {
            --_accent-color: GrayText;
            --_accent-hover-color: GrayText;
            --_border-color: GrayText;
            --_border-hover-color: GrayText;
        }

        .dads-checkbox__input:is(:disabled, [aria-disabled='true']) {
            --_check-color: Canvas;
        }
    }
</style>
