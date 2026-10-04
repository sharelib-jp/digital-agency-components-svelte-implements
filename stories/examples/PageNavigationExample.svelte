<script lang="ts">
  import type { ComponentArgs } from '../types';
  import PageNavigation from '../../src/lib/components/PageNavigation.svelte';

  export let args: ComponentArgs<typeof PageNavigation>;

  let currentPage = 1;
  $: currentPage = args.currentPage ?? 1;
</script>

<PageNavigation {...args} bind:currentPage />
<p>現在ページ：{currentPage}（ページ内容の取得・切り替えは行わない表示例です）</p>
