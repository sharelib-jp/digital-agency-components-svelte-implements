<script lang="ts">
    /** labelのfor属性。関連付ける入力のidと一致させ、大文字のFで指定します。既定値: ''。 */
    export let For: string = '';
    /** 入力目的を伝えるラベルのテキスト。既定値: ''。 */
    export let label: string = '';
    /** 必須・任意の表示を切り替えます。入力要素自体の必須制約は設定しません。既定値: false。 */
    export let required: boolean = false;
    /** ラベルの後に表示する補助文。空文字列では非表示です。既定値: null。 */
    export let supportText: string | null = null;
    /** 補助文のp要素のID。入力側のaria-describedbyで関連付けます。既定値: undefined。 */
    export let supportTextId: string | undefined = undefined;
</script>

<label
    class="dads-form-control-label__label"
    for={For}
>
    {label}

    {#if required}
        <span
            class="dads-form-control-label__requirement"
            data-required="true"
        >
            ※必須
        </span>
    {:else}
        <span
            class="dads-form-control-label__requirement"
            data-required="false"
        >
            ※任意
        </span>
    {/if}
</label>

{#if supportText}
    <p
        id={supportTextId}
        class="dads-form-control-label__support-text"
    >
        {supportText}
    </p>
{/if}
