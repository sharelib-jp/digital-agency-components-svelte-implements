<script lang="ts">
  import type { ComponentArgs } from '../types';
  import ModalDialog from '../../src/lib/components/ModalDialog.svelte';

  export let args: ComponentArgs<typeof ModalDialog>;

  let open = false;
  let result = 'まだ開いていません';
  $: open = args.open ?? false;
</script>

<button type="button" on:click={() => open = true}>ダイアログを開く</button>
<ModalDialog
  {...args}
  bind:open
  on:open={() => result = '開きました'}
  on:close={(event) => result = `閉じました（${event.detail.reason}）`}
>
  <p style="white-space: pre-line; margin: 0;">{args.message}</p>
</ModalDialog>
<p aria-live="polite">{result}</p>
