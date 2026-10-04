<script context="module" lang="ts">
    export type ProgressIndicatorShape = 'circular' | 'linear' | 'static';
    export type ProgressIndicatorType = 'stacked' | 'inlined' | 'stacked-underlay';
    export type ProgressIndicatorSize = 'lg' | 'sm';
    export type ProgressIndicatorIntent = 'explicit' | 'passive';
</script>

<script lang="ts">
    import { onMount } from 'svelte';

    /** 進捗表示の形状（円形・線形・静的な砂時計）。既定値: 'circular'。 */
    export let shape: ProgressIndicatorShape = 'circular';
    /** ラベルとの配置（縦並び・横並び・背景パネル付き縦並び）。既定値: 'stacked'。 */
    export let type: ProgressIndicatorType = 'stacked';
    /** SVGの表示サイズ。未指定時はtypeがinlinedならsm、それ以外ならlgを使う。 */
    export let size: ProgressIndicatorSize | undefined = undefined;
    /** 有限数なら確定進捗、それ以外は不確定。表示値だけを範囲内に補正し、propは書き換えない。既定値: null。 */
    export let value: number | null | undefined = null;
    /** 進捗の下限。上下限と差が有限でmax > minなら採用し、不正な範囲は内部で0〜100に戻す。既定値: 0。 */
    export let min: number = 0;
    /** 進捗の上限。minより大きい有限数で、差も有限となる範囲を指定する。既定値: 100。 */
    export let max: number = 100;
    /** 親から指定する処理中の状態。falseで非表示・アニメーション停止。内部では更新しない。既定値: true。 */
    export let active: boolean = true;
    /** 可視ラベル。空文字・空白のみなら表示しない。既定値: '読み込み中'。 */
    export let label: string = '読み込み中';
    /** progressbarのaria-label。未指定時は空でないlabel、なければ「読み込み中」を使う。 */
    export let ariaLabel: string | undefined = undefined;
    /** aria-valuetextの文言。割合より適切な件数などを指定できる。既定値: undefined。 */
    export let valueText: string | undefined = undefined;
    /** 可視ラベルがあり確定進捗なら、丸めた割合を併記する。既定値: true。 */
    export let showPercentage: boolean = true;
    /** 読み上げ通知の方針。explicitで開始・停止・定期通知、passiveでは通知なし。既定値: 'passive'。 */
    export let intent: ProgressIndicatorIntent = 'passive';
    /** explicit時の定期通知間隔（秒）。正の有限数以外は5秒として使う。既定値: 5。 */
    export let announceInterval: number = 5;
    /** explicit時の開始通知の文言。既定値: '読み込みを開始しました'。 */
    export let announceStart: string = '読み込みを開始しました';
    /** explicit時の停止通知。失敗・キャンセルを表す場合は文言を変更する。既定値: '読み込みが完了しました'。 */
    export let announceEnd: string = '読み込みが完了しました';
    /** explicit時の不確定進捗の定期通知。既定値: '読み込み中です'。 */
    export let announceLong: string = '読み込み中です';
    /** explicit時の確定進捗の定期通知。{value}を丸めた割合に置換する。既定値: '{value}% 読み込みました。'。 */
    export let announceLongWithValue: string = '{value}% 読み込みました。';
    /** progressbarのHTML class属性に追加するクラス。大文字のCで指定。既定値: ''。 */
    export let Class: string = '';
    /** progressbar要素のDOM ID。既定値: undefined。 */
    export let id: string | undefined = undefined;

    let mounted = false;
    let announcement = '';
    let previousActive = false;
    let previousIntent: ProgressIndicatorIntent = 'passive';
    let previousInterval = 0;
    let repeatTimer: ReturnType<typeof setInterval> | undefined;
    let announceTimer: ReturnType<typeof setTimeout> | undefined;

    $: validBounds =
        Number.isFinite(min) && Number.isFinite(max) && max > min && Number.isFinite(max - min);
    $: lower = validBounds ? min : 0;
    $: upper = validBounds ? max : 100;
    $: clampedValue =
        typeof value === 'number' && Number.isFinite(value)
            ? Math.min(upper, Math.max(lower, value))
            : null;
    $: percentage = clampedValue === null ? null : ((clampedValue - lower) / (upper - lower)) * 100;
    $: small = (size ?? (type === 'inlined' ? 'sm' : 'lg')) === 'sm';
    $: diameter = small ? 24 : 48;
    $: center = diameter / 2;
    $: radius = small ? 8 : 22;
    $: linearWidth = small ? 80 : 240;
    $: interval = Number.isFinite(announceInterval) && announceInterval > 0 ? announceInterval : 5;
    $: if (mounted) syncAnnouncements(active, intent, interval);

    function announce(text: string) {
        clearTimeout(announceTimer);
        announcement = '';
        announceTimer = setTimeout(() => {
            announcement = text;
            announceTimer = setTimeout(() => (announcement = ''), 1000);
        }, 100);
    }

    function syncAnnouncements(
        nextActive: boolean,
        nextIntent: ProgressIndicatorIntent,
        seconds: number,
    ) {
        const explicit = nextIntent === 'explicit';
        const started = nextActive && explicit && (!previousActive || previousIntent !== 'explicit');
        const stopped = !nextActive && previousActive && explicit && previousIntent === 'explicit';
        if (!nextActive || !explicit || started || seconds !== previousInterval) {
            clearInterval(repeatTimer);
            repeatTimer = undefined;
        }
        if (!explicit) {
            clearTimeout(announceTimer);
            announcement = '';
        } else if (started) announce(announceStart);
        else if (stopped) announce(announceEnd);
        if (nextActive && explicit && repeatTimer === undefined) {
            repeatTimer = setInterval(
                () =>
                    announce(
                        percentage === null
                            ? announceLong
                            : announceLongWithValue.replaceAll(
                                  '{value}',
                                  String(Math.round(percentage)),
                              ),
                    ),
                seconds * 1000,
            );
        }
        previousActive = nextActive;
        previousIntent = nextIntent;
        previousInterval = seconds;
    }

    onMount(() => {
        mounted = true;
        return () => {
            clearInterval(repeatTimer);
            clearTimeout(announceTimer);
        };
    });
