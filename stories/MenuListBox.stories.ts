import type { Meta, StoryObj } from "./types";
import MenuListBox, {
  type MenuListBoxItem,
} from "../src/lib/components/MenuListBox.svelte";
import documentation from "../docs/MenuListBox.md?raw";
import { docsParameters } from "./docs";
import MenuListBoxExample from "./examples/MenuListBoxExample.svelte";

const items: MenuListBoxItem[] = [
  { id: "menu-list-box-edit", label: "編集" },
  { id: "menu-list-box-duplicate", label: "複製" },
  {
    id: "menu-list-box-guide",
    label: "デジタル庁デザインシステム",
    href: "https://design.digital.go.jp/",
    target: "_blank",
  },
  {
    id: "menu-list-box-archive",
    label: "アーカイブ（準備中）",
    disabled: true,
  },
];

const meta = {
  id: "components-menu-list-box",
  title: "Components/メニューリストボックス（MenuListBox）",
  component: MenuListBox,
  parameters: docsParameters(documentation),
  render: (args) => ({ Component: MenuListBoxExample, props: { args } }),
  args: {
    id: "storybook-menu-list-box-default",
    items,
    label: "資料の操作",
    open: false,
    selectedId: null,
    disabled: false,
    size: "sm",
    Style: "text",
    fontWeight: "normal",
    iconViewBox: "0 0 24 24",
    Class: "",
  },
  argTypes: {
    id: {
      control: "text",
      description: "ARIAの関連付けに使う、必須の一意・非空ID。",
    },
    items: { control: "object" },
    label: { control: "text" },
    open: { control: "boolean" },
    selectedId: { control: "text" },
    disabled: { control: "boolean" },
    size: { control: "select", options: ["sm", "md"] },
    Style: {
      control: "select",
      options: ["text", "outlined", "filled"],
      description: "開閉ボタンの外観。大文字のSで指定します。",
    },
    fontWeight: { control: "select", options: ["normal", "bold"] },
    iconPath: { control: "text" },
    iconViewBox: { control: "text" },
    Class: { control: "text" },
  },
} satisfies Meta<typeof MenuListBox, typeof MenuListBoxExample>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Opened: Story = {
  name: "展開済み・アウトライン",
  args: {
    id: "storybook-menu-list-box-opened",
    open: true,
    selectedId: "menu-list-box-edit",
    size: "md",
    Style: "outlined",
  },
};

export const FilledWithIcon: Story = {
  name: "塗りつぶし・太字・アイコン付き",
  args: {
    id: "storybook-menu-list-box-filled",
    size: "md",
    Style: "filled",
    fontWeight: "bold",
    iconPath: "M6 3h8l4 4v14H6z",
  },
};

export const Disabled: Story = {
  name: "操作を無効化",
  args: {
    id: "storybook-menu-list-box-disabled",
    disabled: true,
    Style: "outlined",
  },
};
