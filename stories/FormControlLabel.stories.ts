import type { Meta, StoryObj } from "./types";
import FormControlLabel from "../src/lib/components/FormControlLabel.svelte";
import documentation from "../docs/FormControlLabel.md?raw";
import { docsParameters } from "./docs";
import FormControlLabelExample from "./examples/FormControlLabelExample.svelte";

const meta = {
  id: "components-form-control-label",
  title: "Components/フォームコントロールラベル（FormControlLabel）",
  component: FormControlLabel,
  parameters: docsParameters(documentation),
  render: (args) => ({ Component: FormControlLabelExample, props: { args } }),
  args: {
    For: "storybook-form-control-label-name",
    label: "氏名",
    required: false,
    supportText: null,
    supportTextId: "storybook-form-control-label-name-support",
  },
  argTypes: {
    For: {
      control: "text",
      description: "大文字のF。デモのinputのidにも同じ値を設定します。",
    },
    label: { control: "text" },
    required: {
      control: "boolean",
      description:
        "コンポーネントは表示のみ。デモでは入力にもrequiredを設定します。",
    },
    supportText: { control: "text" },
    supportTextId: {
      control: "text",
      description: "デモの入力のaria-describedbyにも関連付けます。",
    },
  },
} satisfies Meta<typeof FormControlLabel, typeof FormControlLabelExample>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Required: Story = {
  args: {
    For: "storybook-form-control-label-required-name",
    required: true,
    supportTextId: "storybook-form-control-label-required-name-support",
  },
};

export const WithSupportText: Story = {
  args: {
    For: "storybook-form-control-label-nickname",
    label: "ニックネーム",
    supportText: "本名以外の名前を指定できます。",
    supportTextId: "storybook-form-control-label-nickname-support",
  },
};
