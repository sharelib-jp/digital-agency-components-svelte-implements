import type { Meta, StoryObj } from "./types";
import DatePicker from "../src/lib/components/DatePicker.svelte";
import documentation from "../docs/DatePicker.md?raw";
import { docsParameters } from "./docs";

const meta = {
  id: "components-date-picker",
  title: "Components/日付ピッカー（DatePicker）",
  component: DatePicker,
  parameters: docsParameters(documentation),
  args: {
    id: "storybook-date-picker-visit",
    name: "visitDate",
    type: "consolidated",
    size: "md",
    value: "2026-10-15",
    open: false,
    calendar: true,
    minDate: "2026-01-01",
    maxDate: "2026-12-31",
    label: "訪問希望日",
    required: false,
    readonly: false,
    disabled: false,
    supportText:
      "2026年の希望日を西暦で入力するか、カレンダーから選択してください。",
    errorText: null,
    Class: "",
  },
  argTypes: {
    id: { control: "text" },
    name: { control: "text" },
    form: {
      control: "text",
      description:
        "関連付ける外部フォームがある場合、その実在するIDを指定します。",
    },
    type: { control: "select", options: ["consolidated", "separated"] },
    size: { control: "select", options: ["sm", "md", "lg"] },
    value: {
      control: "text",
      description: "YYYY-MM-DDまたは空文字列。Dateオブジェクトではありません。",
    },
    open: { control: "boolean" },
    calendar: { control: "boolean" },
    minDate: { control: "text" },
    maxDate: { control: "text" },
    label: { control: "text" },
    required: { control: "boolean" },
    readonly: { control: "boolean" },
    disabled: { control: "boolean" },
    supportText: { control: "text" },
    errorText: {
      control: "text",
      description:
        "表示・ARIA用の外部エラー。これ自体はnative validityを変更しません。",
    },
    Class: { control: "text" },
  },
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Separated: Story = {
  args: {
    id: "storybook-date-picker-separated",
    name: "separatedVisitDate",
    type: "separated",
    size: "lg",
    required: true,
  },
};

export const Readonly: Story = {
  args: {
    id: "storybook-date-picker-confirmed",
    name: "confirmedDate",
    label: "確定した訪問日",
    readonly: true,
    supportText: "確定済みのため編集できません。",
  },
};

export const Disabled: Story = {
  args: {
    id: "storybook-date-picker-disabled",
    name: "unavailableDate",
    disabled: true,
    supportText: "現在、訪問日の変更は受け付けていません。",
  },
};

export const Error: Story = {
  args: {
    id: "storybook-date-picker-error",
    name: "invalidVisitDate",
    value: "2026-02-30",
    required: true,
    errorText: "存在する日付を指定してください。",
  },
};
