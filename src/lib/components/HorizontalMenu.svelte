<script context="module" lang="ts">
    export interface HorizontalMenuLinkItem {
        id: string;
        label: string;
        href?: string;
        current?: boolean;
        disabled?: boolean;
        iconPath?: string;
        iconViewBox?: string;
    }

    export interface HorizontalMenuItem extends HorizontalMenuLinkItem {
        children?: HorizontalMenuLinkItem[];
    }

    export interface HorizontalMenuSelectDetail {
        id: string;
        item: HorizontalMenuLinkItem;
        parentId: string | null;
        originalEvent: MouseEvent;
    }
</script>

<script lang="ts">
    import { createEventDispatcher, tick } from 'svelte';

    /** 最上位の項目。childrenで1段のサブメニューを指定し、親・子のIDは一意にする。既定値: []。 */
    export let items: HorizontalMenuItem[] = [];
    /** 外側のnav要素のaria-label。既定値: 'メインメニュー'。 */
    export let label: string = 'メインメニュー';
    /** 現在項目のID。nullなら各項目のcurrentを参照。選択時の更新はbind:selectedIdで受け取る。既定値: null。 */
    export let selectedId: string | null = null;
    /** 開いている親のID。bind:expandedId対応。nullで閉じ、不正・無効な親のIDはnullに補正。既定値: null。 */
    export let expandedId: string | null = null;
    /** 全項目を無効にし、開いているサブメニューを閉じる。既定値: false。 */
    export let disabled: boolean = false;

    let menuElement: HTMLUListElement;
    const dispatch = createEventDispatcher<{
        select: HorizontalMenuSelectDetail;
        toggle: { id: string; expanded: boolean };
    }>();

    $: if (
        expandedId !== null &&
        (disabled ||
            !items.some((item) => item.id === expandedId && !item.disabled && item.children?.length))
    ) {
        expandedId = null;
    }

    function isCurrent(item: HorizontalMenuLinkItem, currentId: string | null) {
        return currentId !== null ? currentId === item.id : !!item.current;
    }

    function isParentCurrent(item: HorizontalMenuItem, currentId: string | null) {
        return isCurrent(item, currentId) ||
            !!item.children?.some((child) => isCurrent(child, currentId));
    }

    function setExpanded(id: string | null) {
        if (id === expandedId) return;
        const previousId = expandedId;
        expandedId = id;
        if (previousId !== null) dispatch('toggle', { id: previousId, expanded: false });
        if (id !== null) dispatch('toggle', { id, expanded: true });
    }

    function selectItem(
        event: MouseEvent,
        item: HorizontalMenuLinkItem,
        parentId: string | null = null,
    ) {
        if (disabled || item.disabled) {
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
                { id: item.id, item, parentId, originalEvent: event },
                { cancelable: true },
            )
        ) {
            event.preventDefault();
            return;
        }
        selectedId = item.id;
        closeMenu(parentId !== null && item.href === undefined);
    }

    function topLevelControls() {
        return Array.from(
            menuElement?.querySelectorAll<HTMLElement>(
                '[data-js-top-level]:not(:disabled):not([aria-disabled="true"])',
            ) ?? [],
        );
    }

    function expandedItemElement() {
        return Array.from(menuElement?.children ?? []).find(
            (element) => element.getAttribute('data-item-id') === expandedId,
        );
    }

    function closeMenu(restoreFocus = false) {
        const trigger = restoreFocus
            ? expandedItemElement()?.querySelector<HTMLElement>('[data-js-top-level]')
            : null;
        setExpanded(null);
        trigger?.focus();
    }

    async function openMenu(item: HorizontalMenuItem, last = false) {
        setExpanded(item.id);
        await tick();
        if (expandedId !== item.id) return;
        const controls = expandedItemElement()?.querySelectorAll<HTMLElement>(
            '[data-js-submenu-item]:not(:disabled):not([aria-disabled="true"])',
        );
        if (controls?.length) controls[last ? controls.length - 1 : 0].focus();
    }

    function handleKeydown(event: KeyboardEvent) {
        if (disabled || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey)
            return;
        const target = event.target;
        if (!(target instanceof HTMLElement) || !menuElement?.contains(target)) return;

        if (event.key === 'Escape' && expandedId !== null) {
            event.preventDefault();
            closeMenu(true);
            return;
        }

        const topControls = topLevelControls();
        const topIndex = topControls.indexOf(target);
        if (topIndex !== -1) {
            const itemId = target.closest('[data-item-id]')?.getAttribute('data-item-id');
            const item = items.find((entry) => entry.id === itemId);
            if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && item?.children?.length) {
                event.preventDefault();
                void openMenu(item, event.key === 'ArrowUp');
            } else if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
                event.preventDefault();
                closeMenu();
                const index =
                    event.key === 'Home'
                        ? 0
                        : event.key === 'End'
                          ? topControls.length - 1
                          : (topIndex + (event.key === 'ArrowRight' ? 1 : -1) + topControls.length) %
                            topControls.length;
                topControls[index]?.focus();
            }
            return;
        }

        const controls = Array.from(
            expandedItemElement()?.querySelectorAll<HTMLElement>(
                '[data-js-submenu-item]:not(:disabled):not([aria-disabled="true"])',
            ) ?? [],
        );
        const index = controls.indexOf(target);
        if (index === -1 || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const nextIndex =
            event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? controls.length - 1
                  : (index + (event.key === 'ArrowDown' ? 1 : -1) + controls.length) % controls.length;
        controls[nextIndex]?.focus();
    }

    function handleOutside(event: PointerEvent | FocusEvent) {
        if (
            expandedId !== null &&
            event.target instanceof Node &&
            !expandedItemElement()?.contains(event.target)
        ) {
            closeMenu();
        }
    }
