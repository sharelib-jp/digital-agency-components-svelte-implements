<script lang="ts">
  import type { ComponentArgs } from '../types';
  import FormControlLabel from '../../src/lib/components/FormControlLabel.svelte';

  export let args: ComponentArgs<typeof FormControlLabel>;
</script>

<div style="display: grid; gap: 0.5rem; max-width: 30rem;">
  <FormControlLabel {...args} />
  <input
    id={args.For}
    name="applicantName"
    type="text"
    required={args.required}
    aria-describedby={args.supportText ? args.supportTextId : undefined}
  />
</div>
