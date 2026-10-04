<script context="module" lang="ts">
    export interface MenuListLinkItem {
        id: string;
        label: string;
        href?: string;
        target?: string;
        rel?: string;
        current?: boolean;
        disabled?: boolean;
        iconPath?: string;
        iconViewBox?: string;
        tailIconPath?: string;
        tailIconViewBox?: string;
        tailIconLabel?: string;
        endIconPath?: string;
        endIconViewBox?: string;
    }

    export interface MenuListItem extends MenuListLinkItem {
        children?: MenuListItem[];
    }

    export interface MenuListSelectDetail {
        id: string;
        item: MenuListItem;
        parentId: string | null;
        originalEvent: MouseEvent;
    }
</script>

<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    /** ルートのul要素のID。既定値: undefined。 */
    export let id: string | undefined = undefined;
    /** 表示項目。再帰的なchildrenは常時表示され、親・子孫のIDは一意にする。既定値: []。 */
    export let items: MenuListItem[] = [];
    /** ul要素のaria-label。必要に応じて指定する。既定値: undefined。 */
    export let label: string | undefined = undefined;
    /** 項目の外観。standardは角丸、boxは矩形。既定値: 'standard'。 */
    export let type: 'standard' | 'box' = 'standard';
    /** 項目の表示サイズ。既定値: 'regular'。 */
    export let size: 'regular' | 'small' = 'regular';
    /** 現在項目のID。nullなら各項目のcurrentを参照。選択時の更新はbind:selectedIdで受け取る。既定値: null。 */
    export let selectedId: string | null = null;
    /** 全項目と子孫を無効にする。既定値: false。 */
    export let disabled: boolean = false;
    /** インデント段数。非負の有限数を指定し、子リストでは1ずつ増える。既定値: 0。 */
    export let indentation: number = 0;
    /** ulのrole。menuは平坦な項目向けで、キーボード制御はMenuListBox側で行う。既定値: 'list'。 */
    export let role: 'list' | 'menu' = 'list';
    /** role="menu"でtabindex="0"にする有効な項目のID。フォーカスは移動しない。既定値: null。 */
    export let activeId: string | null = null;
    /** ルートのulのHTML class属性に追加するクラス。大文字のCで指定。既定値: ''。 */
    export let Class: string = '';

    const dispatch = createEventDispatcher<{ select: MenuListSelectDetail }>();

    function isCurrent(item: MenuListItem, currentId: string | null) {
        return currentId !== null ? currentId === item.id : !!item.current;
    }

    function selectItem(event: MouseEvent, item: MenuListItem) {
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
                { id: item.id, item, parentId: null, originalEvent: event },
                { cancelable: true },
            )
        ) {
            event.preventDefault();
            return;
        }
        selectedId = item.id;
    }

    function forwardSelect(event: CustomEvent<MenuListSelectDetail>, parentId: string) {
        if (
            !dispatch(
                'select',
                { ...event.detail, parentId: event.detail.parentId ?? parentId },
                { cancelable: true },
            )
        )
            event.preventDefault();
    }
</script>

<ul
    {...$$restProps}
    {id}
    class={`dads-menu-list ${Class}`}
    {role}
    aria-label={label}
    style={`${$$restProps.style ?? ''}; --menu-list-indentation: ${indentation};`}
    data-js-menu={role === 'menu' ? '' : undefined}
