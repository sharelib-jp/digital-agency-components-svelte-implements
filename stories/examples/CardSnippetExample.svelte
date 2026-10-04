<script lang="ts">
  import type { ComponentArgs } from '../types';
  import Card from '../../src/lib/components/Card.svelte';

  export let args: ComponentArgs<typeof Card>;
  let count = 0;
</script>

{#snippet cardContent()}
  <p>申請する前に、次の書類をご確認ください。</p>
  <ul>
    <li>本人確認書類</li>
    <li>申請書</li>
  </ul>
  <button type="button" onclick={() => count += 1}>確認しました</button>
  <p aria-live="polite">確認回数: {count}</p>
{/snippet}

<Card {...args} content={cardContent} />
