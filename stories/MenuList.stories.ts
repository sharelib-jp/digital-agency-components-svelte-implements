import type { Meta, StoryObj } from "./types";
import MenuList, {
  type MenuListItem,
} from "../src/lib/components/MenuList.svelte";
import documentation from "../docs/MenuList.md?raw";
import { docsParameters } from "./docs";

const items: MenuListItem[] = [
  { id: "menu-list-overview", label: "概要", href: "#menu-list-overview" },
  { id: "menu-list-documents", label: "資料", href: "#menu-list-documents" },
  { id: "menu-list-refresh", label: "一覧を更新する" },
  { id: "menu-list-archive", label: "過去の資料（準備中）", disabled: true },
];

const meta = {
  id: "components-menu-list",
  title: "Components/メニューリスト（MenuList）",
  component: MenuList,
  parameters: docsParameters(documentation),
  args: {
    items,
    label: "関連ページと操作",
    type: "standard",
    size: "regular",
    selectedId: "menu-list-overview",
    disabled: false,
    indentation: 0,
    role: "list",
    activeId: null,
    Class: "",
  },
  argTypes: {
    id: { control: "text" },
    items: { control: "object" },
    label: { control: "text" },
    type: { control: "select", options: ["standard", "box"] },
    size: { control: "select", options: ["regular", "small"] },
    selectedId: { control: "text" },
    disabled: { control: "boolean" },
    indentation: { control: { type: "number", min: 0, step: 1 } },
    role: {
      control: "select",
      options: ["list", "menu"],
      description:
        "menuは平坦な項目用。矢印キー制御はMenuListBox側で行います。",
    },
    activeId: { control: "text" },
    Class: { control: "text" },
  },
} satisfies Meta<typeof MenuList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CompactBox: Story = {
  name: "矩形・小サイズ",
  args: { type: "box", size: "small" },
};

export const NestedWithIcons: Story = {
  name: "常時表示の子項目・新規タブリンク",
  args: {
    selectedId: "menu-list-notices",
    items: [
      {
        id: "menu-list-information",
        label: "情報",
        iconPath: "M4 3h16v18H4z",
        children: [
          {
            id: "menu-list-notices",
            label: "お知らせ",
            href: "#menu-list-notices",
          },
          {
            id: "menu-list-guide",
            label: "デジタル庁デザインシステム",
            href: "https://design.digital.go.jp/",
            target: "_blank",
            iconPath: "M6 3h8l4 4v14H6z",
          },
          {
            id: "menu-list-child-archive",
            label: "過去の資料（準備中）",
            disabled: true,
          },
        ],
      },
    ],
  },
};

export const Disabled: Story = {
  name: "全項目を無効化",
  args: { disabled: true },
};
