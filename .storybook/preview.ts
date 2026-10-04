import type { Preview } from "@storybook/svelte-vite";
import "../src/lib/global.css";
import "./preview.css";

const preview: Preview = {
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    controls: { expanded: true, sort: "requiredFirst" },
    options: { storySort: { method: "alphabetical", locales: "ja-JP" } },
  },
};

export default preview;
