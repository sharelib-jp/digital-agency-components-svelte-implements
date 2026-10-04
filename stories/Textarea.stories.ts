import type { Meta, StoryObj } from "./types";
import Textarea from "../src/lib/components/Textarea.svelte";
import documentation from "../docs/Textarea.md?raw";
import { docsParameters } from "./docs";

const meta = {
  id: "components-textarea",
  title: "Components/テキストエリア（Textarea）",
  component: Textarea,
  parameters: docsParameters(documentation),
  args: {
    id: "storybook-textarea-message",
    name: "message",
    label: "お問い合わせ内容",
    value: "オンライン申請の手続きについて教えてください。",
    size: "md",
    rows: 5,
    cols: 40,
    readonly: false,
    readonlyText: "編集不可",
    disabled: false,
    required: false,
    supportText: "状況を具体的に記入してください。",
    errorText: null,
    counterMax: null,
    counterErrorMessage: "{count}文字超過しています",
    counterExceededMessage: "{count}文字超過",
    counterRemainingMessage: "残り{count}文字",
    Class: "",
  },
  argTypes: {
    id: { control: "text" },
    name: { control: "text" },
    label: { control: "text" },
    value: { control: "text" },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "ラベルと間隔のサイズ。表示行数はrowsで指定します。",
    },
    rows: { control: { type: "number", min: 1, step: 1 } },
    cols: { control: { type: "number", min: 1, step: 1 } },
    readonly: { control: "boolean" },
    readonlyText: { control: "text" },
    disabled: { control: "boolean" },
    required: { control: "boolean" },
    supportText: { control: "text" },
    errorText: { control: "text" },
    counterMax: {
      control: { type: "number", min: 0, step: 1 },
      description:
        "nullでカウンタなし。非負整数でUTF-16コード単位を数え、超過を検証します。入力は切り詰めません。",
    },
    counterErrorMessage: { control: "text" },
    counterExceededMessage: { control: "text" },
    counterRemainingMessage: { control: "text" },
    Class: { control: "text" },
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CharacterCounter: Story = {
  args: {
    id: "storybook-textarea-summary",
    name: "summary",
    label: "申請の概要",
    required: true,
    counterMax: 100,
    supportText:
      "100文字以内で記入してください。絵文字などは複数単位で数える場合があります。",
  },
};

export const Readonly: Story = {
  args: {
    id: "storybook-textarea-receipt",
    name: "receipt",
    label: "受付結果",
    value: "申請を受け付けました。\n審査結果は後日お知らせします。",
    readonly: true,
    readonlyText: "参照のみ",
    supportText: "内容をコピーできます。",
    rows: 3,
    size: "sm",
  },
};

export const Disabled: Story = {
  args: {
    id: "storybook-textarea-disabled",
    name: "unavailableMemo",
    label: "追加メモ",
    value: "この項目は現在利用できません。",
    disabled: true,
    supportText: null,
    rows: 3,
  },
};

export const Error: Story = {
  args: {
    id: "storybook-textarea-reason",
    name: "reason",
    label: "申請理由",
    value: "必要です",
    required: true,
    size: "lg",
    errorText: "理由を10文字以上で記入してください。",
    supportText: "申請が必要な理由を具体的に記入してください。",
  },
};
