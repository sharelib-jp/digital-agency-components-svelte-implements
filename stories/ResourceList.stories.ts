import type { Meta, StoryObj } from "./types";
import ResourceList, {
  type ResourceListItem,
} from "../src/lib/components/ResourceList.svelte";
import documentation from "../docs/ResourceList.md?raw";
import { docsParameters } from "./docs";
import ResourceListExample from "./examples/ResourceListExample.svelte";

const items: ResourceListItem[] = [
  {
    id: "resource-list-design-guide",
    type: "link",
    title: "デジタル庁デザインシステム（新規タブ）",
    href: "https://design.digital.go.jp/",
    target: "_blank",
    label: "公開資料",
    supportText: "デザインの基本方針とコンポーネントの使い方を確認できます。",
    subLabel: "利用ガイド",
    icon: true,
    action: { label: "利用ガイドの操作", icon: "menu" },
  },
  {
    id: "resource-list-update-notice",
    type: "plain",
    title: "資料の更新予定",
    supportText: "資料の更新予定は、各資料の案内ページでお知らせします。",
    subLabel: "お知らせ",
  },
];

const meta = {
  id: "components-resource-list",
  title: "Components/リソースリスト（ResourceList）",
  component: ResourceList,
  parameters: docsParameters(documentation),
  render: (args) => ({ Component: ResourceListExample, props: { args } }),
  args: {
    items,
    style: "list",
    interaction: "inline",
    headingLevel: "h2",
    gap: 16,
    square: false,
    Class: "",
  },
  argTypes: {
    items: { control: "object" },
    style: { control: "select", options: ["list", "frame"] },
    interaction: { control: "select", options: ["inline", "whole"] },
    headingLevel: {
      control: "select",
      options: ["h2", "h3", "h4", "h5", "h6"],
    },
    gap: { control: { type: "number", min: 0, step: 4 } },
    square: { control: "boolean" },
    Class: { control: "text" },
  },
} satisfies Meta<typeof ResourceList, typeof ResourceListExample>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FramedWholeLinks: Story = {
  name: "枠付き・本文全体がリンク",
  args: { style: "frame", interaction: "whole", square: true },
};

export const Checkboxes: Story = {
  name: "複数資料の選択・無効な項目",
  args: {
    style: "frame",
    interaction: "whole",
    items: [
      {
        id: "storybook-resource-checkbox-guide",
        type: "checkbox",
        title: "利用ガイド",
        name: "storybook-resource-documents",
        value: "guide",
        checked: true,
        supportText: "基本的な使い方を収録しています。",
      },
      {
        id: "storybook-resource-checkbox-faq",
        type: "checkbox",
        title: "よくある質問",
        name: "storybook-resource-documents",
        value: "faq",
        checked: false,
      },
      {
        id: "storybook-resource-checkbox-archive",
        type: "checkbox",
        title: "過去の資料（準備中）",
        name: "storybook-resource-documents",
        value: "archive",
        disabled: true,
      },
    ],
  },
};

export const RadioButtons: Story = {
  name: "同じnameの単一選択",
  args: {
    style: "frame",
    interaction: "whole",
    items: [
      {
        id: "storybook-resource-radio-online",
        type: "radio",
        title: "オンラインで受け取る",
        name: "storybook-resource-delivery-method",
        value: "online",
        checked: true,
        supportText: "申請完了後に案内を確認できます。",
      },
      {
        id: "storybook-resource-radio-office",
        type: "radio",
        title: "窓口で受け取る",
        name: "storybook-resource-delivery-method",
        value: "office",
        checked: false,
        supportText: "開庁時間内に窓口へお越しください。",
      },
      {
        id: "storybook-resource-radio-post",
        type: "radio",
        title: "郵送で受け取る（準備中）",
        name: "storybook-resource-delivery-method",
        value: "post",
        disabled: true,
      },
    ],
  },
};
