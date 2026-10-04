import type { Meta, StoryObj } from "./types";
import FileUpload from "../src/lib/components/FileUpload.svelte";
import documentation from "../docs/FileUpload.md?raw";
import { docsParameters } from "./docs";

const meta = {
  id: "components-file-upload",
  title: "Components/ファイルアップロード（FileUpload）",
  component: FileUpload,
  parameters: docsParameters(documentation),
  args: {
    id: "storybook-file-upload-attachments",
    name: "attachments",
    existingFilesName: "retainedAttachments",
    label: "申請書の添付資料",
    supportText:
      "PDFを5個まで。各5MBまで、合計10MBまで。通信・アップロードは行いません。",
    required: false,
    disabled: false,
    readonly: false,
    multiple: true,
    accept: ".pdf",
    existingFiles: [],
    maxFiles: 5,
    maxFileSize: "5MB",
    maxTotalSize: "10MB",
    droppable: true,
    dropAreaExpandable: true,
    expandedDropArea: false,
    buttonLabel: "ファイルを選択",
    dropText: "または、このエリア内にドラッグ＆ドロップ",
    expandLabel: "ドラッグ＆ドロップの範囲をこのブラウザウィンドウ全体に広げる",
    overlayText: "このエリア内にファイルをドラッグ＆ドロップ",
    emptyText: "ファイルが選択されていません",
    removeLabel: "解除",
    errorText: null,
    customValidity: "",
    messages: {},
    Class: "",
  },
  argTypes: {
    id: { control: "text" },
    name: { control: "text" },
    form: {
      control: "text",
      description:
        "関連付ける外部フォームがある場合、その実在するIDを指定します。",
    },
    existingFilesName: { control: "text" },
    label: { control: "text" },
    supportText: { control: "text" },
    required: {
      control: "boolean",
      description:
        "新規Fileを求める制約。既存ファイルのメタデータだけでは満たせません。",
    },
    disabled: { control: "boolean" },
    readonly: { control: "boolean" },
    multiple: { control: "boolean" },
    accept: { control: "text" },
    files: {
      control: false,
      description:
        "File[]はControlsで編集・シリアライズせず、選択UIから追加します。",
    },
    existingFiles: {
      control: "object",
      description:
        "保存済みファイルのメタデータ（id、name、バイト単位のsize）。",
    },
    maxFiles: { control: { type: "number", min: 0, step: 1 } },
    maxFileSize: {
      control: "text",
      description: "5MBなどのサイズ文字列。空文字列で上限なし。",
    },
    maxTotalSize: {
      control: "text",
      description: "10MBなどのサイズ文字列。空文字列で上限なし。",
    },
    droppable: { control: "boolean" },
    dropAreaExpandable: { control: "boolean" },
    expandedDropArea: {
      control: "boolean",
      description:
        "ウィンドウ全体へのドロップ受付。同時に有効なのは1インスタンスだけです。",
    },
    buttonLabel: { control: "text" },
    dropText: { control: "text" },
    expandLabel: { control: "text" },
    overlayText: { control: "text" },
    emptyText: { control: "text" },
    removeLabel: { control: "text" },
    errorText: { control: "text" },
    customValidity: { control: "text" },
    messages: { control: "object" },
    Class: { control: "text" },
  },
} satisfies Meta<typeof FileUpload>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SingleFile: Story = {
  args: {
    id: "storybook-file-upload-single",
    name: "applicationDocument",
    existingFilesName: "retainedApplicationDocument",
    label: "申請書",
    multiple: false,
    maxFiles: 1,
    droppable: false,
    supportText: "PDFを1個選択してください。5MBまで。",
  },
};

export const Readonly: Story = {
  args: {
    id: "storybook-file-upload-readonly",
    name: "submittedAttachments",
    existingFilesName: "retainedSubmittedAttachments",
    label: "提出済みの添付資料",
    readonly: true,
    existingFiles: [
      {
        id: "stored-application-001",
        name: "保存済み申請書.pdf",
        size: 1048576,
      },
      {
        id: "stored-supporting-002",
        name: "保存済み参考資料.pdf",
        size: 524288,
      },
    ],
    supportText:
      "保存済みファイルのメタデータ表示です。追加・解除はできません。",
  },
};

export const Disabled: Story = {
  args: {
    id: "storybook-file-upload-disabled",
    name: "unavailableAttachments",
    existingFilesName: "retainedUnavailableAttachments",
    disabled: true,
    supportText: "現在、添付資料の変更は受け付けていません。",
  },
};

export const Error: Story = {
  args: {
    id: "storybook-file-upload-error",
    name: "requiredAttachments",
    existingFilesName: "retainedRequiredAttachments",
    required: true,
    errorText: "申請書のPDFを添付してください。",
  },
};
