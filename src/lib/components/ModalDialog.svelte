<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';

    type CloseReason = 'button' | 'action' | 'cancel' | 'binding' | 'native';

    // 呼び出し元で一意のIDを指定し、SSRとhydrationで同じ関連付けを使う。
    export let id: string;
    export let Class: string = '';
    export let open: boolean = false;
    export let heading: string = 'タイトル';
    export let message: string = '';
    export let description: string | null = null;
    export let describedBy: string | undefined = undefined;
    export let hasCloseButton: boolean = true;
    export let closeLabel: string = '閉じる';
    export let hasActions: boolean = true;
    export let actionLabel: string = 'OK';
    export let scroll: 'outer' | 'inner' = 'outer';
    export let fixedHeader: boolean = false;
    export let fixedActions: boolean = false;
    export let width: string = 'fit-content';
    export let initialFocus: HTMLElement | null = null;

    const dispatch = createEventDispatcher<{
        open: undefined;
        close: { reason: CloseReason; returnValue: string };
        cancel: Event;
    }>();

    let dialog: HTMLDialogElement;
    let headingElement: HTMLHeadingElement;
    let mounted = false;
    let active = false;
    let previousFocus: HTMLElement | null = null;
    let openingFocus: HTMLElement | null = null;
    let lastOutsideFocus: HTMLElement | null = null;
    let observer: MutationObserver | undefined;

    $: headingId = `${id}-heading`;
    $: descriptionId = `${id}-description`;
    $: hasDescription = Boolean(description || $$slots.description);
    $: ariaDescribedBy =
        [hasDescription ? descriptionId : undefined, describedBy].filter(Boolean).join(' ') ||
        undefined;

    $: if (mounted && dialog) synchronize(open);

    function restoreFocus() {
        const target = previousFocus;
        previousFocus = null;
        if (target?.isConnected) target.focus({ preventScroll: true });
    }

    function captureFocus() {
        const focused = dialog.ownerDocument.activeElement;
        return focused instanceof HTMLElement && !dialog.contains(focused) ? focused : lastOutsideFocus;
    }

    function beginOpen(current: boolean = true) {
        if (active) return;
        previousFocus = openingFocus ?? captureFocus();
        openingFocus = null;
        active = true;
        open = true;
        if (current && dialog.open) {
            dialog.returnValue = '';
            const target =
                initialFocus && dialog.contains(initialFocus) ? initialFocus : headingElement;
            target?.focus();
        }
        dispatch('open');
    }

    function finishClose(reason: CloseReason) {
        if (!active) return;
        active = false;
        restoreFocus();
        dispatch('close', { reason, returnValue: dialog.returnValue });
    }

    function synchronizeNative(
        records: MutationRecord[] = observer?.takeRecords() ?? [],
        reason: CloseReason = 'native',
    ) {
        if (!mounted) return;
        // 最終状態だけでなく、同じタスク内のclose → showModalも順番に処理する。
        do {
            for (let index = 0; index < records.length; index += 1) {
                const nextOpen =
                    index + 1 < records.length ? records[index + 1].oldValue !== null : dialog.open;
                if (nextOpen) {
                    beginOpen(index === records.length - 1);
                } else if (active) {
                    open = false;
                    finishClose(reason);
                }
            }
            // イベントハンドラからの再オープンも、bindingの更新前に取り込む。
            records = observer?.takeRecords() ?? [];
        } while (records.length > 0);
        if (dialog.open) {
            beginOpen();
        } else if (active) {
            open = false;
            finishClose(reason);
        }
    }

    function closeDialog(reason: CloseReason, returnValue: string = '') {
        if (!mounted) {
            open = false;
            return;
        }
        synchronizeNative();
        open = false;
        if (!dialog.open) return;
        dialog.close(returnValue);
        synchronizeNative(undefined, reason);
    }

    function close(returnValue: string = '') {
        closeDialog('action', returnValue);
    }

    function synchronize(shouldOpen: boolean) {
        if (!dialog.isConnected) return;
        if (shouldOpen && !dialog.open) {
            synchronizeNative();
            openingFocus = captureFocus();
            dialog.showModal();
            synchronizeNative();
        } else if (!shouldOpen && dialog.open) {
            closeDialog('binding');
        }
    }

    function handleCancel(event: Event) {
        event.preventDefault();
        if (dispatch('cancel', event, { cancelable: true })) closeDialog('cancel');
    }

    function handleBeforeToggle(event: ToggleEvent) {
        if (mounted && event.newState === 'open') openingFocus = captureFocus();
    }

    function handleOutsideFocus(event: FocusEvent) {
        if (event.target instanceof HTMLElement && !dialog.contains(event.target)) {
            lastOutsideFocus = event.target;
        }
    }

    function handleNativeState() {
        synchronizeNative();
    }

    onMount(() => {
        mounted = true;
        const document = dialog.ownerDocument;
        lastOutsideFocus = captureFocus();
        document.addEventListener('focusin', handleOutsideFocus, true);
        observer = new MutationObserver((records) => synchronizeNative(records));
        observer.observe(dialog, {
            attributes: true,
            attributeFilter: ['open'],
            attributeOldValue: true,
        });
        synchronizeNative();
        synchronize(open);
        return () => {
            mounted = false;
            observer?.disconnect();
            document.removeEventListener('focusin', handleOutsideFocus, true);
            if (dialog.open) dialog.close();
            active = false;
            openingFocus = null;
            restoreFocus();
        };
    });
