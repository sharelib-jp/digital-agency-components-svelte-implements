import type { Meta, StoryObj } from "./types";
import Checkbox from "../src/lib/components/Checkbox.svelte";
import documentation from "../docs/Checkbox.md?raw";
import { docsParameters } from "./docs";

const meta = {
  id: "components-checkbox",
  title: "Components/チェックボックス（Checkbox）",
  component: Checkbox,
  parameters: docsParameters(documentation),
  args: {
    id: "storybook-checkbox-news",
    name: "receiveNews",
    value: "yes",
    label: "お知らせを受け取る",
    size: "sm",
    checked: false,
    indeterminate: false,
    disabled: false,
    required: false,
    errored: false,
    supportText: "新しい制度や手続きに関するお知らせを受け取れます。",
    errorText: null,
    Class: "",
  },
  argTypes: {
    id: { control: "text" },
    name: { control: "text" },
    value: {
      control: "text",
      description:
        "チェックされたときの送信値。選択状態はcheckedで操作します。",
    },
    label: { control: "text" },
    size: { control: "select", options: ["sm", "md", "lg"] },
    checked: { control: "boolean" },
    indeterminate: {
      control: "boolean",
      description: "子項目の選択状態を自動集計する機能ではありません。",
    },
    disabled: { control: "boolean" },
    required: { control: "boolean" },
    errored: { control: "boolean" },
    supportText: { control: "text" },
    errorText: { control: "text" },
    Class: { control: "text" },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Checked: Story = {
  args: {
    id: "storybook-checkbox-checked",
    name: "receiveNewsChecked",
    checked: true,
  },
};

export const Indeterminate: Story = {
  args: {
    id: "storybook-checkbox-indeterminate",
    name: "allNews",
    label: "すべてのお知らせを選択",
    size: "md",
    indeterminate: true,
    supportText: "一部の項目が選択されている状態の表示例です。",
  },
};

export const Disabled: Story = {
  args: {
    id: "storybook-checkbox-disabled",
    name: "includedService",
    label: "契約に含まれるサービス（変更不可）",
    checked: true,
    disabled: true,
    supportText: "このサービスは契約に含まれるため変更できません。",
  },
};

export const Error: Story = {
  args: {
    id: "storybook-checkbox-consent",
    name: "consent",
    value: "agreed",
    label: "利用規約に同意する（必須）",
    size: "lg",
    required: true,
    errored: true,
    supportText: "利用規約を確認してから選択してください。",
    errorText: "利用規約への同意が必要です。",
  },
};
