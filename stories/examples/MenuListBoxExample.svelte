<script lang="ts">
  import type { ComponentArgs } from '../types';
  import MenuListBox from '../../src/lib/components/MenuListBox.svelte';

  export let args: ComponentArgs<typeof MenuListBox>;

  let open = false;
  let selectedId: string | null = null;
  $: open = args.open ?? false;
  $: selectedId = args.selectedId ?? null;
</script>

<div class="menu-list-box-example">
  <MenuListBox {...args} bind:open bind:selectedId />
</div>
<p>選択ID：{selectedId ?? '未選択'}／{open ? '開いています' : '閉じています'}</p>

<style>
  .menu-list-box-example {
    min-height: calc(288 / 16 * 1rem);
  }
</style>
