<script lang="ts">
  import type { ComponentArgs } from '../types';
  import ResourceList, {
    type ResourceListActionDetail,
    type ResourceListChangeDetail,
    type ResourceListItem,
  } from '../../src/lib/components/ResourceList.svelte';

  export let args: ComponentArgs<typeof ResourceList>;

  let items: ResourceListItem[] = [];
  let message = '';
  $: items = (args.items ?? []).map((item) => ({ ...item }));
  $: hasControls = items.some((item) => item.type === 'checkbox' || item.type === 'radio');
  $: hasRadio = items.some((item) => item.type === 'radio');
  $: selectedTitles = items
    .filter((item) => (item.type === 'checkbox' || item.type === 'radio') && item.checked)
    .map((item) => item.title);

  function handleChange(event: CustomEvent<ResourceListChangeDetail>) {
    message = `${event.detail.item.title}：${event.detail.checked ? '選択' : '解除'}`;
  }

  function handleAction(event: CustomEvent<ResourceListActionDetail>) {
    message = `${event.detail.item.title}のアクションを選びました（実処理は行いません）。`;
  }

  function resetSelection() {
    items = (args.items ?? []).map((item) => ({ ...item }));
    message = 'Controlsで指定した初期状態に戻しました。';
  }
</script>

{#if hasControls}
  <fieldset>
    <legend>{hasRadio ? '受け取り方法を選択' : '対象資料を選択'}</legend>
    <ResourceList {...args} bind:items on:change={handleChange} on:action={handleAction} />
  </fieldset>
  <p>選択中：{selectedTitles.join('、') || 'なし'}</p>
  <button type="button" on:click={resetSelection}>選択を初期状態に戻す</button>
{:else}
  <ResourceList {...args} bind:items on:change={handleChange} on:action={handleAction} />
{/if}
<p aria-live="polite">{message}</p>
