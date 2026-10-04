<script lang="ts">
    /** 区切りの要素。hrは意味的な区切り、divは支援技術から隠す装飾。既定値: 'hr'。 */
    export let element: 'hr' | 'div' = 'hr';
    /** 共通カラートークンに対応する線の色。既定値: 'solid-gray-420'。 */
    export let color: 'solid-gray-420' | 'solid-gray-536' | 'black' = 'solid-gray-420';
    /** 実線・破線の選択。CSSのインラインstyle文字列ではない。既定値: 'solid'。 */
    export let style: 'solid' | 'dashed' = 'solid';
    /** 線の太さ（1〜4px）を文字列で指定。横幅ではない。既定値: '1'。 */
    export let width: '1' | '2' | '3' | '4' = '1';
    /** 区切り線のHTML class属性に追加するクラス。大文字のCで指定。既定値: ''。 */
    export let Class: string = '';
</script>

<svelte:element
    this={element}
    {...$$restProps}
    class={`dads-divider ${Class}`.trim()}
    data-color={color}
    data-style={style}
    data-width={width}
    aria-hidden={element === 'div' ? 'true' : undefined}
/>

<style>
    .dads-divider {
        margin: 0;
        border: 0;
        border-top: 1px solid;
        opacity: 1;
    }

    .dads-divider[data-color='solid-gray-420'] {
        border-top-color: var(--color-neutral-solid-gray-420);
    }

    .dads-divider[data-color='solid-gray-536'] {
        border-top-color: var(--color-neutral-solid-gray-536);
    }

    .dads-divider[data-color='black'] {
        border-top-color: var(--color-neutral-black);
    }

    .dads-divider[data-style='solid'] {
        border-top-style: solid;
    }

    .dads-divider[data-style='dashed'] {
        border-top-style: dashed;
    }

    .dads-divider[data-width='1'] {
        border-top-width: 1px;
    }

    .dads-divider[data-width='2'] {
        border-top-width: 2px;
    }

    .dads-divider[data-width='3'] {
        border-top-width: 3px;
    }

    .dads-divider[data-width='4'] {
        border-top-width: 4px;
    }
</style>
