<script lang="ts">
    export let For: string = '';
    export let label: string = '';
    export let required: boolean = false;
    export let supportText: string | null = null;
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
