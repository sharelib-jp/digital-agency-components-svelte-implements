<script lang="ts">
  import type { ComponentArgs } from '../types';
  import Link from '../../src/lib/components/Link.svelte';

  export let args: ComponentArgs<typeof Link>;

  $: targetId = args.href?.startsWith('#') ? args.href.slice(1) : undefined;
</script>

<Link {...args} />
<section aria-labelledby={targetId}>
  <h2 id={targetId}>お問い合わせ</h2>
  <p>申請や手続きに関するお問い合わせ方法をご案内します。</p>
</section>
