import type { Meta, StoryObj } from "./types";
import EmergencyBanner from "../src/lib/components/EmergencyBanner.svelte";
import documentation from "../docs/EmergencyBanner.md?raw";
import { docsParameters } from "./docs";

const meta = {
  id: "components-emergency-banner",
  title: "Components/緊急時バナー（EmergencyBanner）",
  component: EmergencyBanner,
  parameters: docsParameters(documentation),
  args: {
    heading: "オンライン申請の緊急メンテナンス（表示例）",
    message:
      "現在、オンライン申請を利用できません。期限が近い申請については、担当窓口へご相談ください。",
    timestamp: "2026年10月3日 午前9時 更新",
    datetime: "2026-10-03T09:00:00+09:00",
    href: "https://design.digital.go.jp/",
    linkLabel: "デジタル庁デザインシステムを確認する",
    target: "_self",
    Class: "",
  },
  argTypes: {
    id: { control: "text" },
    heading: { control: "text" },
    message: { control: "text" },
    timestamp: { control: "text" },
    datetime: { control: "text" },
    href: { control: "text" },
    linkLabel: { control: "text" },
    target: { control: "select", options: ["_self", "_blank"] },
    Class: { control: "text" },
  },
} satisfies Meta<typeof EmergencyBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NewTab: Story = {
  name: "詳細リンクを新規タブで開く",
  args: { target: "_blank" },
};

export const WithoutAction: Story = {
  name: "本文のみの案内",
  args: {
    href: undefined,
    message:
      "窓口の受付を臨時休止しています。再開予定は、この案内でお知らせします。",
  },
};

export const WithoutTimestamp: Story = {
  name: "掲載時刻なし",
  args: { timestamp: "", datetime: undefined },
};
