import type { Meta, StoryObj } from "./types";
import Switch from "../src/lib/components/Switch.svelte";
import documentation from "../docs/Switch.md?raw";
import { docsParameters } from "./docs";

const meta = {
  id: "components-switch",
  title: "Components/スイッチ（Switch）",
  component: Switch,
  parameters: docsParameters(documentation),
  args: {
    id: "storybook-switch-notifications",
    type: "on-off",
    name: "notifications",
    value: "enabled",
    checked: false,
    label: "通知を受け取る",
    leftLabel: "一覧",
    rightLabel: "地図",
    disabled: false,
    required: false,
    supportText: "オンにすると新しいお知らせを通知します。",
    errorText: null,
    Class: "",
  },
  argTypes: {
    id: { control: "text" },
    type: { control: "select", options: ["on-off", "mode"] },
    name: {
      control: "text",
      description: "on-offの送信名。modeでは送信値を生成しません。",
    },
    value: {
      control: "text",
      description: "on-offがオンの場合の送信値。modeでは使われません。",
    },
    checked: {
      control: "boolean",
      description: "on-offのオン状態。modeではfalseが左、trueが右です。",
    },
    label: { control: "text" },
    leftLabel: { control: "text" },
    rightLabel: { control: "text" },
    disabled: { control: "boolean" },
    required: {
      control: "boolean",
      description:
        "on-offはnative必須制約。modeは必須表示とaria-requiredのみです。",
    },
    supportText: { control: "text" },
    errorText: {
      control: "text",
      description:
        "説明文とARIA状態を設定します。スイッチ本体のエラー配色は未実装です。",
    },
    Class: { control: "text" },
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const On: Story = {
  args: {
    id: "storybook-switch-on",
    name: "enabledNotifications",
    checked: true,
  },
};

export const Mode: Story = {
  args: {
    id: "storybook-switch-view",
    type: "mode",
    name: undefined,
    label: "表示形式",
    supportText:
      "一覧と地図を切り替えます。どちらのボタンを操作しても状態が反転します。",
  },
};

export const Disabled: Story = {
  args: {
    id: "storybook-switch-disabled",
    name: "emergencyNotifications",
    label: "緊急速報",
    checked: true,
    disabled: true,
    supportText: "管理者が設定するため変更できません。",
  },
};

export const Error: Story = {
  args: {
    id: "storybook-switch-important",
    name: "importantNotifications",
    label: "重要な通知",
    required: true,
    supportText: "この設定は利用に必要です。",
    errorText: "重要な通知をオンにしてください。",
  },
};
