import type { Meta, StoryObj } from "./types";
import ProgressIndicator from "../src/lib/components/ProgressIndicator.svelte";
import documentation from "../docs/ProgressIndicator.md?raw";
import { docsParameters } from "./docs";

const meta = {
  id: "components-progress-indicator",
  title: "Components/プログレスインジケーター（ProgressIndicator）",
  component: ProgressIndicator,
  parameters: docsParameters(documentation),
  args: {
    shape: "circular",
    type: "stacked",
    size: "lg",
    value: null,
    min: 0,
    max: 100,
    active: true,
    label: "資料を読み込み中",
    showPercentage: true,
    intent: "passive",
    announceInterval: 5,
    announceStart: "読み込みを開始しました",
    announceEnd: "読み込みが完了しました",
    announceLong: "読み込み中です",
    announceLongWithValue: "{value}% 読み込みました。",
    Class: "",
  },
  argTypes: {
    shape: { control: "select", options: ["circular", "linear", "static"] },
    type: {
      control: "select",
      options: ["stacked", "inlined", "stacked-underlay"],
    },
    size: { control: "select", options: ["lg", "sm"] },
    value: {
      control: "number",
      description: "有限数で確定進捗、nullまたは未指定で不確定進捗。",
    },
    min: { control: "number" },
    max: { control: "number" },
    active: { control: "boolean" },
    label: { control: "text" },
    ariaLabel: { control: "text" },
    valueText: { control: "text" },
    showPercentage: { control: "boolean" },
    intent: { control: "select", options: ["passive", "explicit"] },
    announceInterval: { control: { type: "number", min: 1, step: 1 } },
    announceStart: { control: "text" },
    announceEnd: { control: "text" },
    announceLong: { control: "text" },
    announceLongWithValue: { control: "text" },
    id: { control: "text" },
    Class: { control: "text" },
  },
} satisfies Meta<typeof ProgressIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DeterminateLinear: Story = {
  name: "線形の確定進捗",
  args: { shape: "linear", value: 40, label: "資料を送信中" },
};

export const InlinedStatic: Story = {
  name: "小さな静的表示・件数による進捗",
  args: {
    shape: "static",
    type: "inlined",
    size: "sm",
    min: 0,
    max: 5,
    value: 3,
    label: "ファイルを確認中",
    valueText: "5件中3件確認しました",
    showPercentage: false,
  },
};

export const UnderlayExplicit: Story = {
  name: "背景パネル・開始／停止の読み上げ通知",
  args: {
    type: "stacked-underlay",
    intent: "explicit",
    label: "資料を作成中",
    announceInterval: 10,
    announceStart: "資料の作成を開始しました",
    announceEnd: "資料の作成が完了しました",
    announceLong: "資料を作成中です",
  },
};
