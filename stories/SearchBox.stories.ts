import type { Meta, StoryObj } from "./types";
import SearchBox from "../src/lib/components/SearchBox.svelte";
import documentation from "../docs/SearchBox.md?raw";
import { docsParameters } from "./docs";
import SearchBoxExample from "./examples/SearchBoxExample.svelte";

const scopeOptions = [
  { value: "all", label: "すべて" },
  { value: "documents", label: "資料" },
  { value: "archived", label: "過去の情報（利用不可）", disabled: true },
];

const meta = {
  id: "components-search-box",
  title: "Components/検索ボックス（SearchBox）",
  component: SearchBox,
  parameters: docsParameters(documentation),
  args: {
    id: "storybook-search-box-site",
    size: "lg",
    value: "オンライン申請",
    name: "query",
    label: "検索語",
    formLabel: "サイト内検索",
    placeholder: "キーワードを入力",
    autocomplete: "off",
    required: false,
    readonly: false,
    disabled: false,
    method: "get",
    preventDefault: true,
    buttonLabel: "検索",
    scopeOptions: [],
    scope: "",
    scopeName: "category",
    scopeLabel: "検索対象",
    detailLabel: "詳細検索",
    detailOpen: false,
    resetLabel: "検索条件をクリア",
  },
  argTypes: {
    id: { control: "text" },
    size: { control: "select", options: ["sm", "md", "lg"] },
    value: { control: "text" },
    name: { control: "text" },
    label: { control: "text" },
    formLabel: { control: "text" },
    ariaLabelledby: {
      control: "text",
      description: "外部ラベルがある場合、その実在するIDを指定します。",
    },
    placeholder: { control: "text" },
    autocomplete: { control: "select", options: ["off", "on"] },
    required: { control: "boolean" },
    readonly: { control: "boolean" },
    disabled: { control: "boolean" },
    action: { control: "text" },
    method: { control: "select", options: ["get", "post"] },
    preventDefault: {
      control: "boolean",
      description:
        "初期値はtrueでネイティブ送信を止めます。falseにするとブラウザーがフォーム送信・ページ遷移します。",
    },
    buttonLabel: { control: "text" },
    scopeOptions: { control: "object" },
    scope: { control: "text" },
    scopeName: { control: "text" },
    scopeLabel: { control: "text" },
    detailLabel: { control: "text" },
    detailOpen: {
      control: "boolean",
      description: "detailスロットのあるAdvanced storyで確認できます。",
    },
    resetLabel: { control: "text" },
  },
} satisfies Meta<typeof SearchBox>;

export default meta;
type Story = StoryObj<typeof meta, typeof SearchBox | typeof SearchBoxExample>;

export const Default: Story = {};

export const WithScope: Story = {
  args: {
    id: "storybook-search-box-scope",
    size: "md",
    formLabel: "資料検索",
    scopeOptions,
    scope: "documents",
  },
};

export const Advanced: Story = {
  args: {
    id: "storybook-search-box-advanced",
    formLabel: "詳細条件付き資料検索",
    scopeOptions,
    scope: "all",
    detailOpen: true,
  },
  render: (args) => ({ Component: SearchBoxExample, props: { args } }),
};

export const Small: Story = {
  args: {
    id: "storybook-search-box-small",
    size: "sm",
    scopeOptions,
    scope: "all",
  },
};

export const Disabled: Story = {
  args: {
    id: "storybook-search-box-disabled",
    disabled: true,
    scopeOptions,
    scope: "all",
  },
};
