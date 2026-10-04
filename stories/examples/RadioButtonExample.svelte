<script lang="ts">
  import type { ComponentArgs } from '../types';
  import RadioButton from '../../src/lib/components/RadioButton.svelte';

  export let args: ComponentArgs<typeof RadioButton>;

  let group: string | number | null = null;

  $: group = args.group ?? null;
  $: alternativeValue = args.value === 'phone' ? 'email' : 'phone';
  $: alternativeLabel = alternativeValue === 'email' ? 'メール' : '電話';
  $: describedBy = [
    args.supportText ? `${args.id}-support-text` : undefined,
    args.errorText ? `${args.id}-error-text` : undefined,
  ].filter(Boolean).join(' ') || undefined;
</script>

<fieldset>
  <legend>連絡方法{args.required ? '（必須）' : ''}</legend>
  <RadioButton {...args} bind:group />
  <RadioButton
    id={`${args.id}-alternative`}
    name={args.name}
    value={alternativeValue}
    label={alternativeLabel}
    size={args.size}
    disabled={args.disabled}
    required={args.required}
    errored={args.errored || Boolean(args.errorText)}
    Class={args.Class}
    aria-describedby={describedBy}
    bind:group
  />
</fieldset>
<p>選択値：{group ?? '未選択'}</p>