</script>

<svelte:document on:pointerdown={handleOutside} on:focusin={handleOutside} on:keydown={handleKeydown} />

<nav aria-label={label}>
    <ul class="dads-horizontal-menu" bind:this={menuElement}>
        {#each items as item (item.id)}
            <li class="dads-horizontal-menu__item" data-item-id={item.id}>
                {#if item.children?.length}
                    <button
                        class="dads-horizontal-menu__item-inner"
                        type="button"
                        data-js-top-level
                        disabled={disabled || item.disabled}
                        aria-current={isParentCurrent(item, selectedId) ? 'true' : undefined}
                        aria-expanded={expandedId === item.id}
                        on:click={() => setExpanded(expandedId === item.id ? null : item.id)}
                    >
                        {#if item.iconPath}
                            <svg class="dads-horizontal-menu__front-icon" width="24" height="24" viewBox={item.iconViewBox ?? '0 0 24 24'} aria-hidden="true">
                                <path d={item.iconPath} fill="currentcolor" />
                            </svg>
                        {/if}
                        <span class="dads-horizontal-menu__label">{item.label}</span>
                        <svg class="dads-horizontal-menu__chevron" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M12 17L3 8L4 7L12 15L20 7L21 8L12 17Z" fill="currentcolor" />
                        </svg>
                    </button>
                    {#if expandedId === item.id}
                        <ul class="dads-horizontal-menu__submenu dads-menu-list" aria-label={item.label}>
                            {#each item.children as child (child.id)}
                                <li>
                                    <svelte:element
                                        this={child.href !== undefined ? 'a' : 'button'}
                                        role={child.href !== undefined ? 'link' : 'button'}
                                        class="dads-menu-list__item"
                                        type={child.href === undefined ? 'button' : undefined}
                                        href={disabled || child.disabled ? undefined : child.href}
                                        disabled={child.href === undefined ? disabled || child.disabled : undefined}
                                        aria-disabled={disabled || child.disabled ? 'true' : undefined}
                                        tabindex={disabled || child.disabled ? -1 : undefined}
                                        aria-current={isCurrent(child, selectedId) ? 'page' : undefined}
                                        data-current={isCurrent(child, selectedId) ? '' : undefined}
                                        data-type="standard"
                                        data-size="regular"
                                        data-js-submenu-item
                                        on:click={(event: MouseEvent) => selectItem(event, child, item.id)}
                                    >
                                        {#if child.iconPath}
                                            <svg class="dads-menu-list__front-icon" width="24" height="24" viewBox={child.iconViewBox ?? '0 0 24 24'} aria-hidden="true">
                                                <path d={child.iconPath} fill="currentcolor" />
                                            </svg>
                                        {/if}
                                        <span>{child.label}</span>
                                    </svelte:element>
                                </li>
                            {/each}
                        </ul>
                    {/if}
                {:else}
                    <svelte:element
                        this={item.href !== undefined ? 'a' : 'button'}
                        role={item.href !== undefined ? 'link' : 'button'}
                        class="dads-horizontal-menu__item-inner"
                        type={item.href === undefined ? 'button' : undefined}
                        href={disabled || item.disabled ? undefined : item.href}
                        disabled={item.href === undefined ? disabled || item.disabled : undefined}
                        aria-disabled={disabled || item.disabled ? 'true' : undefined}
                        tabindex={disabled || item.disabled ? -1 : undefined}
                        aria-current={isCurrent(item, selectedId) ? 'page' : undefined}
                        data-js-top-level
                        on:click={(event: MouseEvent) => selectItem(event, item)}
                    >
                        {#if item.iconPath}
                            <svg class="dads-horizontal-menu__front-icon" width="24" height="24" viewBox={item.iconViewBox ?? '0 0 24 24'} aria-hidden="true">
                                <path d={item.iconPath} fill="currentcolor" />
                            </svg>
                        {/if}
                        <span class="dads-horizontal-menu__label">{item.label}</span>
                    </svelte:element>
                {/if}
            </li>
        {/each}
    </ul>
</nav>

<style>
    .dads-horizontal-menu {
        margin: 0;
        display: flex;
        align-items: stretch;
        border-bottom: 1px solid var(--color-neutral-solid-gray-420);
        padding: 0;
        color: var(--color-neutral-solid-gray-900);
        list-style-type: none;
        font-weight: bold;
        font-size: calc(16 / 16 * 1rem);
        line-height: 1.3;
        font-family: var(--font-family-sans);
        letter-spacing: 0;
    }

    .dads-horizontal-menu__item {
        display: flex;
        align-items: stretch;
        position: relative;
    }

    .dads-horizontal-menu__item-inner,
    .dads-horizontal-menu__item-inner:any-link {
        position: relative;
        display: flex;
        align-items: center;
        gap: calc(4 / 16 * 1rem);
        box-sizing: border-box;
        min-height: calc(64 / 16 * 1rem);
        border: 0;
        background-color: transparent;
        padding: calc(16 / 16 * 1rem) calc(20 / 16 * 1rem);
        color: inherit;
        font: inherit;
        text-decoration: none;
        cursor: pointer;
    }

    .dads-horizontal-menu__front-icon {
        flex-shrink: 0;
        width: calc(24 / 16 * 1rem);
        height: calc(24 / 16 * 1rem);
    }

    .dads-horizontal-menu__chevron {
        margin-top: calc(4 / 16 * 1rem);
        box-sizing: content-box;
        flex-shrink: 0;
        width: calc(16 / 16 * 1rem);
        height: calc(16 / 16 * 1rem);
    }

    @media (hover: hover) {
        .dads-horizontal-menu__item-inner:where(:not(:disabled):not([aria-disabled='true'])):hover {
            background-color: var(--color-neutral-solid-gray-50);
        }

        .dads-horizontal-menu__item-inner:where(
                :not(:disabled):not([aria-disabled='true'])
            ):hover::after {
            position: absolute;
            right: 0;
            bottom: 0;
            left: 0;
            border-bottom: 2px solid var(--color-neutral-black);
            content: '';
        }
    }

    .dads-horizontal-menu__item-inner[aria-current] {
        background-color: var(--color-neutral-white);
        color: var(--color-key-1000);
    }

    .dads-horizontal-menu__item-inner[aria-current]::after {
        position: absolute;
        right: 0;
        bottom: 0;
        left: 0;
        border-bottom: 4px solid var(--color-key-900);
        content: '';
    }

    @media (hover: hover) {
        .dads-horizontal-menu__item-inner[aria-current]:where(
                :not(:disabled):not([aria-disabled='true'])
            ):hover {
            color: var(--color-key-900);
            text-decoration: underline;
            text-decoration-thickness: calc(1 / 16 * 1rem);
            text-underline-offset: calc(3 / 16 * 1rem);
        }
    }

    .dads-horizontal-menu__item-inner:focus-visible {
        outline: calc(4 / 16 * 1rem) solid var(--color-neutral-black);
        outline-offset: calc(2 / 16 * 1rem);
        border-radius: calc(4 / 16 * 1rem);
        background-color: var(--color-primitive-yellow-300);
        box-shadow: 0 0 0 calc(2 / 16 * 1rem) var(--color-primitive-yellow-300);
        z-index: 2;
    }

    .dads-horizontal-menu__item-inner[aria-current]:focus-visible {
        background-color: var(--color-neutral-white);
    }

    .dads-horizontal-menu__item-inner[aria-expanded='true'] .dads-horizontal-menu__chevron {
        transform: rotate(180deg);
    }

    .dads-menu-list {
        margin: 0;
        list-style-type: none;
        color: var(--color-neutral-solid-gray-800);
        font-weight: normal;
        font-size: calc(16 / 16 * 1rem);
        line-height: 1.3;
        font-family: var(--font-family-sans);
        letter-spacing: 0;
    }

    .dads-horizontal-menu__submenu {
        position: absolute;
        z-index: 3;
        top: 100%;
        left: 0;
        box-sizing: border-box;
        min-width: max(100%, calc(192 / 16 * 1rem));
        border: 1px solid var(--color-neutral-solid-gray-420);
        border-radius: calc(8 / 16 * 1rem);
        background-color: var(--color-neutral-white);
        padding: calc(8 / 16 * 1rem);
        box-shadow: var(--elevation-1);
    }

    .dads-menu-list__item,
    .dads-menu-list__item:any-link {
        display: flex;
        align-items: center;
        column-gap: calc(8 / 16 * 1rem);
        box-sizing: border-box;
        width: 100%;
        min-height: calc(44 / 16 * 1rem);
        border: 0;
        border-radius: calc(8 / 16 * 1rem);
        background-color: transparent;
        padding: calc(10 / 16 * 1rem) calc(16 / 16 * 1rem);
        color: inherit;
        text-align: left;
        font: inherit;
        letter-spacing: inherit;
        text-decoration: none;
        text-decoration-thickness: calc(1 / 16 * 1rem);
        cursor: pointer;
    }

    .dads-menu-list__item[data-current] {
        background-color: var(--color-key-100);
        color: var(--color-key-1000);
        font-weight: bold;
    }

    @media (hover: hover) {
        .dads-menu-list__item:where(:not(:disabled):not([aria-disabled='true'])):hover {
            background-color: var(--color-neutral-solid-gray-50);
            text-decoration: underline;
            text-underline-offset: calc(3 / 16 * 1rem);
        }

        .dads-menu-list__item[data-current]:where(:not(:disabled):not([aria-disabled='true'])):hover {
            background-color: var(--color-key-50);
            color: var(--color-key-900);
        }
    }

    .dads-menu-list__item:focus-visible {
        position: relative;
        z-index: 1;
        background-color: var(--color-primitive-yellow-300);
        outline: calc(4 / 16 * 1rem) solid var(--color-neutral-black);
        outline-offset: calc(2 / 16 * 1rem);
        box-shadow: 0 0 0 calc(2 / 16 * 1rem) var(--color-primitive-yellow-300);
    }

    .dads-menu-list__item[data-current]:focus-visible {
        background-color: var(--color-key-100);
    }

    .dads-menu-list__front-icon {
        flex-shrink: 0;
        width: calc(24 / 16 * 1rem);
        height: calc(24 / 16 * 1rem);
    }

    .dads-horizontal-menu__item-inner:disabled,
    .dads-horizontal-menu__item-inner[aria-disabled='true'],
    .dads-menu-list__item:disabled,
    .dads-menu-list__item[aria-disabled='true'] {
        color: var(--color-neutral-solid-gray-420);
        cursor: default;
    }

    @media (forced-colors: active) {
        .dads-horizontal-menu__item-inner:disabled,
        .dads-horizontal-menu__item-inner[aria-disabled='true'],
        .dads-menu-list__item:disabled,
        .dads-menu-list__item[aria-disabled='true'] {
            color: GrayText;
        }
    }
</style>