>
    {#each items as item (item.id)}
        <li role={role === 'menu' ? 'presentation' : undefined}>
            <svelte:element
                this={item.href !== undefined ? 'a' : 'button'}
                role={role === 'menu' ? 'menuitem' : item.href !== undefined ? 'link' : 'button'}
                class="dads-menu-list__item"
                type={item.href === undefined ? 'button' : undefined}
                href={disabled || item.disabled ? undefined : item.href}
                target={item.href !== undefined ? item.target : undefined}
                rel={item.href !== undefined ? item.rel ?? (item.target === '_blank' ? 'noopener noreferrer' : undefined) : undefined}
                disabled={item.href === undefined ? disabled || item.disabled : undefined}
                aria-disabled={disabled || item.disabled ? 'true' : undefined}
                tabindex={disabled || item.disabled ? -1 : role === 'menu' ? (activeId === item.id ? 0 : -1) : undefined}
                aria-current={isCurrent(item, selectedId) ? (item.href !== undefined ? 'page' : 'true') : undefined}
                data-current={isCurrent(item, selectedId) ? '' : undefined}
                data-expanded={item.children?.length ? '' : undefined}
                data-type={type}
                data-size={size}
                data-item-id={item.id}
                data-js-menu-item
                on:click={(event: MouseEvent) => selectItem(event, item)}
            >
                {#if item.iconPath}
                    <svg class="dads-menu-list__front-icon" width="24" height="24" viewBox={item.iconViewBox ?? '0 0 24 24'} aria-hidden="true">
                        <path d={item.iconPath} fill="currentcolor" />
                    </svg>
                {/if}
                <span class="dads-menu-list__label">
                    {item.label}
                    {#if item.tailIconPath || item.target === '_blank'}
                        <svg class="dads-menu-list__tail-icon" width="16" height="16"
                            viewBox={item.tailIconViewBox ?? '0 0 48 48'}
                            role={item.tailIconLabel || item.target === '_blank' ? 'img' : undefined}
                            aria-label={item.tailIconLabel ?? (item.target === '_blank' ? '新規タブで開きます' : undefined)}
                            aria-hidden={!item.tailIconLabel && item.target !== '_blank' ? 'true' : undefined}>
                            <path d={item.tailIconPath ?? 'M22 6V9H9V39H39V26H42V42H6V6H22ZM42 6V20H39V11.2L21 29L19 27L36.8 9H28V6H42Z'} fill="currentcolor" />
                        </svg>
                    {/if}
                </span>
                {#if item.endIconPath || item.children?.length}
                    <svg class="dads-menu-list__end-icon" width="16" height="16" viewBox={item.endIconViewBox ?? '0 0 24 24'} aria-hidden="true">
                        <path d={item.endIconPath ?? 'M12.5 17.1 3.5 8l1-1 8 8 8-8 1 1-9 9.1Z'} fill="currentcolor" />
                    </svg>
                {/if}
            </svelte:element>
            {#if item.children?.length}
                <svelte:self items={item.children} {type} {size} bind:selectedId
                    disabled={disabled || !!item.disabled} indentation={indentation + 1}
                    on:select={(event) => forwardSelect(event, item.id)} />
            {/if}
        </li>
    {/each}
</ul>

<style>
    .dads-menu-list {
        position: relative;
        z-index: 0;
        margin: 0;
        list-style-type: none;
        padding-left: 0;
        color: var(--color-neutral-solid-gray-800);
        font-weight: normal;
        font-size: calc(16 / 16 * 1rem);
        line-height: 1.3;
        font-family: var(--font-family-sans);
        letter-spacing: 0;
    }

    .dads-menu-list__item,
    .dads-menu-list__item:any-link {
        display: flex;
        align-items: center;
        column-gap: calc(8 / 16 * 1rem);
        box-sizing: border-box;
        width: -webkit-fill-available;
        width: -moz-available;
        width: stretch;
        border: 0;
        background-color: transparent;
        padding-right: calc(16 / 16 * 1rem);
        padding-left: calc(16 / 16 * 1rem);
        color: inherit;
        text-align: left;
        font: inherit;
        letter-spacing: inherit;
        text-decoration: none;
        text-decoration-thickness: calc(1 / 16 * 1rem);
    }

    .dads-menu-list__item[data-size='regular'] {
        min-height: calc(44 / 16 * 1rem);
        padding-top: calc(10 / 16 * 1rem);
        padding-bottom: calc(10 / 16 * 1rem);
        line-height: 1.3;
    }

    .dads-menu-list__item[data-size='small'] {
        min-height: calc(36 / 16 * 1rem);
        padding-top: calc(6 / 16 * 1rem);
        padding-bottom: calc(6 / 16 * 1rem);
        line-height: 1.2;
    }

    .dads-menu-list__item[data-type='standard'] {
        margin-left: calc(1rem * var(--menu-list-indentation, 0));
    }

    .dads-menu-list__item[data-type='standard'][data-size='regular'] {
        border-radius: calc(8 / 16 * 1rem);
    }

    .dads-menu-list__item[data-type='standard'][data-size='small'] {
        border-radius: calc(4 / 16 * 1rem);
    }

    .dads-menu-list__item[data-type='box'] {
        border-radius: 0;
        padding-left: calc(16 / 16 * 1rem + 1rem * var(--menu-list-indentation, 0));
    }

    .dads-menu-list__item[data-current] {
        background-color: var(--color-key-100);
        color: var(--color-key-1000);
        font-weight: bold;
    }

    .dads-menu-list__item:has(:global(+ * [data-current])) {
        background-color: var(--color-key-50);
        color: var(--color-key-1000);
    }

    @media (hover: hover) {
        .dads-menu-list__item:not(:disabled):not([aria-disabled='true']):hover {
            background-color: var(--color-neutral-solid-gray-50);
            text-decoration: underline;
            text-underline-offset: calc(3 / 16 * 1rem);
        }

        .dads-menu-list__item[data-current]:not(:disabled):not([aria-disabled='true']):hover,
        .dads-menu-list__item:has(:global(+ * [data-current])):not(:disabled):not(
                [aria-disabled='true']
            ):hover {
            background-color: var(--color-key-50);
            color: var(--color-key-900);
        }
    }

    .dads-menu-list__item:focus-visible {
        position: relative;
        z-index: 1;
        background-color: var(--color-primitive-yellow-300);
    }

    .dads-menu-list__item[data-type='standard']:focus-visible {
        outline: calc(4 / 16 * 1rem) solid var(--color-neutral-black);
        outline-offset: calc(2 / 16 * 1rem);
        box-shadow: 0 0 0 calc(2 / 16 * 1rem) var(--color-primitive-yellow-300);
    }

    .dads-menu-list__item[data-type='box']:focus-visible {
        outline: calc(4 / 16 * 1rem) solid var(--color-neutral-black);
        outline-offset: calc(-4 / 16 * 1rem);
        box-shadow: inset 0 0 0 calc(6 / 16 * 1rem) var(--color-primitive-yellow-300);
    }

    .dads-menu-list__item[data-current]:focus-visible {
        background-color: var(--color-key-100);
    }

    .dads-menu-list__item:has(:global(+ * [data-current])):focus-visible {
        background-color: var(--color-key-50);
    }

    .dads-menu-list__front-icon {
        flex-shrink: 0;
    }

    .dads-menu-list__tail-icon {
        display: inline-block;
        vertical-align: -0.15em;
    }

    .dads-menu-list__end-icon {
        margin-top: calc(2 / 16 * 1rem);
        margin-right: calc(-4 / 16 * 1rem);
        margin-left: auto;
        flex-shrink: 0;
    }

    .dads-menu-list__item[data-expanded] .dads-menu-list__end-icon {
        transform: rotate(180deg);
    }

    .dads-menu-list__item:disabled,
    .dads-menu-list__item[aria-disabled='true'] {
        color: var(--color-neutral-solid-gray-420);
        cursor: default;
        text-decoration: none;
    }

    @media (forced-colors: active) {
        .dads-menu-list__item:disabled,
        .dads-menu-list__item[aria-disabled='true'] {
            color: GrayText;
        }
    }
</style>
