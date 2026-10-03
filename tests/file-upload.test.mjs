import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createComponentTestHarness } from "./component-test-helpers.mjs";

let harness;
before(async () => {
  harness = await createComponentTestHarness();
});
after(async () => {
  await harness?.cleanup();
});
const render = (props = {}) => {
  const output = harness.render("FileUpload", {
    id: "attachments",
    name: "attachments",
    ...props,
  });
  return typeof output === "string" ? output : (output.body ?? output.html);
};

for (const generate of ["client", "server"]) {
  test(`FileUpload compiles without ${generate} warnings`, () => {
    assert.deepEqual(harness.warnings("FileUpload", generate), []);
  });
}

test("SSR renders labels, native input, drop area, expansion checkbox and empty state", () => {
  const html = render({
    required: true,
    supportText: "PDF形式、5MBまで",
    accept: ".pdf",
    Class: "attachment-field",
  });
  assert.match(html, /class="[^"]*attachment-field/);
  assert.match(html, /for="attachments"/);
  assert.match(html, /id="attachments"[^>]*name="attachments"[^>]*type="file"/);
  assert.match(html, /accept="\.pdf"/);
  assert.match(html, /required/);
  assert.match(
    html,
    /aria-describedby="attachments-support-text attachments-selected-files attachments-error-messages"/,
  );
  assert.match(html, /dads-file-upload__drop-area/);
  assert.match(html, /id="attachments-expand"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /aria-live="assertive"/);
  assert.match(html, /ファイルが選択されていません/);
});

test("SSR existing metadata contributes to summary and hidden form IDs, not per-file accept/size checks", () => {
  const html = render({
    existingFiles: [{ id: "server-1", name: "保存済み.exe", size: 1048576 }],
    accept: ".pdf",
    maxFileSize: 0,
  });
  assert.match(html, /選択中：1個、1MB（1,048,576バイト）/);
  assert.match(
    html,
    /type="hidden"[^>]*name="attachments-existing"[^>]*value="server-1"/,
  );
  assert.match(html, /保存済み.exe/);
  assert.doesNotMatch(html, /data-has-error="true"/);
  assert.match(
    html,
    /aria-labelledby="attachments-file-0-remove attachments-file-0-name"/,
  );
});

test("SSR validates File metadata without accessing browser File or DataTransfer globals", () => {
  // Structural metadata is sufficient for server rendering; no browser objects are constructed.
  const html = render({
    files: [{ name: "BAD.EXE", size: 2049, type: "application/octet-stream" }],
    existingFiles: [{ id: "stored", name: "保存.pdf", size: 1024 }],
    accept: ".pdf",
    maxFiles: 1,
    maxFileSize: "2KB",
    maxTotalSize: "3KB",
    messages: {
      invalidType: "PDFだけを選択してください",
      maxFiles: "{max}個まで。現在{current}個。",
    },
  });
  assert.match(html, /data-has-error="true"/);
  assert.match(html, /PDFだけを選択してください/);
  assert.match(html, /1個まで。現在2個。/);
  assert.match(html, /ファイルサイズが上限を超過/);
  assert.match(html, /合計が上限を超過/);
  assert.match(html, /data-error="true"/);
});

test("SSR accepts extension case, exact MIME and MIME wildcard and ignores empty accept tokens", () => {
  for (const accept of [" .PDF, ", "application/pdf", "application/*"]) {
    assert.doesNotMatch(
      render({
        files: [{ name: "証明.PDF", size: 0, type: "application/pdf" }],
        accept,
      }),
      /data-error="true"/,
    );
  }
  assert.match(
    render({
      files: [{ name: "image.png", size: 0, type: "" }],
      accept: "image/*",
    }),
    /data-error="true"/,
  );
});

test("SSR validates zero boundaries, binary units and invalid constraints", () => {
  const file = { name: "document.pdf", size: 1024, type: "application/pdf" };
  assert.doesNotMatch(
    render({ files: [file], maxFileSize: "1KB", maxTotalSize: 1024 }),
    /data-has-error="true"/,
  );
  assert.match(
    render({ files: [file], maxFileSize: 0, maxFiles: 0 }),
    /data-has-error="true"/,
  );
  for (const maxFileSize of [
    "oops",
    "-1MB",
    -1,
    Infinity,
    `${"9".repeat(310)}GB`,
  ]) {
    assert.match(
      render({ maxFileSize }),
      /制限値または既存ファイルの情報が不正/,
    );
  }
  assert.match(
    render({ maxFiles: 1.5 }),
    /制限値または既存ファイルの情報が不正/,
  );
  assert.match(
    render({ existingFiles: [{ id: "bad", name: "bad", size: -1 }] }),
    /制限値または既存ファイルの情報が不正/,
  );
});

test("SSR readonly removes interactive controls but preserves file and existing-ID submission fields", () => {
  const html = render({
    readonly: true,
    existingFiles: [{ id: "saved", name: "保存.pdf", size: 0 }],
  });
  assert.doesNotMatch(html, /<button/);
  assert.doesNotMatch(html, /id="attachments-expand"/);
  assert.doesNotMatch(html, /class="dads-file-upload__drop-area/);
  assert.match(html, /type="hidden"[^>]*name="attachments-existing"/);
  assert.match(html, /aria-readonly="true"/);
});

test("SSR droppable=false and disabled, external descriptions and managed attribute collisions", () => {
  const html = render({
    droppable: false,
    disabled: true,
    form: "external-form",
    existingFilesName: "retained",
    existingFiles: [{ id: "saved", name: "保存.pdf", size: 0 }],
    "aria-describedby": "outside-help",
    "aria-label": "添付書類",
    class: "must-not-replace-bem",
    type: "text",
    value: "must-not-set-file-value",
  });
  assert.doesNotMatch(html, /class="dads-file-upload__drop-area/);
  assert.doesNotMatch(html, /id="attachments-expand"/);
  assert.doesNotMatch(
    html,
    /must-not-replace-bem|must-not-set-file-value|<input[^>]*\stype="text"/,
  );
  assert.match(html, /aria-label="添付書類"/);
  assert.match(
    html,
    /aria-describedby="outside-help attachments-selected-files attachments-error-messages"/,
  );
  assert.match(
    html,
    /type="hidden"[^>]*name="retained"[^>]*form="external-form"[^>]*disabled/,
  );
});

test("SSR single mode and external error/customValidity expose invalid state", () => {
  assert.match(
    render({
      multiple: false,
      existingFiles: [
        { id: "one", name: "1.pdf", size: 1 },
        { id: "two", name: "2.pdf", size: 1 },
      ],
    }),
    /ファイル数が上限を超過/,
  );
  const html = render({
    errorText: "サーバー検証エラー",
    customValidity: "利用側検証エラー",
  });
  assert.match(html, /aria-invalid="true"/);
  assert.match(html, /サーバー検証エラー/);
  assert.match(html, /利用側検証エラー/);
});

test("renders inside a legacy parent with bound files and existingFiles", async () => {
  const output = await harness.renderSource(`
        <script>
            import FileUpload from './FileUpload.svelte';
            let files = [];
            let existingFiles = [{ id: 'stored', name: '既存.pdf', size: 2048 }];
        </script>
        <form><FileUpload id="bound" name="docs" bind:files bind:existingFiles /></form>
    `);
  const html =
    typeof output === "string" ? output : (output.body ?? output.html);
  assert.match(html, /既存.pdf/);
  assert.match(html, /name="docs-existing"/);
});
