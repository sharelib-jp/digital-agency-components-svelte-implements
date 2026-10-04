<script lang="ts">
  import type { ComponentArgs } from '../types';
  import StepNavigation from '../../src/lib/components/StepNavigation.svelte';

  export let args: ComponentArgs<typeof StepNavigation>;

  let currentId: string | null = null;
  $: currentId = args.currentId ?? null;
</script>

<StepNavigation {...args} bind:currentId />
<p>現在のステップID：{currentId ?? '未指定'}</p>
<p>ボタン操作で現在位置を変更します。各ステップの完了状態は自動更新しません。</p>
