import type { Meta, StoryObj } from "./types";
import Heading from "../src/lib/components/Heading.svelte";
import documentation from "../docs/Heading.md?raw";
import { docsParameters } from "./docs";

const meta = {
  id: "components-heading",
  title: "Components/見出し（Heading）",
  component: Heading,
  parameters: docsParameters(documentation),
  args: {
    level: "h2",
    size: "36",
    text: "申請手続き",
    shoulder: null,
    chip: false,
    icon: false,
    rule: undefined,
    Class: "",
  },
  argTypes: {
    level: {
      control: "select",
      options: ["h1", "h2", "h3", "h4", "h5", "h6"],
      description: "文書の見出し階層。表示サイズとは独立しています。",
    },
    size: {
      control: "select",
      options: ["64", "57", "45", "36", "32", "28", "24", "20", "18", "16"],
    },
    text: { control: "text" },
    shoulder: { control: "text" },
    chip: { control: "boolean" },
    icon: { control: "boolean" },
    rule: {
      control: "select",
      options: ["none", "2", "4", "6", "8"],
      mapping: { none: undefined },
    },
    id: { control: "text" },
    Class: { control: "text" },
  },
} satisfies Meta<typeof Heading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const PageTitle: Story = {
  name: "ページの見出し",
  args: { level: "h1", size: "45", text: "オンライン申請ガイド" },
};

export const WithShoulder: Story = {
  name: "ショルダー付き",
  args: {
    size: "32",
    text: "必要な書類",
    shoulder: "オンラインで手続きをする方へ",
  },
};

export const WithDecorations: Story = {
  name: "チップ・アイコン・下線付き",
  args: {
    size: "28",
    text: "申請前の確認事項",
    chip: true,
    icon: true,
    rule: "4",
  },
};
