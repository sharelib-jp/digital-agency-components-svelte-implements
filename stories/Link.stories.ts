import type { Meta, StoryObj } from "./types";
import Link from "../src/lib/components/Link.svelte";
import documentation from "../docs/Link.md?raw";
import { docsParameters } from "./docs";
import LinkExample from "./examples/LinkExample.svelte";

const meta = {
  id: "components-link",
  title: "Components/リンク（Link）",
  component: Link,
  parameters: docsParameters(documentation),
  args: {
    href: "https://www.digital.go.jp/",
    label: "デジタル庁のウェブサイト",
    blank: false,
  },
  argTypes: {
    href: { control: "text" },
    label: { control: "text" },
    blank: {
      control: "boolean",
      description:
        "新規タブで開くアイコンを表示します。relは自動設定されません。",
    },
  },
} satisfies Meta<typeof Link>;

export default meta;
type Story = StoryObj<typeof meta, typeof Link | typeof LinkExample>;

export const Default: Story = {};

export const NewTab: Story = {
  args: { blank: true },
};

export const InPage: Story = {
  args: {
    href: "#storybook-link-contact",
    label: "お問い合わせへ移動する",
  },
  render: (args) => ({ Component: LinkExample, props: { args } }),
};