</script>

<dialog
    {id}
    bind:this={dialog}
    class={`dads-modal-dialog ${Class}`}
    data-scroll={scroll}
    style:--modal-dialog-width={width}
    aria-labelledby={headingId}
    aria-describedby={ariaDescribedBy}
    on:cancel={handleCancel}
    on:beforetoggle={handleBeforeToggle}
    on:toggle={handleNativeState}
    on:close={handleNativeState}
>
    <div class="dads-modal-dialog__dialog">
        {#if scroll === 'inner' && (fixedHeader || fixedActions)}
            {#if fixedHeader}
                <div class="dads-modal-dialog__header">
                    <h2 id={headingId} bind:this={headingElement} class="dads-modal-dialog__heading" tabindex="-1"><slot name="heading">{heading}</slot></h2>
                    {#if hasCloseButton}
                        <button class="dads-modal-dialog__close" type="button" on:click={() => closeDialog('button')}>
                            <svg class="dads-modal-dialog__close-icon" width="24" height="24" viewBox="0 0 120 120" aria-hidden="true">
                                <path d="M32 95L25 88L53 60L25 32L32 25L60 53L88 25L95 32L67 60L95 88L88 95L60 67L32 95Z" fill="currentcolor" />
                            </svg>
                            {closeLabel}
                        </button>
                    {/if}
                </div>
            {/if}
            <div class="dads-modal-dialog__scroll-area">
                {#if !fixedHeader}
                    <div class="dads-modal-dialog__header">
                        <h2 id={headingId} bind:this={headingElement} class="dads-modal-dialog__heading" tabindex="-1"><slot name="heading">{heading}</slot></h2>
                        {#if hasCloseButton}
                            <button class="dads-modal-dialog__close" type="button" on:click={() => closeDialog('button')}>
                                <svg class="dads-modal-dialog__close-icon" width="24" height="24" viewBox="0 0 120 120" aria-hidden="true">
                                    <path d="M32 95L25 88L53 60L25 32L32 25L60 53L88 25L95 32L67 60L95 88L88 95L60 67L32 95Z" fill="currentcolor" />
                                </svg>
                                {closeLabel}
                            </button>
                        {/if}
                    </div>
                {/if}
                <div class="dads-modal-dialog__body">
                    {#if hasDescription}
                        <p id={descriptionId} class="dads-modal-dialog__description"><slot name="description">{description}</slot></p>
                    {/if}
                    <slot {close}>{message}</slot>
                </div>
                {#if hasActions && !fixedActions}
                    <div class="dads-modal-dialog__actions">
                        <slot name="actions" {close}>
                            <button class="dads-button" type="button" data-size="lg" data-type="solid-fill" on:click={() => close()}>{actionLabel}</button>
                        </slot>
                    </div>
                {/if}
            </div>
            {#if hasActions && fixedActions}
                <div class="dads-modal-dialog__actions">
                    <slot name="actions" {close}>
                        <button class="dads-button" type="button" data-size="lg" data-type="solid-fill" on:click={() => close()}>{actionLabel}</button>
                    </slot>
                </div>
            {/if}
        {:else}
            <div class="dads-modal-dialog__header">
                <h2 id={headingId} bind:this={headingElement} class="dads-modal-dialog__heading" tabindex="-1"><slot name="heading">{heading}</slot></h2>
                {#if hasCloseButton}
                    <button class="dads-modal-dialog__close" type="button" on:click={() => closeDialog('button')}>
                        <svg class="dads-modal-dialog__close-icon" width="24" height="24" viewBox="0 0 120 120" aria-hidden="true">
                            <path d="M32 95L25 88L53 60L25 32L32 25L60 53L88 25L95 32L67 60L95 88L88 95L60 67L32 95Z" fill="currentcolor" />
                        </svg>
                        {closeLabel}
                    </button>
                {/if}
            </div>
            <div class="dads-modal-dialog__body">
                {#if hasDescription}
                    <p id={descriptionId} class="dads-modal-dialog__description"><slot name="description">{description}</slot></p>
                {/if}
                <slot {close}>{message}</slot>
            </div>
            {#if hasActions}
                <div class="dads-modal-dialog__actions">
                    <slot name="actions" {close}>
                        <button class="dads-button" type="button" data-size="lg" data-type="solid-fill" on:click={() => close()}>{actionLabel}</button>
                    </slot>
                </div>
            {/if}
        {/if}
    </div>
</dialog>

<style>
    .dads-modal-dialog {
        --modal-dialog-width: fit-content;
        inset: 0;
        box-sizing: border-box;
        container-type: inline-size;
        width: auto;
        height: auto;
        max-width: none;
        max-height: none;
        border: 0;
        background-color: transparent;
        padding: 0 calc(16 / 16 * 1rem);
        font-weight: normal;
        font-size: calc(16 / 16 * 1rem);
        line-height: 1.7;
        font-family: var(--font-family-sans);
        letter-spacing: 0.02em;
        overflow-wrap: break-word;
        color-scheme: dark;
    }
    .dads-modal-dialog:modal {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .dads-modal-dialog::before,
    .dads-modal-dialog::after {
        display: block;
        flex-shrink: 9999;
        width: 1px;
        height: calc(120 / 16 * 1rem);
        min-height: calc(16 / 16 * 1rem);
        content: '';
    }
    .dads-modal-dialog::backdrop {
        background-color: var(--color-neutral-opacity-gray-600);
    }
    .dads-modal-dialog__dialog {
        display: flex;
        flex-direction: column;
        row-gap: calc(12 / 16 * 1rem);
        flex-shrink: 0;
        box-sizing: border-box;
        width: var(--modal-dialog-width);
        min-width: min(calc(480 / 16 * 1rem), calc(100cqw - 32 / 16 * 1rem));
        max-width: 100%;
        min-height: 0;
        border-radius: calc(8 / 16 * 1rem);
        border: 1px solid var(--color-neutral-black);
        background-color: var(--color-neutral-white);
        box-shadow: var(--elevation-3);
        color: var(--color-neutral-solid-gray-800);
        color-scheme: light;
    }
    .dads-modal-dialog__header {
        display: flex;
        align-items: start;
        flex-shrink: 0;
        column-gap: calc(16 / 16 * 1rem);
        min-width: 0;
        padding: calc(8 / 16 * 1rem) calc(16 / 16 * 1rem) 0;
    }
    .dads-modal-dialog__heading {
        margin: 0;
        flex-grow: 1;
        min-width: 0;
        font-weight: bold;
        font-size: calc(24 / 16 * 1rem);
        line-height: 1.5;
        letter-spacing: 0.02em;
    }
    .dads-modal-dialog__heading:focus-visible {
        outline: 0;
        border-radius: 0;
        box-shadow: none;
    }
    .dads-modal-dialog__close {
        display: flex;
        align-items: center;
        flex-shrink: 0;
        column-gap: calc(4 / 16 * 1rem);
        width: fit-content;
        border: 0;
        border-radius: calc(6 / 16 * 1rem);
        background: transparent;
        padding: calc(4 / 16 * 1rem) calc(12 / 16 * 1rem) calc(6 / 16 * 1rem);
        color: var(--color-neutral-solid-gray-800);
        font-weight: normal;
        font-size: calc(16 / 16 * 1rem);
        line-height: 1;
        font-family: var(--font-family-sans);
        letter-spacing: 0.02em;
        touch-action: manipulation;
    }
    @media (hover: hover) {
        .dads-modal-dialog__close:hover {
            background-color: var(--color-neutral-solid-gray-50);
            text-decoration: underline;
            text-underline-offset: calc(3 / 16 * 1rem);
        }
    }
    .dads-modal-dialog__close:focus-visible {
        outline: calc(4 / 16 * 1rem) solid var(--color-neutral-black);
        outline-offset: calc(2 / 16 * 1rem);
        background-color: var(--color-primitive-yellow-300);
        box-shadow: 0 0 0 calc(2 / 16 * 1rem) var(--color-primitive-yellow-300);
    }
    .dads-modal-dialog__close-icon {
        margin-top: calc(2 / 16 * 1rem);
        width: calc(24 / 16 * 1rem);
        height: calc(24 / 16 * 1rem);
        flex-shrink: 0;
        color: var(--color-neutral-black);
    }
    .dads-modal-dialog__body {
        flex-shrink: 0;
        min-width: 0;
        padding: 0 calc(16 / 16 * 1rem) calc(32 / 16 * 1rem);
    }
    .dads-modal-dialog__description {
        margin: 0 0 calc(12 / 16 * 1rem);
    }
    .dads-modal-dialog__actions {
        display: flex;
        justify-content: end;
        flex-wrap: wrap;
        gap: calc(16 / 16 * 1rem);
        flex-shrink: 0;
        min-width: 0;
        padding: 0 calc(16 / 16 * 1rem) calc(16 / 16 * 1rem);
    }
    .dads-modal-dialog__scroll-area {
        display: flex;
        flex-direction: column;
        row-gap: calc(12 / 16 * 1rem);
        overflow-y: auto;
        scrollbar-width: thin;
    }
    .dads-modal-dialog__scroll-area:not(:first-child) {
        margin-top: calc(-4 / 16 * 1rem);
        border-top: 1px solid var(--color-neutral-solid-gray-600);
    }
    .dads-modal-dialog__scroll-area:not(:last-child) {
        margin-bottom: calc(4 / 16 * 1rem);
        border-bottom: 1px solid var(--color-neutral-solid-gray-600);
    }
    .dads-modal-dialog[data-scroll='outer'] {
        scrollbar-gutter: stable;
    }
    .dads-modal-dialog[data-scroll='inner'] .dads-modal-dialog__dialog {
        flex-shrink: 1;
        scrollbar-width: thin;
    }
    .dads-modal-dialog[data-scroll='inner']:not(:has(.dads-modal-dialog__scroll-area))
        .dads-modal-dialog__dialog {
        overflow-y: auto;
    }
    @media (min-width: 48rem) {
        .dads-modal-dialog__dialog,
        .dads-modal-dialog__scroll-area {
            row-gap: calc(16 / 16 * 1rem);
        }
        .dads-modal-dialog__scroll-area:not(:first-child) {
            margin-top: calc(8 / 16 * 1rem);
        }
        .dads-modal-dialog__scroll-area:not(:last-child) {
            margin-bottom: calc(8 / 16 * 1rem);
        }
        .dads-modal-dialog__header {
            padding: calc(24 / 16 * 1rem) calc(24 / 16 * 1rem) 0;
        }
        .dads-modal-dialog__heading {
            font-weight: bold;
            font-size: calc(28 / 16 * 1rem);
            line-height: 1.5;
            letter-spacing: 0.01em;
        }
        .dads-modal-dialog__body {
            padding: 0 calc(24 / 16 * 1rem) calc(32 / 16 * 1rem);
        }
        .dads-modal-dialog__actions {
            padding: 0 calc(24 / 16 * 1rem) calc(24 / 16 * 1rem);
        }
    }
    @media (forced-colors: active) {
        .dads-modal-dialog::backdrop {
            background-color: #000b;
        }
        .dads-modal-dialog__close-icon {
            color: currentcolor;
        }
    }

    /* Slot内のnative controlsにも依存ボタンCSSを適用する。 */
    .dads-modal-dialog__actions :global(.dads-button) {
        --button-color: var(--color-key-900);
        --button-hover-color: var(--color-key-1000);
        --button-active-color: var(--color-key-1200);
        --button-outline-hover-bg-color: var(--color-key-200);
        --button-outline-active-bg-color: var(--color-key-300);
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
    }
    .dads-modal-dialog__actions :global(.dads-button[data-type='solid-fill']) {
        border: 4px double transparent;
        background-color: var(--button-color);
        color: var(--color-neutral-white);
    }
    .dads-modal-dialog__actions :global(.dads-button[data-type='outline']) {
        border: 1px solid currentcolor;
        background-color: var(--color-neutral-white);
        color: var(--button-color);
    }
    .dads-modal-dialog__actions :global(.dads-button[data-type='text']) {
        border: 0;
        background-color: transparent;
        color: var(--button-color);
        text-decoration: underline;
        text-decoration-thickness: calc(1 / 16 * 1rem);
    }
    @media (hover: hover) {
        .dads-modal-dialog__actions :global(.dads-button[data-type='solid-fill']:hover) {
            background-color: var(--button-hover-color);
            text-decoration: underline;
            text-decoration-thickness: calc(1 / 16 * 1rem);
        }
        .dads-modal-dialog__actions :global(.dads-button[data-type='outline']:hover) {
            background-color: var(--button-outline-hover-bg-color);
            color: var(--button-hover-color);
            text-decoration: underline;
            text-decoration-thickness: calc(1 / 16 * 1rem);
        }
        .dads-modal-dialog__actions :global(.dads-button[data-type='text']:hover) {
            background-color: var(--color-key-50);
            color: var(--button-hover-color);
            text-decoration-thickness: calc(3 / 16 * 1rem);
        }
    }
    .dads-modal-dialog__actions :global(.dads-button[data-type='solid-fill']:active) {
        background-color: var(--button-active-color);
        text-decoration: underline;
    }
    .dads-modal-dialog__actions :global(.dads-button[data-type='outline']:active) {
        background-color: var(--button-outline-active-bg-color);
        color: var(--button-active-color);
        text-decoration: underline;
    }
    .dads-modal-dialog__actions :global(.dads-button[data-type='text']:active) {
        background-color: var(--color-key-100);
        color: var(--button-active-color);
    }
    .dads-modal-dialog__actions :global(.dads-button:focus-visible) {
        outline: calc(4 / 16 * 1rem) solid var(--color-neutral-black);
        outline-offset: calc(2 / 16 * 1rem);
        box-shadow: 0 0 0 calc(2 / 16 * 1rem) var(--color-primitive-yellow-300);
    }
    .dads-modal-dialog__actions :global(.dads-button[data-type='text']:focus-visible) {
        background-color: var(--color-primitive-yellow-300);
    }
    .dads-modal-dialog__actions :global(.dads-button:disabled),
    .dads-modal-dialog__actions :global(.dads-button[aria-disabled='true']) {
        cursor: default;
    }
    .dads-modal-dialog__actions
        :global(.dads-button[data-type='solid-fill']:is(:disabled, [aria-disabled='true'])) {
        background-color: var(--color-neutral-solid-gray-300);
        color: var(--color-neutral-solid-gray-50);
        text-decoration: none;
    }
    .dads-modal-dialog__actions
        :global(.dads-button[data-type='outline']:is(:disabled, [aria-disabled='true'])) {
        background-color: var(--color-neutral-white);
        color: var(--color-neutral-solid-gray-300);
        text-decoration: none;
    }
    .dads-modal-dialog__actions
        :global(.dads-button[data-type='text']:is(:disabled, [aria-disabled='true'])) {
        background-color: transparent;
        color: var(--color-neutral-solid-gray-300);
        text-decoration-thickness: revert;
    }
    @media (forced-colors: active) {
        .dads-modal-dialog__actions :global(.dads-button:is(:disabled, [aria-disabled='true'])) {
            border-color: GrayText;
            color: GrayText;
        }
    }
    .dads-modal-dialog__actions :global(.dads-button[data-size='lg']) {
        min-width: calc(136 / 16 * 1rem);
        min-height: calc(56 / 16 * 1rem);
        border-radius: calc(8 / 16 * 1rem);
        padding: calc(12 / 16 * 1rem) calc(16 / 16 * 1rem);
    }
    .dads-modal-dialog__actions :global(.dads-button[data-size='md']) {
        min-width: calc(96 / 16 * 1rem);
        min-height: calc(48 / 16 * 1rem);
        border-radius: calc(8 / 16 * 1rem);
        padding: calc(8 / 16 * 1rem) calc(16 / 16 * 1rem);
    }
    .dads-modal-dialog__actions :global(.dads-button[data-size='sm']) {
        position: relative;
        min-width: calc(80 / 16 * 1rem);
        min-height: calc(36 / 16 * 1rem);
        border-radius: calc(6 / 16 * 1rem);
        padding: calc(2 / 16 * 1rem) calc(12 / 16 * 1rem);
    }
    .dads-modal-dialog__actions :global(.dads-button[data-size='xs']) {
        position: relative;
        min-width: calc(72 / 16 * 1rem);
        min-height: calc(28 / 16 * 1rem);
        border-radius: calc(4 / 16 * 1rem);
        padding: calc(2 / 16 * 1rem) calc(8 / 16 * 1rem);
        font-size: calc(14 / 16 * 1rem);
    }
    .dads-modal-dialog__actions :global(.dads-button:is([data-size='sm'], [data-size='xs'])::after) {
        content: '';
        position: absolute;
        inset: 0;
        margin: auto;
        height: calc(44 / 16 * 1rem);
    }
    .dads-modal-dialog__actions :global(.dads-button__icon) {
        flex-shrink: 0;
    }
</style>
