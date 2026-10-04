import type { Meta, StoryObj } from "./types";
import Card from "../src/lib/components/Card.svelte";
import documentation from "../docs/Card.md?raw";
import { docsParameters } from "./docs";
import CardChildrenExample from "./examples/CardChildrenExample.svelte";
import CardSnippetExample from "./examples/CardSnippetExample.svelte";

const meta = {
  id: "components-card",
  title: "Components/カード（Card）",
  component: Card,
  parameters: docsParameters(documentation),
  args: {
    title: "お知らせ",
    content: "オンライン申請を受け付けています。\n必要な書類をご確認ください。",
    headingLevel: "h2",
    Class: "",
  },
  argTypes: {
    title: { control: "text" },
    content: { control: "text" },
    children: { control: false },
    headingLevel: {
      control: "select",
      options: ["h1", "h2", "h3", "h4", "h5", "h6"],
    },
    Class: { control: "text" },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<
  typeof meta,
  typeof Card | typeof CardChildrenExample | typeof CardSnippetExample
>;

export const Default: Story = {};

export const WithoutTitle: Story = {
  name: "見出しなし",
  args: { title: "" },
};

export const Children: Story = {
  name: "props なし・子要素を表示",
  render: () => ({ Component: CardChildrenExample }),
  parameters: {
    controls: { disable: true },
    docs: { source: { code: "<Card>hoge</Card>", language: "svelte" } },
  },
};

export const Snippet: Story = {
  name: "snippet でリッチな中身を渡す",
  args: { title: "申請の準備" },
  render: (args) => ({ Component: CardSnippetExample, props: { args } }),
  argTypes: { content: { control: false } },
};

export const TitleOnly: Story = {
  name: "見出しのみ",
  args: { content: "" },
};
