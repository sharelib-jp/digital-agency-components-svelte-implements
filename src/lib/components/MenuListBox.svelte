<script context="module" lang="ts">
    import type { MenuListLinkItem, MenuListSelectDetail } from './MenuList.svelte';

    export interface MenuListBoxItem extends MenuListLinkItem {
        children?: never;
    }

    export interface MenuListBoxSelectDetail extends MenuListSelectDetail {
        item: MenuListBoxItem;
        index: number;
    }
</script>

<script lang="ts">
    import { createEventDispatcher, onMount, tick } from 'svelte';
    import MenuList from './MenuList.svelte';

    // 呼び出し元のIDでSSRとクライアントのARIA参照を一致させる。
    export let id: string;
    export let items: MenuListBoxItem[] = [];
    export let label: string = 'メニュー';
    export let open: boolean = false;
    export let selectedId: string | null = null;
    export let disabled: boolean = false;
    export let size: 'sm' | 'md' = 'sm';
    export let Style: 'text' | 'outlined' | 'filled' = 'text';
    export let fontWeight: 'normal' | 'bold' = 'normal';
    export let iconPath: string | undefined = undefined;
    export let iconViewBox: string = '0 0 24 24';
    export let Class: string = '';

    const dispatch = createEventDispatcher<{ select: MenuListBoxSelectDetail }>();
    let root: HTMLDivElement;
    let opener: HTMLButtonElement;
    let popup: HTMLDivElement;
    let activeId: string | null = null;
    let mounted = false;
    let focusRequest = 0;
    let tabCloseTimer: ReturnType<typeof setTimeout> | undefined;

    $: openerId = `${id}-opener`;
    $: menuId = `${id}-menu`;
    $: if (disabled) open = false;
    $: menuActiveId = open
        ? items.some((item) => item.id === activeId && !item.disabled)
            ? activeId
            : (items.find((item) => !item.disabled)?.id ?? null)
        : null;
    $: if (mounted && !open && popup?.contains(popup.ownerDocument.activeElement)) {
        if (!disabled) opener?.focus();
    }

    function controls() {
        return Array.from(
            popup?.querySelectorAll<HTMLElement>(
                '[data-js-menu-item]:not(:disabled):not([aria-disabled="true"])',
            ) ?? [],
        );
    }

    function closeMenu(restoreFocus = false) {
        focusRequest += 1;
        clearTimeout(tabCloseTimer);
        open = false;
        activeId = null;
        if (restoreFocus && !disabled) opener?.focus();
    }

    async function openMenu(last = false) {
        if (disabled) return;
        const request = ++focusRequest;
        const enabled = items.filter((item) => !item.disabled);
        activeId = enabled[last ? enabled.length - 1 : 0]?.id ?? null;
        open = true;
        await tick();
        if (!mounted || !open || disabled || request !== focusRequest) return;
        const enabledControls = controls();
        // 空のメニューでもフォーカスを見失わない。
        (enabledControls[last ? enabledControls.length - 1 : 0] ?? opener)?.focus();
    }

    function handleSelect(event: CustomEvent<MenuListSelectDetail>) {
        if (!open || disabled) {
            event.preventDefault();
            return;
        }
        const index = items.findIndex((item) => item.id === event.detail.id);
        const item = items[index];
        if (
            !item ||
            item.disabled ||
            !dispatch('select', { ...event.detail, item, index }, { cancelable: true })
        ) {
            event.preventDefault();
            return;
        }
        selectedId = item.id;
        closeMenu(true);
    }

    function handleKeydown(event: KeyboardEvent) {
        if (disabled || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey)
            return;
        if (event.key === 'Escape' && open) {
            event.preventDefault();
            closeMenu(true);
            return;
        }
        const target = event.target;
        if (!(target instanceof HTMLElement) || !root?.contains(target)) return;
        if (target === opener && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
            event.preventDefault();
            void openMenu(event.key === 'ArrowUp');
            return;
        }
        if (!open || !popup?.contains(target)) return;
        if (event.key === 'Tab') {
            // ネイティブのTab移動を先に完了させ、フォーカスを奪わず閉じる。
            clearTimeout(tabCloseTimer);
            tabCloseTimer = setTimeout(() => closeMenu(), 0);
            return;
        }
        const enabled = controls();
        const index = enabled.indexOf(target);
        if (index === -1 || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const next =
            event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? enabled.length - 1
                  : (index + (event.key === 'ArrowDown' ? 1 : -1) + enabled.length) % enabled.length;
        activeId = enabled[next].getAttribute('data-item-id');
        enabled[next].focus();
    }

    function handleOutside(event: Event) {
        if (open && event.target instanceof Node && !root.contains(event.target)) closeMenu();
    }

    function handleFocus(event: FocusEvent) {
        handleOutside(event);
        if (open && event.target instanceof HTMLElement && popup.contains(event.target)) {
            activeId =
                event.target.closest('[data-js-menu-item]')?.getAttribute('data-item-id') ?? activeId;
        }
    }

    onMount(() => {
        mounted = true;
        const document = root.ownerDocument;
        document.addEventListener('pointerdown', handleOutside);
        document.addEventListener('click', handleOutside);
        document.addEventListener('focusin', handleFocus);
        document.addEventListener('keydown', handleKeydown);
        return () => {
            mounted = false;
            focusRequest += 1;
            clearTimeout(tabCloseTimer);
            document.removeEventListener('pointerdown', handleOutside);
            document.removeEventListener('click', handleOutside);
            document.removeEventListener('focusin', handleFocus);
            document.removeEventListener('keydown', handleKeydown);
            if (popup.contains(document.activeElement) && !disabled && opener.isConnected)
                opener.focus();
        };
    });
</script>

<div {...$$restProps} {id} class={`dads-menu-list-box ${Class}`} bind:this={root}>
    <button id={openerId} class="dads-menu-list-box__opener" type="button" bind:this={opener}
        data-js-opener aria-controls={menuId} aria-haspopup="menu" aria-expanded={open}
        data-size={size} data-style={Style} data-text-weight={fontWeight} {disabled}
        on:click={() => { if (!disabled) { if (open) closeMenu(); else void openMenu(); } }}>
        {#if iconPath}
            <svg class="dads-menu-list-box__opener-icon" width="24" height="24" viewBox={iconViewBox} aria-hidden="true">
                <path d={iconPath} fill="currentcolor" />
            </svg>
        {/if}
        <slot name="label">{label}</slot>
        <svg class="dads-menu-list-box__opener-arrow" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path d="m20.5 6.6-8 8-8-8L3.1 8l9.4 9.4L21.9 8l-1.4-1.4Z" fill="currentcolor" />
        </svg>
    </button>
    <div class="dads-menu-list-box__popup" data-js-popup bind:this={popup} hidden={!open}>
        <MenuList id={menuId} {items} role="menu" type="box" size="regular"
            aria-labelledby={openerId} {disabled} bind:selectedId activeId={menuActiveId}
            on:select={handleSelect} />
    </div>
</div>

<style>
    .dads-menu-list-box {
        position: relative;
        display: block;
        width: fit-content;
        color: var(--color-neutral-solid-gray-900);
        font-weight: normal;
        font-size: calc(16 / 16 * 1rem);
        line-height: 1.2;
        font-family: var(--font-family-sans);
        letter-spacing: 0.02em;
    }

    .dads-menu-list-box__opener {
        display: flex;
        align-items: center;
        box-sizing: border-box;
        border-radius: calc(8 / 16 * 1rem);
        border: 0;
        background: transparent;
        padding-top: calc(4 / 16 * 1rem);
        padding-bottom: calc(4 / 16 * 1rem);
        color: inherit;
        font: inherit;
        letter-spacing: inherit;
    }

    .dads-menu-list-box__opener[data-size='sm'] {
        min-height: calc(36 / 16 * 1rem);
        padding-right: calc(4 / 16 * 1rem);
        padding-left: calc(4 / 16 * 1rem);
        column-gap: calc(4 / 16 * 1rem);
    }

    .dads-menu-list-box__opener[data-size='md'] {
        min-height: calc(44 / 16 * 1rem);
        padding-right: calc(16 / 16 * 1rem);
        padding-left: calc(16 / 16 * 1rem);
        column-gap: calc(8 / 16 * 1rem);
    }

    .dads-menu-list-box__opener[data-style='outlined'] {
        border: 1px solid var(--color-neutral-solid-gray-420);
        background-color: transparent;
    }

    .dads-menu-list-box__opener[data-style='filled'] {
        background-color: var(--color-neutral-solid-gray-50);
    }

    .dads-menu-list-box__opener[data-text-weight='bold'] {
        font-weight: bold;
    }

    @media (hover: hover) {
        .dads-menu-list-box__opener:not(:disabled):hover {
            background-color: var(--color-neutral-solid-gray-50);
            text-decoration: underline;
            text-underline-offset: calc(3 / 16 * 1rem);
        }

        .dads-menu-list-box__opener[data-style='outlined']:not(:disabled):hover {
            border-color: var(--color-neutral-black);
        }

        .dads-menu-list-box__opener[data-style='filled']:not(:disabled):hover {
            background-color: var(--color-neutral-solid-gray-100);
        }
    }

    .dads-menu-list-box__opener:focus-visible {
        outline: calc(4 / 16 * 1rem) solid var(--color-neutral-black);
        outline-offset: calc(2 / 16 * 1rem);
        background-color: var(--color-primitive-yellow-300);
        box-shadow: 0 0 0 calc(2 / 16 * 1rem) var(--color-primitive-yellow-300);
    }

    .dads-menu-list-box__opener[data-style='filled']:focus-visible {
        background-color: var(--color-neutral-solid-gray-50);
    }

    .dads-menu-list-box__opener-icon {
        flex-shrink: 0;
        width: calc(20 / 16 * 1rem);
        height: calc(20 / 16 * 1rem);
    }

    .dads-menu-list-box__opener-arrow {
        margin-top: calc(4 / 16 * 1rem);
        flex-shrink: 0;
        width: calc(16 / 16 * 1rem);
        height: calc(16 / 16 * 1rem);
    }

    [aria-expanded='true'] > .dads-menu-list-box__opener-arrow {
        transform: rotate(180deg);
    }

    .dads-menu-list-box__popup {
        position: absolute;
        top: 100%;
        left: 0;
        z-index: 1;
        box-sizing: border-box;
        width: max-content;
        max-height: calc((16 + 44 * 6.5) / 16 * 1rem);
        overflow-y: auto;
        border-radius: calc(8 / 16 * 1rem) 0 0 calc(8 / 16 * 1rem);
        border: 1px solid var(--color-neutral-solid-gray-420);
        background-color: var(--color-neutral-white);
        padding: calc(16 / 16 * 1rem) 0;
        box-shadow: var(--elevation-1);
    }

    .dads-menu-list-box__popup[hidden] {
        display: none;
    }

    .dads-menu-list-box__opener:disabled,
    .dads-menu-list-box__opener[aria-disabled='true'] {
        color: var(--color-neutral-solid-gray-420);
        cursor: default;
    }

    @media (forced-colors: active) {
        .dads-menu-list-box__opener:disabled,
        .dads-menu-list-box__opener[aria-disabled='true'] {
            color: GrayText;
            border-color: GrayText;
        }
    }
</style>
