import type { Meta, StoryObj } from "./types";
import ModalDialog from "../src/lib/components/ModalDialog.svelte";
import documentation from "../docs/ModalDialog.md?raw";
import { docsParameters } from "./docs";
import ModalDialogExample from "./examples/ModalDialogExample.svelte";

const meta = {
  id: "components-modal-dialog",
  title: "Components/モーダルダイアログ（ModalDialog）",
  component: ModalDialog,
  parameters: docsParameters(documentation),
  render: (args) => ({ Component: ModalDialogExample, props: { args } }),
  args: {
    id: "storybook-modal-default",
    open: false,
    heading: "申請前の確認",
    description: "入力内容と添付書類を確認してください。",
    message: "準備ができたら、このダイアログを閉じて申請に進んでください。",
    hasCloseButton: true,
    hasActions: true,
    closeLabel: "閉じる",
    actionLabel: "確認しました",
    scroll: "outer",
    fixedHeader: false,
    fixedActions: false,
    width: "40rem",
  },
  argTypes: {
    id: { control: "text" },
    open: { control: "boolean" },
    heading: { control: "text" },
    description: { control: "text" },
    message: { control: "text" },
    hasCloseButton: { control: "boolean" },
    hasActions: { control: "boolean" },
    closeLabel: { control: "text" },
    actionLabel: { control: "text" },
    scroll: { control: "select", options: ["outer", "inner"] },
    fixedHeader: { control: "boolean" },
    fixedActions: { control: "boolean" },
    width: { control: "text" },
    initialFocus: { control: false },
  },
} satisfies Meta<typeof ModalDialog, typeof ModalDialogExample>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const InnerScroll: Story = {
  name: "内側スクロール・ヘッダーと操作を固定",
  args: {
    id: "storybook-modal-inner-scroll",
    scroll: "inner",
    fixedHeader: true,
    fixedActions: true,
    message: Array.from(
      { length: 30 },
      (_, index) =>
        `確認事項 ${index + 1}：入力内容と添付書類をご確認ください。`,
    ).join("\n"),
  },
};

export const WithoutActions: Story = {
  name: "操作領域なし",
  args: { id: "storybook-modal-without-actions", hasActions: false },
};
