import type { Meta, StoryObj } from "./types";
import InputText from "../src/lib/components/InputText.svelte";
import documentation from "../docs/InputText.md?raw";
import { docsParameters } from "./docs";

const meta = {
  id: "components-input-text",
  title: "Components/インプットテキスト（InputText）",
  component: InputText,
  parameters: docsParameters(documentation),
  args: {
    id: "storybook-input-text-display-name",
    label: "表示名",
    size: "md",
    fullWidth: false,
    type: "text",
    value: "デジタル 太郎",
    supportText: "サービス内に表示する名前を入力してください。",
    errorText: null,
    required: false,
    readonly: false,
    disabled: false,
  },
  argTypes: {
    id: { control: "text" },
    label: { control: "text" },
    size: { control: "select", options: ["sm", "md", "lg"] },
    fullWidth: {
      control: "boolean",
      description:
        "入力欄と外側のラベル領域を親要素の幅いっぱい（100%）に表示します。",
    },
    type: {
      control: "select",
      options: ["text", "password"],
      description: "内部inputの種類。passwordでは入力内容をマスクします。",
    },
    value: { control: "text" },
    supportText: {
      control: "text",
      description: "補助文の表示には空でないlabelが必要です。",
    },
    errorText: { control: "text" },
    required: { control: "boolean" },
    readonly: { control: "boolean" },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof InputText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Large: Story = {
  args: { id: "storybook-input-text-large", size: "lg" },
};

/** 入力欄だけでなく、ラベル・補助文を含む外側の領域も親要素の幅に合わせます。 */
export const FullWidth: Story = {
  args: { id: "storybook-input-text-full-width", fullWidth: true },
};

/** マスク表示の動作確認用です。初期値は空にし、実際のパスワードは使用しません。 */
export const Password: Story = {
  args: {
    id: "storybook-input-text-password",
    label: "パスワード",
    type: "password",
    value: "",
    supportText: "動作確認用です。実際のパスワードは入力しないでください。",
  },
};

export const Readonly: Story = {
  args: {
    id: "storybook-input-text-readonly",
    label: "確認済みの表示名",
    readonly: true,
    supportText: "確認済みのため編集できません。",
  },
};

export const Disabled: Story = {
  args: {
    id: "storybook-input-text-disabled",
    disabled: true,
    supportText: "この項目は現在利用できません。",
  },
};

export const Error: Story = {
  args: {
    id: "storybook-input-text-error",
    value: "",
    required: true,
    errorText: "表示名を入力してください。",
  },
};
