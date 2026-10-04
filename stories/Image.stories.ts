import type { Meta, StoryObj } from "./types";
import Image, { type ImageSource } from "../src/lib/components/Image.svelte";
import documentation from "../docs/Image.md?raw";
import { docsParameters } from "./docs";
import { sampleImageCompactSrc, sampleImageSrc } from "./sample-image";

const meta = {
  id: "components-image",
  title: "Components/画像（Image）",
  component: Image,
  parameters: docsParameters(documentation),
  args: {
    src: sampleImageSrc,
    alt: "正面入口と左右の木がある白い庁舎のイラスト",
    width: 640,
    height: 360,
    sources: [] as ImageSource[],
    type: "border",
    fullWidth: false,
    caption: "庁舎のイメージ。Storybook内で完結するSVGの表示例です。",
    captionStyle: "dashed",
    loading: "eager",
    decoding: "auto",
    href: "https://design.digital.go.jp/",
    target: "_self",
    Class: "",
  },
  argTypes: {
    src: { control: "text" },
    alt: { control: "text" },
    srcset: { control: "text" },
    sizes: { control: "text" },
    width: { control: { type: "number", min: 1 } },
    height: { control: { type: "number", min: 1 } },
    sources: { control: "object" },
    type: { control: "select", options: ["border", "borderless", "link"] },
    fullWidth: { control: "boolean" },
    caption: { control: "text" },
    captionStyle: { control: "select", options: ["dashed", "solid"] },
    loading: { control: "select", options: ["eager", "lazy"] },
    decoding: { control: "select", options: ["auto", "async", "sync"] },
    href: { control: "text" },
    target: {
      control: "select",
      options: ["_self", "_blank", "_parent", "_top"],
    },
    rel: { control: "text" },
    Class: { control: "text" },
  },
} satisfies Meta<typeof Image>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Borderless: Story = {
  name: "枠なし・キャプションなし",
  args: { type: "borderless", caption: null },
};

export const FullWidth: Story = {
  name: "親領域の全幅・実線キャプション",
  args: { fullWidth: true, captionStyle: "solid" },
};

export const Linked: Story = {
  name: "新規タブで開く画像リンク",
  args: {
    type: "link",
    target: "_blank",
    alt: "デジタル庁デザインシステムを開く（新規タブ）",
    caption: "画像を選ぶとデジタル庁デザインシステムを新規タブで開きます。",
    captionStyle: "solid",
  },
};

export const Responsive: Story = {
  name: "pictureによる画像の切り替え",
  args: {
    fullWidth: true,
    sources: [
      {
        srcset: sampleImageCompactSrc,
        media: "(max-width: 36rem)",
        type: "image/svg+xml",
        width: 320,
        height: 360,
      },
      {
        srcset: sampleImageSrc,
        type: "image/svg+xml",
        width: 640,
        height: 360,
      },
    ],
    alt: "白い庁舎と正面入口のイラスト",
    caption: "36rem以下の画面では庁舎中央を切り出した画像を表示します。",
    decoding: "async",
  },
};
