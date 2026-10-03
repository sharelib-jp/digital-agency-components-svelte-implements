<script context="module" lang="ts">
    export type StepNavigationVariant = 'full' | 'single';
    export type StepNavigationOrientation = 'horizontal' | 'vertical';
    export type StepNavigationSize = 'normal' | 'small';
    export type StepNavigationStatus =
        'default' | 'reached' | 'completed' | 'editing' | 'error' | 'skipped';

    export interface StepNavigationStep {
        id: string;
        label?: string;
        description?: string;
        status?: StepNavigationStatus;
        statusLabel?: string;
        current?: boolean;
        disabled?: boolean;
        href?: string;
        action?: boolean;
        number?: number;
        first?: boolean;
        last?: boolean;
    }

    export interface StepNavigationSelectDetail {
        id: string;
        step: StepNavigationStep;
        index: number;
        previousId: string | null;
        originalEvent: MouseEvent;
    }
</script>

<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    export let steps: StepNavigationStep[] = [];
    export let variant: StepNavigationVariant = 'full';
    export let orientation: StepNavigationOrientation = 'horizontal';
    export let size: StepNavigationSize = 'normal';
    export let currentId: string | null = null;
    export let disabled: boolean = false;
    export let label: string = 'ステップ';
    export let stepLabel: string = 'ステップ';
    export let summary: string | undefined = undefined;
    export let numberOnly: boolean = false;
    export let stepWidth: number = 320;
    export let stepMinWidth: number = 160;
    export let id: string | undefined = undefined;
    export let Class: string = '';

    const dispatch = createEventDispatcher<{ select: StepNavigationSelectDetail }>();
    const statusLabels: Record<StepNavigationStatus, string> = {
        default: '',
        reached: '到達済み',
        completed: '完了',
        editing: '編集中',
        error: 'エラー',
        skipped: 'スキップされました',
    };
    $: currentIndex =
        currentId !== null
            ? steps.findIndex((step) => step.id === currentId)
            : steps.findIndex((step) => step.current);
    $: effectiveCurrentId = steps[currentIndex]?.id ?? null;
    $: entries = steps.map((step, index) => ({ step, index }));
    $: visibleEntries =
        variant === 'single'
            ? entries.slice(Math.max(0, currentIndex), Math.max(0, currentIndex) + 1)
            : entries;
    $: reached = steps.reduce(
        (count, step, index) =>
            (step.status && step.status !== 'default') || index === currentIndex ? index + 1 : count,
        0,
    );
    $: progressSummary = summary ?? `全${steps.length}ステップ中、${reached}ステップ目まで到達済み`;
    $: width = Number.isFinite(stepWidth) && stepWidth >= 0 ? stepWidth : 320;
    $: minWidth = Number.isFinite(stepMinWidth) && stepMinWidth >= 0 ? stepMinWidth : 160;

    function selectStep(event: MouseEvent, step: StepNavigationStep, index: number) {
        if (disabled || step.disabled) {
            event.preventDefault();
            return;
        }
        if (
            event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
        )
            return;
        if (
            !dispatch(
                'select',
                { id: step.id, step, index, previousId: effectiveCurrentId, originalEvent: event },
                { cancelable: true },
            )
        ) {
            event.preventDefault();
            return;
        }
        // Links retain the current step until their destination is displayed.
        if (step.href === undefined) currentId = step.id;
    }
</script>

<nav
    {id}
    class={`dads-step-navigation ${Class}`.trim()}
    aria-label={label}
    data-orientation={orientation}
    data-size={size}
    data-variant={variant}
    style:--_step-width={width}
    style:--_step-min-width={minWidth}
