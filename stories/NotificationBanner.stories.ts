import type { Meta, StoryObj } from "./types";
import NotificationBanner from "../src/lib/components/NotificationBanner.svelte";
import documentation from "../docs/NotificationBanner.md?raw";
import { docsParameters } from "./docs";
import NotificationBannerExample from "./examples/NotificationBannerExample.svelte";

const meta = {
  id: "components-notification-banner",
  title: "Components/通知バナー（NotificationBanner）",
  component: NotificationBanner,
  parameters: docsParameters(documentation),
  render: (args) => ({ Component: NotificationBannerExample, props: { args } }),
  args: {
    type: "info-1",
    style: "standard",
    open: true,
    dismissible: true,
    closeButton: "standard",
    closeLabel: "通知を閉じる",
    heading: "サービス利用のご案内",
    message: "申請を始める前に、必要な書類と受付時間をご確認ください。",
    timestamp: "",
    Class: "",
  },
  argTypes: {
    id: { control: "text" },
    type: {
      control: "select",
      options: ["success", "error", "warning", "info-1", "info-2"],
    },
    style: { control: "select", options: ["standard", "color-chip"] },
    open: { control: "boolean" },
    dismissible: { control: "boolean" },
    closeButton: { control: "select", options: ["standard", "mobile-compact"] },
    closeLabel: { control: "text" },
    heading: { control: "text" },
    message: { control: "text" },
    timestamp: { control: "text" },
    datetime: { control: "text" },
    role: {
      control: "select",
      options: ["auto", "status", "alert"],
      mapping: { auto: undefined },
    },
    ariaLive: {
      control: "select",
      options: ["auto", "off", "polite", "assertive"],
      mapping: { auto: undefined },
    },
    Class: { control: "text" },
  },
} satisfies Meta<typeof NotificationBanner, typeof NotificationBannerExample>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Success: Story = {
  name: "保存成功",
  args: {
    type: "success",
    heading: "入力内容を保存しました",
    message: "保存した内容を確認して、次の手順に進んでください。",
  },
};

export const Error: Story = {
  name: "閉じるボタンのないエラー",
  args: {
    type: "error",
    dismissible: false,
    heading: "入力内容を確認してください",
    message: "必須項目に未入力があります。入力後にもう一度送信してください。",
  },
};

export const WarningColorChip: Story = {
  name: "警告・カラーチップ・コンパクトな閉じるボタン",
  args: {
    type: "warning",
    style: "color-chip",
    closeButton: "mobile-compact",
    heading: "申請期限が近づいています",
    message: "今週中に必要な書類を確認してください。",
    timestamp: "2026年10月3日 更新",
    datetime: "2026-10-03",
    role: "status",
    ariaLive: "polite",
  },
};

export const NeutralInformation: Story = {
  name: "グレー系の情報通知",
  args: {
    type: "info-2",
    style: "color-chip",
    heading: "受付時間のお知らせ",
    message: "窓口の受付は平日午前9時から午後5時までです。",
  },
};
