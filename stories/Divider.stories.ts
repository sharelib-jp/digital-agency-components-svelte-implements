import type { Meta, StoryObj } from "./types";
import Divider from "../src/lib/components/Divider.svelte";
import documentation from "../docs/Divider.md?raw";
import { docsParameters } from "./docs";

const meta = {
  id: "components-divider",
  title: "Components/区切り線（Divider）",
  component: Divider,
  parameters: docsParameters(documentation),
  args: {
    element: "hr",
    color: "solid-gray-420",
    style: "solid",
    width: "1",
    Class: "",
  },
  argTypes: {
    element: { control: "select", options: ["hr", "div"] },
    color: {
      control: "select",
      options: ["solid-gray-420", "solid-gray-536", "black"],
    },
    style: {
      control: "select",
      options: ["solid", "dashed"],
      description: "線の種類。CSSのインラインstyle文字列ではありません。",
    },
    width: {
      control: "select",
      options: ["1", "2", "3", "4"],
      description: "線の太さを文字列で指定します。横幅ではありません。",
    },
    Class: { control: "text" },
  },
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Dashed: Story = {
  name: "破線",
  args: { style: "dashed", color: "solid-gray-536", width: "2" },
};

export const Strong: Story = {
  name: "太い実線",
  args: { color: "black", width: "4" },
};

export const Decorative: Story = {
  name: "装飾用の区切り",
  args: { element: "div", style: "dashed", width: "2" },
};
