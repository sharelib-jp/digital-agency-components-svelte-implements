import type { StorybookConfig } from "@storybook/svelte-vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { mergeConfig } from "vite";

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.ts"],
  addons: ["@storybook/addon-docs"],
  framework: "@storybook/svelte-vite",
  core: { disableTelemetry: true },
  async viteFinal(config) {
    // Pages serves the site below the repository name, not at the domain root.
    // Compile Svelte before Storybook's docgen plugin parses the generated JS.
    return mergeConfig({ plugins: [svelte()] }, { ...config, base: "./" });
  },
};

export default config;
