<script lang="ts">
  import type { ComponentArgs } from '../types';
  import HorizontalMenu from '../../src/lib/components/HorizontalMenu.svelte';

  export let args: ComponentArgs<typeof HorizontalMenu>;

  let selectedId: string | null = null;
  let expandedId: string | null = null;
  $: selectedId = args.selectedId ?? null;
  $: expandedId = args.expandedId ?? null;
</script>

<div class="horizontal-menu-example">
  <HorizontalMenu {...args} bind:selectedId bind:expandedId />
</div>
<p>選択ID：{selectedId ?? '未選択'}／開いている親：{expandedId ?? 'なし'}</p>

<style>
  .horizontal-menu-example {
    min-height: calc(240 / 16 * 1rem);
  }
</style>
