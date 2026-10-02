<script lang="ts">
    type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
    type HeadingSize = '64' | '57' | '45' | '36' | '32' | '28' | '24' | '20' | '18' | '16';

    export let level: HeadingLevel = 'h2';
    export let size: HeadingSize = '36';
    export let text: string = '';
    export let shoulder: string | null = null;
    export let chip: boolean = false;
    export let icon: boolean = false;
    export let rule: '8' | '6' | '4' | '2' | undefined = undefined;
    export let id: string | undefined = undefined;
    export let Class: string = '';

    $: hasShoulder = Boolean(shoulder || $$slots.shoulder);
</script>

<svelte:element
    this={hasShoulder ? 'hgroup' : 'div'}
    {...$$restProps}
    class={`dads-heading ${Class}`.trim()}
    data-size={size}
    data-chip={chip ? '' : undefined}
    data-rule={rule}
>
    {#if hasShoulder}
        <p class="dads-heading__shoulder"><slot name="shoulder">{shoulder}</slot></p>
    {/if}
    <svelte:element this={level} {id} class="dads-heading__heading">
        {#if icon || $$slots.icon}
            <span class="dads-heading__icon" aria-hidden="true">
                <slot name="icon">
                    <svg class="dads-heading__icon-svg" width="24" height="24" viewBox="0 0 24 24" fill="currentcolor" aria-hidden="true">
                        <path d="M4.6 20.5c-.5-.1-1-.6-1.1-1l16-16c.5.1.9.6 1 1l-16 16Zm-1.1-6.4v-2L12 3.4h2.1L3.5 14.1Zm0-7.4V5.3c0-1 .8-1.8 1.8-1.8h1.4L3.5 6.7Zm13.8 13.8 3.2-3.2v1.4c0 1-.8 1.8-1.8 1.8h-1.4Zm-7.4 0L20.5 9.9v2L12 20.6H9.9Z" />
                    </svg>
                </slot>
            </span>
        {/if}
        <slot>{text}</slot>
    </svelte:element>
</svelte:element>

<style>
    .dads-heading {
        color: var(--color-neutral-solid-gray-800);
        font-family: var(--font-family-sans);
    }

    .dads-heading[data-size='64'] {
        --_shoulder-size: calc(28 / 16 * 1rem);
        --_shoulder-line-height: 1.5;
        --_shoulder-letter-spacing: 0.01em;
        font-weight: bold;
        font-size: calc(64 / 16 * 1rem);
        line-height: 1.4;
        letter-spacing: 0;
    }

    .dads-heading[data-size='57'] {
        --_shoulder-size: calc(24 / 16 * 1rem);
        --_shoulder-line-height: 1.5;
        --_shoulder-letter-spacing: 0.02em;
        font-weight: bold;
        font-size: calc(57 / 16 * 1rem);
        line-height: 1.4;
        letter-spacing: 0;
    }

    .dads-heading[data-size='45'] {
        --_shoulder-size: calc(22 / 16 * 1rem);
        --_shoulder-line-height: 1.5;
        --_shoulder-letter-spacing: 0.02em;
        font-weight: bold;
        font-size: calc(45 / 16 * 1rem);
        line-height: 1.4;
        letter-spacing: 0;
    }

    .dads-heading[data-size='36'] {
        --_shoulder-size: calc(20 / 16 * 1rem);
        --_shoulder-line-height: 1.5;
        --_shoulder-letter-spacing: 0.02em;
        font-weight: bold;
        font-size: calc(36 / 16 * 1rem);
        line-height: 1.4;
        letter-spacing: 0.01em;
    }

    .dads-heading[data-size='32'] {
        --_shoulder-size: calc(18 / 16 * 1rem);
        --_shoulder-line-height: 1.6;
        --_shoulder-letter-spacing: 0.02em;
        font-weight: bold;
        font-size: calc(32 / 16 * 1rem);
        line-height: 1.5;
        letter-spacing: 0.01em;
    }

    .dads-heading[data-size='28'] {
        --_shoulder-size: calc(16 / 16 * 1rem);
        --_shoulder-line-height: 1.7;
        --_shoulder-letter-spacing: 0.02em;
        font-weight: bold;
        font-size: calc(28 / 16 * 1rem);
        line-height: 1.5;
        letter-spacing: 0.01em;
    }

    .dads-heading[data-size='24'] {
        --_shoulder-size: calc(16 / 16 * 1rem);
        --_shoulder-line-height: 1.7;
        --_shoulder-letter-spacing: 0.02em;
        font-weight: bold;
        font-size: calc(24 / 16 * 1rem);
        line-height: 1.5;
        letter-spacing: 0.02em;
    }

    .dads-heading[data-size='20'] {
        --_shoulder-size: calc(16 / 16 * 1rem);
        --_shoulder-line-height: 1.7;
        --_shoulder-letter-spacing: 0.02em;
        font-weight: bold;
        font-size: calc(20 / 16 * 1rem);
        line-height: 1.5;
        letter-spacing: 0.02em;
    }

    .dads-heading[data-size='18'] {
        --_shoulder-size: calc(16 / 16 * 1rem);
        --_shoulder-line-height: 1.7;
        --_shoulder-letter-spacing: 0.02em;
        font-weight: bold;
        font-size: calc(18 / 16 * 1rem);
        line-height: 1.6;
        letter-spacing: 0.02em;
    }

    .dads-heading[data-size='16'] {
        --_shoulder-size: calc(16 / 16 * 1rem);
        --_shoulder-line-height: 1.7;
        --_shoulder-letter-spacing: 0.02em;
        font-weight: bold;
        font-size: calc(16 / 16 * 1rem);
        line-height: 1.7;
        letter-spacing: 0.02em;
    }

    .dads-heading[data-chip] {
        position: relative;
        padding-left: calc(1em / 3 + 0.5em);
    }

    .dads-heading[data-chip]::before {
        position: absolute;
        top: 0.2em;
        bottom: 0.1em;
        left: 0;
        width: calc(1em / 3);
        background-color: var(--color-key-900);
        content: '';
    }

    @supports (top: 1lh) {
        .dads-heading[data-chip]::before {
            top: calc(0.5lh - 0.45em);
            bottom: calc(0.5lh - 0.55em);
        }
    }

    .dads-heading[data-chip]:has(.dads-heading__shoulder)::before {
        top: calc((var(--_shoulder-size) * (var(--_shoulder-line-height) - 1)) / 2);
    }

    @media (forced-colors: active) {
        .dads-heading[data-chip]::before {
            background-color: CanvasText;
        }
    }

    .dads-heading[data-rule] {
        border-bottom: solid var(--color-key-900);
    }

    .dads-heading[data-rule='8'] {
        border-bottom-width: calc(8 / 16 * 1rem);
        padding-bottom: calc(32 / 16 * 1rem);
    }

    .dads-heading[data-rule='6'] {
        border-bottom-width: calc(6 / 16 * 1rem);
        padding-bottom: calc(24 / 16 * 1rem);
    }

    .dads-heading[data-rule='4'] {
        border-bottom-width: calc(4 / 16 * 1rem);
        padding-bottom: calc(16 / 16 * 1rem);
    }

    .dads-heading[data-rule='2'] {
        border-bottom-width: calc(2 / 16 * 1rem);
        padding-bottom: calc(8 / 16 * 1rem);
    }

    .dads-heading__shoulder {
        margin: 0;
        font-weight: bold;
        font-size: var(--_shoulder-size);
        line-height: var(--_shoulder-line-height);
        letter-spacing: var(--_shoulder-letter-spacing);
    }

    .dads-heading__heading {
        margin: 0;
        font: inherit;
    }

    .dads-heading__icon {
        margin-right: calc(0.4em - 0.25em);
    }

    .dads-heading__icon::after {
        content: ' ';
    }

    .dads-heading__icon-svg,
    .dads-heading__icon :global(svg) {
        display: inline-block;
        width: 1.25em;
        height: 1.25em;
        vertical-align: -0.25em;
    }
</style>
