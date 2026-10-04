<script lang="ts">
  import type { ComponentArgs } from '../types';
  import SearchBox, { type SearchBoxSearchDetail } from '../../src/lib/components/SearchBox.svelte';

  export let args: ComponentArgs<typeof SearchBox>;

  let value = '';
  let scope = '';
  let detailOpen = false;
  let publishedOnly = false;
  let submission = '';

  $: value = args.value ?? '';
  $: scope = args.scope ?? '';
  $: detailOpen = args.detailOpen ?? false;
  $: publishedId = `${args.id ?? 'storybook-search-box'}-published`;

  function handleSearch(event: CustomEvent<SearchBoxSearchDetail>) {
    const { value: query, scope: category, formData } = event.detail;
    submission = `検索語：${query}／検索対象：${category || 'すべて'}／${formData.has('published') ? '公開済みのみ' : 'すべての公開状態'}`;
  }

  function clearConditions(event: CustomEvent<{ originalEvent: Event }>) {
    event.preventDefault();
    value = '';
    scope = args.scopeOptions?.find((option) => !option.disabled)?.value ?? '';
    publishedOnly = false;
    submission = '';
  }
</script>

<SearchBox
  {...args}
  bind:value
  bind:scope
  bind:detailOpen
  on:search={handleSearch}
  on:reset={clearConditions}
>
  <label slot="detail" for={publishedId}>
    <input id={publishedId} type="checkbox" name="published" value="yes" bind:checked={publishedOnly} />
    公開済みの資料だけを検索
  </label>
</SearchBox>
<p aria-live="polite">{submission || '検索を実行すると送信条件を表示します。'}</p>
