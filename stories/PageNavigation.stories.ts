import type { Meta, StoryObj } from "./types";
import PageNavigation from "../src/lib/components/PageNavigation.svelte";
import documentation from "../docs/PageNavigation.md?raw";
import { docsParameters } from "./docs";
import PageNavigationExample from "./examples/PageNavigationExample.svelte";

const meta = {
  id: "components-page-navigation",
  title: "Components/ページナビゲーション（PageNavigation）",
  component: PageNavigation,
  parameters: docsParameters(documentation),
  render: (args) => ({ Component: PageNavigationExample, props: { args } }),
  args: {
    type: "text",
    size: "md",
    currentPage: 2,
    totalPages: 8,
    disabled: false,
    label: "資料一覧のページ",
    previousLabel: "前のページ",
    nextLabel: "次のページ",
  },
  argTypes: {
    type: { control: "select", options: ["text", "outline", "arrow"] },
    size: { control: "select", options: ["lg", "md", "sm", "xs"] },
    currentPage: { control: { type: "number", min: 1, step: 1 } },
    totalPages: { control: { type: "number", min: 0, step: 1 } },
    disabled: { control: "boolean" },
    label: { control: "text" },
    previousLabel: { control: "text" },
    nextLabel: { control: "text" },
    hrefForPage: {
      control: false,
      description:
        "ページ番号からURLを返す関数。Links storyでハッシュリンクを示します。",
    },
  },
} satisfies Meta<typeof PageNavigation, typeof PageNavigationExample>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const OutlineFirstPage: Story = {
  name: "先頭ページ・枠付き",
  args: { type: "outline", size: "lg", currentPage: 1 },
};

export const ArrowLastPage: Story = {
  name: "末尾ページ・矢印型",
  args: { type: "arrow", size: "lg", currentPage: 8 },
};

export const Disabled: Story = {
  name: "ページ操作を無効化",
  args: { type: "outline", disabled: true },
};

export const Links: Story = {
  name: "ハッシュリンク方式",
  args: {
    type: "outline",
    hrefForPage: (page: number) => `#page-navigation-page-${page}`,
  },
};
