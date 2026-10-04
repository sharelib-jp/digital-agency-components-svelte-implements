import type { Meta, StoryObj } from "./types";
import HorizontalMenu, {
  type HorizontalMenuItem,
} from "../src/lib/components/HorizontalMenu.svelte";
import documentation from "../docs/HorizontalMenu.md?raw";
import { docsParameters } from "./docs";
import HorizontalMenuExample from "./examples/HorizontalMenuExample.svelte";

const items: HorizontalMenuItem[] = [
  {
    id: "horizontal-menu-home",
    label: "ホーム",
    href: "#horizontal-menu-home",
  },
  {
    id: "horizontal-menu-procedures",
    label: "手続き",
    children: [
      {
        id: "horizontal-menu-apply",
        label: "オンライン申請",
        href: "#horizontal-menu-apply",
      },
      {
        id: "horizontal-menu-documents",
        label: "必要な書類",
        href: "#horizontal-menu-documents",
      },
      {
        id: "horizontal-menu-archive",
        label: "過去の申請（準備中）",
        disabled: true,
      },
    ],
  },
  {
    id: "horizontal-menu-contact",
    label: "お問い合わせ",
    href: "#horizontal-menu-contact",
  },
];

const meta = {
  id: "components-horizontal-menu",
  title: "Components/横並びメニュー（HorizontalMenu）",
  component: HorizontalMenu,
  parameters: docsParameters(documentation),
  render: (args) => ({ Component: HorizontalMenuExample, props: { args } }),
  args: {
    items,
    label: "主要ページの表示例",
    selectedId: "horizontal-menu-home",
    expandedId: null,
    disabled: false,
  },
  argTypes: {
    items: { control: "object" },
    label: { control: "text" },
    selectedId: { control: "text" },
    expandedId: { control: "text" },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof HorizontalMenu, typeof HorizontalMenuExample>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ExpandedSubmenu: Story = {
  name: "子ページの現在地・サブメニュー展開",
  args: {
    selectedId: "horizontal-menu-documents",
    expandedId: "horizontal-menu-procedures",
  },
};

export const ActionItems: Story = {
  name: "操作ボタンと装飾アイコン",
  args: {
    label: "資料の操作",
    selectedId: "horizontal-menu-dashboard",
    items: [
      {
        id: "horizontal-menu-dashboard",
        label: "ダッシュボード",
        iconPath: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
      },
      {
        id: "horizontal-menu-tools",
        label: "操作",
        children: [
          { id: "horizontal-menu-edit", label: "編集" },
          { id: "horizontal-menu-duplicate", label: "複製" },
          {
            id: "horizontal-menu-report",
            label: "集計（準備中）",
            disabled: true,
          },
        ],
      },
    ],
  },
};

export const Disabled: Story = {
  name: "メニュー全体を無効化",
  args: { disabled: true },
};