</script>

<div
    {id}
    class={`dads-progress-indicator ${Class}`.trim()}
    data-type={type}
    data-active={active ? '' : undefined}
    role="progressbar"
    aria-label={ariaLabel ?? (label.trim() || '読み込み中')}
    aria-valuemin={lower}
    aria-valuemax={upper}
    aria-valuenow={clampedValue ?? undefined}
    aria-valuetext={valueText}
    style:--value={percentage ?? undefined}
>
    {#if shape === 'static'}
        <svg class="dads-progress-indicator__static" width={diameter} height={diameter} viewBox={`0 0 ${diameter} ${diameter}`} fill="none" aria-hidden="true">
            {#if small}
                <path fill="currentcolor" d="M9 6c0 1.8 1.1 5 3.5 5S16 7.4 16 6H9ZM8 21h9c0-1-.5-2.2-.5-2.2l-4-1.8-4 1.8S8 20 8 21Z" />
                <path stroke="currentcolor" d="M4 1.5h17m-17 21h17M6 1.5C6 5.1 7.6 12 12.5 12S18.9 5 19 1.5M19 22.5c.3-3.7-2.2-10.5-6.5-10.5S5.7 18.8 6 22.5" />
                <circle cx="12.5" cy="13.5" r=".5" fill="currentcolor" />
                <circle cx="12.5" cy="15.5" r=".5" fill="currentcolor" />
            {:else}
                <path fill="currentcolor" d="M17 15c0 2.5 2.2 7 7 7s7-5 7-7H17ZM15 42h18c0-2-1-4.5-1-4.5L24 34l-8 3.5S15 40 15 42Z" />
                <path stroke="currentcolor" stroke-width="2" d="M24 24C34.5 24 35.5 6 35.5 4.8V4M24 24C13.5 24 12.5 6 12.5 4.8V4M24 24c7 0 11.5 11.8 11.5 18.3V44M24 24c-7 0-11.5 11.8-11.5 18.3V44M9 4h30M9 44h30" />
                <circle cx="24" cy="28" r="1" fill="currentcolor" />
                <circle cx="24" cy="31" r="1" fill="currentcolor" />
            {/if}
        </svg>
    {:else if shape === 'linear'}
        <svg class="dads-progress-indicator__linear" data-indeterminate={percentage === null ? '' : undefined} width={linearWidth} height="4" viewBox={`0 0 ${linearWidth} 4`} stroke="currentcolor" fill="none" aria-hidden="true">
            <line class="dads-progress-indicator__track" x1="0" y1="2" x2={linearWidth} y2="2" stroke-width="4" />
            <line class="dads-progress-indicator__bar" x1="0" y1="2" x2={linearWidth} y2="2" stroke-width="4" pathLength="100" />
            <line class="dads-progress-indicator__border" x1="0" y1="3.5" x2={linearWidth} y2="3.5" stroke-width="1" />
        </svg>
    {:else}
        <svg class="dads-progress-indicator__spinner" data-indeterminate={percentage === null ? '' : undefined} width={diameter} height={diameter} viewBox={`0 0 ${diameter} ${diameter}`} stroke="currentcolor" fill="none" aria-hidden="true">
            <circle class="dads-progress-indicator__track" cx={center} cy={center} r={radius} stroke-width={small ? 3 : 4} />
            <g><g><circle class="dads-progress-indicator__bar" cx={center} cy={center} r={radius} stroke-width={small ? 3 : 4} pathLength="100" /></g></g>
            <circle class="dads-progress-indicator__border" cx={center} cy={center} r={small ? 9.5 : 23.5} stroke-width="1" />
        </svg>
    {/if}
    {#if label.trim()}
        <span class="dads-progress-indicator__label">{label}{#if showPercentage && percentage !== null}{' '}<span class="dads-progress-indicator__percentage">(<span>{Math.round(percentage)}</span>%)</span>{/if}</span>
    {/if}
</div>
<span class="dads-u-visually-hidden" role="status" aria-atomic="true">{announcement}</span>

<style>
    .dads-progress-indicator {
        display: flex;
        gap: calc(16 / 16 * 1rem) calc(8 / 16 * 1rem);
        justify-content: center;
        align-items: center;
        color: var(--color-neutral-solid-gray-900);
        font-weight: normal;
        font-size: calc(16 / 16 * 1rem);
        line-height: 1.7;
        font-family: var(--font-family-sans);
        letter-spacing: 0.02em;
    }

    .dads-progress-indicator:not([data-active]) {
        display: none;
    }

    .dads-progress-indicator:not([data-active]) * {
        animation: none !important;
    }

    .dads-progress-indicator[data-type='stacked'] {
        flex-direction: column;
    }

    .dads-progress-indicator[data-type='stacked-underlay'] {
        flex-direction: column;
        margin-right: auto;
        margin-left: auto;
        box-sizing: border-box;
        width: fit-content;
        border-radius: calc(16 / 16 * 1rem);
        border: 1px solid var(--color-neutral-solid-gray-500);
        background-color: var(--color-neutral-white);
    }

    .dads-progress-indicator[data-type='stacked-underlay']:has(
            .dads-progress-indicator__spinner,
            .dads-progress-indicator__static
        ) {
        min-width: calc(128 / 16 * 1rem);
        min-height: calc(128 / 16 * 1rem);
        padding: calc(16 / 16 * 1rem);
    }

    .dads-progress-indicator[data-type='stacked-underlay']:has(.dads-progress-indicator__linear) {
        padding: calc(24 / 16 * 1rem);
    }

    .dads-progress-indicator__track {
        stroke: currentcolor;
        color: var(--color-key-100);
    }

    .dads-progress-indicator__bar {
        color: var(--color-key-1200);
        /* A calculated SVG length needs a unit in Firefox; px here are SVG user units. */
        stroke-dashoffset: calc((100 - clamp(0, var(--value, 35), 100)) * 1px);
    }

    .dads-progress-indicator__border {
        color: var(--color-key-1200);
    }

    /* Spinner type */

    .dads-progress-indicator__spinner g {
        transform-origin: center;
    }

    .dads-progress-indicator__spinner .dads-progress-indicator__bar {
        stroke-dasharray: 100;
        transform: rotate(-90deg);
        transform-origin: center;
    }

    .dads-progress-indicator__spinner[data-indeterminate] g {
        animation: dads-spinner-rotate 13s linear infinite;
    }

    .dads-progress-indicator__spinner[data-indeterminate] g > g {
        animation: dads-spinner-group-rotate 2.5s linear infinite;
    }

    .dads-progress-indicator__spinner[data-indeterminate] .dads-progress-indicator__bar {
        animation:
            dads-spinner-bar-rotate 2.5s cubic-bezier(0.4, 0, 0.3, 1) infinite,
            dads-spinner-bar-dash 2.5s cubic-bezier(0.4, 0, 0.3, 1) infinite;
    }

    @keyframes dads-spinner-rotate {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }

    @keyframes dads-spinner-group-rotate {
        0% {
            transform: rotate(0deg);
        }
        30% {
            transform: rotate(135deg);
        }
        100% {
            transform: rotate(180deg);
        }
    }

    @keyframes dads-spinner-bar-rotate {
        0% {
            transform: rotate(0deg);
        }
        4% {
            transform: rotate(0deg);
        }
        30% {
            transform: rotate(360deg);
            animation-timing-function: cubic-bezier(0.5, 0.4, 0.3, 0.9);
        }
        100% {
            transform: rotate(540deg);
        }
    }

    @keyframes dads-spinner-bar-dash {
        0% {
            stroke-dasharray: 8 92;
            stroke-dashoffset: 4;
        }
        30% {
            stroke-dasharray: 80 20;
            stroke-dashoffset: 40;
        }
        100% {
            stroke-dasharray: 8 92;
            stroke-dashoffset: 4;
        }
    }

    /* Linear type */

    .dads-progress-indicator__linear .dads-progress-indicator__bar {
        stroke-dasharray: 100;
    }

    .dads-progress-indicator__linear[data-indeterminate] .dads-progress-indicator__bar {
        stroke-dasharray: 35 65;
        animation: dads-linear-rotate 4s linear infinite;
    }

    /* Static type */

    .dads-progress-indicator__static {
        color: var(--color-key-1200);
    }

    @keyframes dads-linear-rotate {
        0% {
            stroke-dashoffset: 100;
        }
        100% {
            stroke-dashoffset: -100;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .dads-progress-indicator__spinner,
        .dads-progress-indicator__spinner *,
        .dads-progress-indicator__linear,
        .dads-progress-indicator__linear * {
            animation: none !important;
        }
    }

    /* Percentage display */

    .dads-progress-indicator__percentage span {
        display: inline-block;
        min-width: 2ch;
        text-align: right;
        letter-spacing: 0;
        font-variant-numeric: tabular-nums;
    }

    @media (forced-colors: active) {
        .dads-progress-indicator__track {
            color: Canvas;
        }

        .dads-progress-indicator__bar,
        .dads-progress-indicator__border {
            color: CanvasText;
        }

        .dads-progress-indicator__static {
            color: CanvasText;
        }
    }

    .dads-progress-indicator__spinner,
    .dads-progress-indicator__static {
        flex-shrink: 0;
        width: calc(48 / 16 * 1rem);
        height: calc(48 / 16 * 1rem);
    }
    .dads-progress-indicator__spinner[width='24'],
    .dads-progress-indicator__static[width='24'] {
        width: calc(24 / 16 * 1rem);
        height: calc(24 / 16 * 1rem);
    }
    .dads-progress-indicator__linear {
        flex-shrink: 0;
        width: calc(240 / 16 * 1rem);
        height: calc(4 / 16 * 1rem);
    }
    .dads-progress-indicator__linear[width='80'] {
        width: calc(80 / 16 * 1rem);
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
