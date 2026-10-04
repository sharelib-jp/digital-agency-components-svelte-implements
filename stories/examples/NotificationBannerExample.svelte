<script lang="ts">
  import type { ComponentArgs } from '../types';
  import NotificationBanner from '../../src/lib/components/NotificationBanner.svelte';

  export let args: ComponentArgs<typeof NotificationBanner>;

  let open = true;
  let closeCount = 0;
  $: open = args.open ?? true;
</script>

<NotificationBanner {...args} bind:open on:close={() => (closeCount += 1)} />
<div class="notification-banner-example-controls">
  <button type="button" disabled={open} on:click={() => (open = true)}>
    通知を再表示する
  </button>
  <p>通知を閉じた回数：{closeCount}</p>
</div>

<style>
  .notification-banner-example-controls {
    margin-top: calc(16 / 16 * 1rem);
  }
</style>
