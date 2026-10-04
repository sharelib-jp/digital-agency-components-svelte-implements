import type { Meta, StoryObj } from "./types";
import StepNavigation, {
  type StepNavigationStep,
} from "../src/lib/components/StepNavigation.svelte";
import documentation from "../docs/StepNavigation.md?raw";
import { docsParameters } from "./docs";
import StepNavigationExample from "./examples/StepNavigationExample.svelte";

const steps: StepNavigationStep[] = [
  {
    id: "step-navigation-input",
    label: "入力",
    description: "申請者の情報を入力します",
    status: "completed",
  },
  {
    id: "step-navigation-confirm",
    label: "確認",
    description: "入力内容を確認します",
    status: "editing",
  },
  {
    id: "step-navigation-finish",
    label: "完了",
    description: "申請を受け付けます",
  },
];

const meta = {
  id: "components-step-navigation",
  title: "Components/ステップナビゲーション（StepNavigation）",
  component: StepNavigation,
  parameters: docsParameters(documentation),
  args: {
    steps,
    variant: "full",
    orientation: "horizontal",
    size: "normal",
    currentId: "step-navigation-confirm",
    disabled: false,
    label: "申請の手順",
    stepLabel: "ステップ",
    numberOnly: false,
    stepWidth: 240,
    stepMinWidth: 160,
    Class: "",
  },
  argTypes: {
    steps: { control: "object" },
    variant: { control: "select", options: ["full", "single"] },
    orientation: { control: "select", options: ["horizontal", "vertical"] },
    size: { control: "select", options: ["normal", "small"] },
    currentId: { control: "text" },
    disabled: { control: "boolean" },
    label: { control: "text" },
    stepLabel: { control: "text" },
    summary: { control: "text" },
    numberOnly: { control: "boolean" },
    stepWidth: { control: { type: "number", min: 0, step: 16 } },
    stepMinWidth: { control: { type: "number", min: 0, step: 16 } },
    id: { control: "text" },
    Class: { control: "text" },
  },
} satisfies Meta<typeof StepNavigation>;

export default meta;
type Story = StoryObj<
  typeof meta,
  typeof StepNavigation | typeof StepNavigationExample
>;

export const Default: Story = {};

export const VerticalWithStates: Story = {
  name: "縦方向・6種類の状態",
  args: {
    orientation: "vertical",
    currentId: "step-navigation-state-editing",
    summary: "ステップの6種類の状態を比較する表示例です。",
    steps: [
      {
        id: "step-navigation-state-completed",
        label: "本人確認",
        status: "completed",
      },
      {
        id: "step-navigation-state-reached",
        label: "申請者情報",
        status: "reached",
      },
      {
        id: "step-navigation-state-editing",
        label: "申請内容",
        status: "editing",
      },
      {
        id: "step-navigation-state-error",
        label: "添付書類",
        status: "error",
        description: "必要な書類を添付してください",
      },
      {
        id: "step-navigation-state-skipped",
        label: "任意の補足",
        status: "skipped",
      },
      { id: "step-navigation-state-default", label: "送信", status: "default" },
    ],
  },
};

export const NumberOnly: Story = {
  name: "番号のみ・小サイズ",
  args: { numberOnly: true, size: "small", stepWidth: 96, stepMinWidth: 80 },
};

export const SingleError: Story = {
  name: "現在のステップだけを表示・エラー",
  args: {
    variant: "single",
    orientation: "vertical",
    size: "small",
    summary: "全3ステップ中、確認画面の住所にエラーがあります。",
    steps: [
      { id: "step-navigation-input", label: "入力", status: "completed" },
      {
        id: "step-navigation-confirm",
        label: "確認",
        description: "住所を修正してください",
        status: "error",
      },
      { id: "step-navigation-finish", label: "完了" },
    ],
  },
};

export const ButtonSteps: Story = {
  name: "ボタン操作・現在位置のbind",
  render: (args) => ({ Component: StepNavigationExample, props: { args } }),
  args: {
    currentId: "step-navigation-input",
    steps: [
      { id: "step-navigation-input", label: "入力", action: true },
      { id: "step-navigation-confirm", label: "確認", action: true },
      {
        id: "step-navigation-finish",
        label: "完了（準備中）",
        action: true,
        disabled: true,
      },
    ],
  },
};
