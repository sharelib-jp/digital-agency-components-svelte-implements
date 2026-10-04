import type { Meta, StoryObj } from "./types";
import Button from "../src/lib/components/Button.svelte";
import documentation from "../docs/Button.md?raw";
import { docsParameters } from "./docs";

const meta = {
  id: "components-button",
  title: "Components/ボタン（Button）",
  component: Button,
  parameters: docsParameters(documentation),
  args: {
    label: "内容を確認する",
    type: "solid-fill",
    size: "md",
    fullWidth: false,
  },
  argTypes: {
    label: { control: "text" },
    type: {
      control: "select",
      options: ["solid-fill", "outline"],
      description:
        "デザイン種別。型に含まれるsolid-outlineはCSS未実装のため選択肢に含めません。",
    },
    size: { control: "select", options: ["xs", "sm", "md", "lg"] },
    fullWidth: { control: "boolean" },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Outline: Story = {
  args: { type: "outline", label: "戻る" },
};

export const Large: Story = {
  args: { size: "lg", label: "申請内容を確認する" },
};

export const ExtraSmall: Story = {
  args: { size: "xs", label: "詳細" },
};

export const FullWidth: Story = {
  args: { fullWidth: true },
};
