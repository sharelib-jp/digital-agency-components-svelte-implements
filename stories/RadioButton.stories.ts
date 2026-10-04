import type { Meta, StoryObj } from "./types";
import RadioButton from "../src/lib/components/RadioButton.svelte";
import documentation from "../docs/RadioButton.md?raw";
import { docsParameters } from "./docs";
import RadioButtonExample from "./examples/RadioButtonExample.svelte";

const meta = {
  id: "components-radio-button",
  title: "Components/ラジオボタン（RadioButton）",
  component: RadioButton,
  parameters: docsParameters(documentation),
  render: (args) => ({ Component: RadioButtonExample, props: { args } }),
  args: {
    id: "storybook-radio-button-email",
    name: "contactMethod",
    value: "email",
    group: "email",
    label: "メール",
    size: "sm",
    disabled: false,
    required: false,
    errored: false,
    supportText: "連絡方法を1つ選択してください。",
    errorText: null,
    Class: "",
  },
  argTypes: {
    id: { control: "text" },
    name: { control: "text" },
    value: {
      control: "text",
      description: "最初の選択肢の値。groupと厳密等価で比較します。",
    },
    group: {
      control: {
        type: "select",
        labels: { email: "メール", phone: "電話", null: "未選択" },
      },
      options: ["email", "phone", null],
      description: "2つのラジオで同じnameと親のbind:groupを共有しています。",
    },
    label: { control: "text" },
    size: { control: "select", options: ["sm", "md", "lg"] },
    disabled: { control: "boolean" },
    required: { control: "boolean" },
    errored: { control: "boolean" },
    supportText: { control: "text" },
    errorText: { control: "text" },
    Class: { control: "text" },
  },
} satisfies Meta<typeof RadioButton, typeof RadioButtonExample>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Unselected: Story = {
  args: {
    id: "storybook-radio-button-unselected",
    name: "unselectedContactMethod",
    group: null,
  },
};

export const Large: Story = {
  args: {
    id: "storybook-radio-button-large",
    name: "largeContactMethod",
    size: "lg",
  },
};

export const Disabled: Story = {
  args: {
    id: "storybook-radio-button-disabled",
    name: "fixedContactMethod",
    disabled: true,
    supportText: "連絡方法は確定済みのため変更できません。",
  },
};

export const Error: Story = {
  args: {
    id: "storybook-radio-button-error",
    name: "requiredContactMethod",
    group: null,
    size: "md",
    required: true,
    errored: true,
    errorText: "連絡方法を選択してください。",
  },
};