>
    {#if progressSummary}<p class="dads-u-visually-hidden">{progressSummary}</p>{/if}
    <ol role="list">
        {#each visibleEntries as { step, index } (step.id)}
            {@const status = step.status ?? (index === currentIndex ? 'reached' : 'default')}
            {@const stateLabel = step.statusLabel ?? statusLabels[status]}
            {@const isDisabled = disabled || !!step.disabled}
            {@const interactive = step.href !== undefined || !!step.action}
            <li class="dads-step-navigation__step" data-step-id={step.id} data-state={status === 'default' ? undefined : status}
                data-first={(step.first ?? index === 0) ? '' : undefined}
                data-last={(step.last ?? index === steps.length - 1) ? '' : undefined}
                aria-current={index === currentIndex ? 'step' : undefined}>
                <svelte:element
                    this={step.href !== undefined ? 'a' : step.action ? 'button' : 'span'}
                    class="dads-step-navigation__header"
                    role={step.href !== undefined ? 'link' : step.action ? 'button' : undefined}
                    type={step.href === undefined && step.action ? 'button' : undefined}
                    href={step.href !== undefined && !isDisabled ? step.href : undefined}
                    disabled={step.href === undefined && step.action ? isDisabled : undefined}
                    aria-disabled={interactive && isDisabled ? 'true' : undefined}
                    tabindex={interactive && isDisabled ? -1 : undefined}
                    on:click={(event: MouseEvent) => { if (interactive) selectStep(event, step, index); }}
                >
                    <span class="dads-u-visually-hidden">{stepLabel}</span>
                    <span class="dads-step-navigation__number">
                        {step.number ?? index + 1}
                        {#if status === 'completed' || status === 'editing' || status === 'error'}
                            <span class="dads-step-navigation__state-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
                                    {#if status === 'completed'}
                                        <circle cx="12" cy="12" r="12" fill="var(--color-neutral-solid-gray-600)" />
                                        <path d="M10 17.5 19.8 8l-1.5-1.5-8.1 8-4.1-4L4.5 12l5.6 5.5Z" fill="var(--color-neutral-white)" />
                                    {:else if status === 'editing'}
                                        <path d="M5.8 20c-.5 0-1-.2-1.3-.5-.3-.4-.5-.8-.5-1.3V5.6c0-.5.2-.9.5-1.3.4-.3.8-.5 1.3-.5h8L12 5.6H5.8v12.6h12.6V12l1.8-1.8v8c0 .5-.2 1-.5 1.3-.4.3-.8.5-1.3.5H5.8Zm3.6-5.4v-3.8l8.3-8.3a1.8 1.8 0 0 1 2.5 0l1.3 1.3.4.6a1.7 1.7 0 0 1 0 1.3c-.1.3-.2.5-.4.6l-8.3 8.3H9.4Zm1.8-1.8h1.3l5.2-5.2L17 7l-.7-.7-5.2 5.2v1.3Z" fill="var(--color-neutral-solid-gray-800)" />
                                    {:else}
                                        <path d="M1 21 12 2l11 19H1Zm3.5-2h15L12 6 4.5 19Zm7.5-1c.3 0 .5-.1.7-.3.2-.2.3-.4.3-.7a1 1 0 0 0-.3-.7 1 1 0 0 0-.7-.3 1 1 0 0 0-.7.3 1 1 0 0 0-.3.7c0 .3.1.5.3.7.2.2.4.3.7.3Zm-1-3h2v-5h-2v5Z" fill="var(--color-semantic-error-1)" />
                                    {/if}
                                </svg>
                            </span>
                        {/if}
                        {#if stateLabel}
                            <span class={status === 'editing' || status === 'error' ? 'dads-step-navigation__state-label' : 'dads-u-visually-hidden'}>{stateLabel}</span>
                        {/if}
                    </span>
                    {#if !numberOnly && step.label}<span class="dads-step-navigation__title">{step.label}</span>{/if}
                </svelte:element>
                {#if !numberOnly && step.description}<p class="dads-step-navigation__description">{step.description}</p>{/if}
            </li>
        {/each}
    </ol>
</nav>

<style>
    .dads-step-navigation {
        color: var(--color-neutral-solid-gray-800);
        font-weight: normal;
        font-size: calc(16 / 16 * 1rem);
        font-family: var(--font-family-sans);
        line-height: 1.7;
        letter-spacing: 0.02em;
        overflow-wrap: anywhere;
    }

    .dads-step-navigation[data-size='normal'] {
        --_number-size: calc(44 / 16 * 1rem);
        --_number-margin: calc(4 / 16 * 1rem);
        --_outline-width: calc(2 / 16 * 1rem);
        --_title-margin: calc(24 / 16 * 1rem);
        --_description-margin: calc(8 / 16 * 1rem);
    }

    .dads-step-navigation[data-size='small'] {
        --_number-size: calc(32 / 16 * 1rem);
        --_number-margin: calc(3 / 16 * 1rem);
        --_outline-width: calc(1 / 16 * 1rem);
        --_title-margin: calc(16 / 16 * 1rem);
        --_description-margin: calc(4 / 16 * 1rem);
    }

    .dads-step-navigation > ol {
        margin: 0;
        padding: 0;
        list-style-type: none;
    }

    .dads-step-navigation__step {
        position: relative;
        box-sizing: border-box;
    }

    .dads-step-navigation__step::before,
    .dads-step-navigation__step::after {
        position: absolute;
        z-index: -1;
        content: '';
    }

    .dads-step-navigation__step[data-first]::before {
        display: none;
    }

    .dads-step-navigation__step[data-last]::after {
        display: none;
    }

    .dads-step-navigation__header {
        display: block;
        border: 0;
        background: none;
        padding: 0;
        color: inherit;
        font: inherit;
        text-wrap: pretty;
    }

    .dads-step-navigation__header:any-link,
    .dads-step-navigation__header:enabled {
        text-decoration: underline;
        text-decoration-thickness: calc(1 / 16 * 1rem);
        text-underline-offset: calc(3 / 16 * 1rem);
    }

    @media (hover: hover) {
        .dads-step-navigation__header:any-link:hover,
        .dads-step-navigation__header:enabled:hover {
            text-decoration-thickness: calc(3 / 16 * 1rem);
            cursor: pointer;
        }
    }

    .dads-step-navigation__header:focus-visible {
        border-radius: 0;
        outline: 0;
        box-shadow: none;
    }

    .dads-step-navigation__number {
        position: relative;
        display: grid;
        place-content: center;
        margin: calc(4 / 16 * 1rem);
        box-sizing: border-box;
        width: fit-content;
        height: var(--_number-size);
        min-width: var(--_number-size);
        border: 2px solid;
        border-radius: 50%;
        background-color: var(--color-neutral-white);
        padding: 0 calc(2 / 16 * 1rem) calc(2 / 16 * 1rem);
        font-weight: bold;
        font-size: calc(20 / 16 * 1rem);
        line-height: 1.5;
        letter-spacing: 0.02em;
        text-decoration: inherit;
        text-decoration-thickness: inherit;
    }

    .dads-step-navigation[data-size='small'] .dads-step-navigation__number {
        margin: calc(3 / 16 * 1rem);
        border-width: 1px;
        font-size: calc(16 / 16 * 1rem);
    }

    .dads-step-navigation__step[data-state='reached'] .dads-step-navigation__number {
        background-color: var(--color-neutral-solid-gray-800);
        color: var(--color-neutral-white);
        border-color: var(--color-neutral-solid-gray-800);
    }

    .dads-step-navigation__step[data-state='completed'] .dads-step-navigation__number {
        background-color: var(--color-neutral-solid-gray-50);
    }

    .dads-step-navigation__step[data-state='error'] .dads-step-navigation__number {
        color: var(--color-semantic-error-1);
    }

    .dads-step-navigation__step[data-state='skipped'] .dads-step-navigation__number {
        border-width: 1px;
        border-style: dashed;
    }

    .dads-step-navigation__step[aria-current] .dads-step-navigation__number {
        outline: var(--_outline-width) solid var(--color-neutral-solid-gray-800);
        outline-offset: calc(2 / 16 * 1rem);
        box-shadow: 0 0 0 calc(2 / 16 * 1rem) var(--color-neutral-white);
    }

    @media (forced-colors: active) {
        .dads-step-navigation__step[data-state='reached'] .dads-step-navigation__number {
            background-color: CanvasText;
            color: Canvas;
            forced-color-adjust: none;
        }

        .dads-step-navigation__step[data-state='completed'] .dads-step-navigation__state-icon circle {
            fill: CanvasText;
        }

        .dads-step-navigation__step[data-state='completed'] .dads-step-navigation__state-icon path {
            fill: Canvas;
        }

        .dads-step-navigation__step[data-state='editing'] .dads-step-navigation__state-icon path {
            fill: CanvasText;
        }

        .dads-step-navigation__step[data-state='error'] .dads-step-navigation__state-icon path {
            fill: CanvasText;
        }
    }

    @media (hover: hover) {
        .dads-step-navigation__header:any-link:hover .dads-step-navigation__number,
        .dads-step-navigation__header:enabled:hover .dads-step-navigation__number {
            outline: 1px solid;
        }

        .dads-step-navigation__step[data-state='reached']
            :is(.dads-step-navigation__header:any-link, .dads-step-navigation__header:enabled):hover
            .dads-step-navigation__number {
            outline-color: var(--color-neutral-solid-gray-800);
        }

        .dads-step-navigation__step[data-state='skipped']
            :is(.dads-step-navigation__header:any-link, .dads-step-navigation__header:enabled):hover
            .dads-step-navigation__number {
            outline: none;
            border-width: 2px;
        }
    }

    .dads-step-navigation__header:focus-visible .dads-step-navigation__number {
        outline: calc(4 / 16 * 1rem) solid var(--color-neutral-black);
        outline-offset: calc(2 / 16 * 1rem);
        box-shadow: 0 0 0 calc(2 / 16 * 1rem) var(--color-primitive-yellow-300);
    }

    .dads-step-navigation__state-icon {
        position: absolute;
        top: calc(-10 / 16 * 1rem);
        left: calc(50% + calc(6 / 16 * 1rem));
        border-radius: 50%;
        background-color: var(--color-neutral-white);
    }

    .dads-step-navigation[data-size='small'] .dads-step-navigation__state-icon {
        top: calc(-9 / 16 * 1rem);
        left: calc(50% + calc(4 / 16 * 1rem));
    }

    .dads-step-navigation__state-icon > svg {
        display: block;
        max-width: none;
    }

    .dads-step-navigation[data-size='small'] .dads-step-navigation__state-icon > svg {
        width: calc(20 / 16 * 1rem);
        height: calc(20 / 16 * 1rem);
    }

    .dads-step-navigation__state-label {
        position: absolute;
        inset: calc(100% + calc(8 / 16 * 1rem)) -100% 0;
        margin: 0 auto;
        width: 4em;
        height: 1.2em;
        background-color: var(--color-neutral-white);
        font-weight: normal;
        font-size: calc(14 / 16 * 1rem);
        line-height: 1.2;
        letter-spacing: 0;
        text-align: center;
    }

    .dads-step-navigation__title {
        display: block;
        font-weight: bold;
        font-size: calc(18 / 16 * 1rem);
        line-height: 1.6;
        letter-spacing: 0.02em;
        text-decoration-thickness: inherit;
    }

    .dads-step-navigation[data-size='small'] .dads-step-navigation__title {
        font-weight: bold;
        font-size: calc(16 / 16 * 1rem);
        line-height: 1.7;
        letter-spacing: 0.02em;
    }

    .dads-step-navigation__description {
        margin: var(--_description-margin) 0 0;
    }

    /* Orientations */

    .dads-step-navigation[data-orientation='horizontal'] {
        overflow-x: auto;
        padding-top: calc(6 / 16 * 1rem);
        padding-bottom: calc(6 / 16 * 1rem);
    }

    .dads-step-navigation[data-orientation='horizontal'] > ol {
        display: flex;
    }

    .dads-step-navigation[data-orientation='vertical'] > ol {
        display: flex;
        flex-direction: column;
    }

    .dads-step-navigation[data-orientation='horizontal'] .dads-step-navigation__step {
        width: calc(var(--_step-width, 320) / 16 * 1rem);
        min-width: calc(var(--_step-min-width, 160) / 16 * 1rem);
        padding: 0 calc(16 / 16 * 1rem);
    }

    .dads-step-navigation[data-orientation='vertical'] .dads-step-navigation__step {
        flex: 1;
        padding-bottom: calc(24 / 16 * 1rem);
    }

    .dads-step-navigation[data-orientation='vertical'] .dads-step-navigation__step:last-child {
        padding-bottom: 0;
    }

    .dads-step-navigation[data-orientation='horizontal'] .dads-step-navigation__step::before {
        top: calc(var(--_number-size) / 2 + var(--_number-margin));
        right: 50%;
        width: 50%;
        border-bottom: 1px solid;
    }

    .dads-step-navigation[data-orientation='horizontal'] .dads-step-navigation__step::after {
        top: calc(var(--_number-size) / 2 + var(--_number-margin));
        left: 50%;
        width: 50%;
        border-bottom: 1px solid;
    }

    .dads-step-navigation[data-orientation='vertical'] .dads-step-navigation__step::before {
        left: calc(var(--_number-size) / 2 + var(--_number-margin));
        top: 0;
        height: calc(32 / 16 * 1rem);
        border-right: 1px solid;
    }

    .dads-step-navigation[data-orientation='vertical'] .dads-step-navigation__step::after {
        left: calc(var(--_number-size) / 2 + var(--_number-margin));
        bottom: 0;
        height: calc(100% - calc(32 / 16 * 1rem));
        border-right: 1px solid;
    }

    .dads-step-navigation[data-orientation='horizontal'] .dads-step-navigation__header {
        width: 100%;
        text-align: center;
    }

    .dads-step-navigation[data-orientation='vertical'] .dads-step-navigation__header {
        position: relative;
        display: flex;
        align-items: baseline;
        column-gap: calc(16 / 16 * 1rem);
        text-align: left;
    }

    .dads-step-navigation[data-orientation='horizontal'] .dads-step-navigation__number {
        margin-right: auto;
        margin-left: auto;
    }

    .dads-step-navigation[data-orientation='vertical'] .dads-step-navigation__number {
        flex-shrink: 0;
    }

    .dads-step-navigation[data-orientation='horizontal'] .dads-step-navigation__title {
        margin-top: var(--_title-margin);
    }

    .dads-step-navigation[data-orientation='vertical'] .dads-step-navigation__title {
        padding: calc(var(--_number-size) / 2 + var(--_number-margin) - calc(14 / 16 * 1rem)) 0;
    }

    .dads-step-navigation[data-orientation='horizontal'] .dads-step-navigation__description {
        text-align: center;
    }

    .dads-step-navigation[data-orientation='vertical'] .dads-step-navigation__description {
        margin-top: calc(
            var(--_description-margin) -
                (var(--_number-size) / 2 + var(--_number-margin) - calc(14 / 16 * 1rem))
        );
        padding-left: calc(
            var(--_number-size) + var(--_number-margin) + var(--_number-margin) + calc(16 / 16 * 1rem)
        );
    }

    .dads-step-navigation {
        isolation: isolate;
    }
    .dads-step-navigation__header:disabled,
    .dads-step-navigation__header[aria-disabled='true'] {
        color: var(--color-neutral-solid-gray-600);
        cursor: default;
        text-decoration: none;
    }
    @media (hover: hover) {
        .dads-step-navigation__header[aria-disabled='true']:hover {
            cursor: default;
            text-decoration: none;
        }
    }
    @media (forced-colors: active) {
        .dads-step-navigation__header:disabled,
        .dads-step-navigation__header[aria-disabled='true'] {
            color: GrayText;
        }
    }

    .dads-u-visually-hidden {
        clip: rect(0 0 0 0);
        clip-path: inset(50%);
        height: calc(1 / 16 * 1rem);
        overflow: hidden;
        position: absolute;
        white-space: nowrap;
        width: calc(1 / 16 * 1rem);
        margin: 0;
    }
</style>
