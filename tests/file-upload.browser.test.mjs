import assert from "node:assert/strict";
import { browserTest } from "./browser-test-helpers.mjs";

const harnessSource = `
<script>
    import FileUpload from '../src/lib/components/FileUpload.svelte';
    let files = [];
    let existingFiles = [{ id: 'stored', name: '既存.pdf', size: 1024 }];
    let disabled = false;
    let readonly = false;
    let form = undefined;
    let required = false;
    let multiple = true;
    let accept = '.pdf';
    let maxFiles = 5;
    let maxFileSize = '2KB';
    let maxTotalSize = '5KB';
    let customValidity = '';
    let expandedDropArea = false;
    let secondExpanded = false;
    let show = true;
    let cancelRemove = false;
    let cancelReset = false;
    let cancelNativeReset = false;
    let events = [];
    let submits = 0;
    function record(type, detail) {
        events = [...events, { type, reason: detail.reason, valid: detail.valid,
            errors: detail.errors, nativeMessage: detail.nativeMessage,
            fileErrors: detail.fileErrors?.map(entry => ({ name: entry.file.name, errors: entry.errors })),
            count: detail.count, totalSize: detail.totalSize }];
    }
    export function snapshot() {
        return { files: files.map(file => ({ name: file.name, size: file.size })),
            existingFiles, expandedDropArea, secondExpanded, events, submits };
    }
    export function setState(patch) {
        if ('files' in patch) files = patch.files.map(file => new File([new ArrayBuffer(file.size)], file.name, { type: file.type || '' }));
        if ('existingFiles' in patch) existingFiles = patch.existingFiles;
        if ('disabled' in patch) disabled = patch.disabled;
        if ('readonly' in patch) readonly = patch.readonly;
        if ('form' in patch) form = patch.form ?? undefined;
        if ('required' in patch) required = patch.required;
        if ('multiple' in patch) multiple = patch.multiple;
        if ('accept' in patch) accept = patch.accept;
        if ('maxFiles' in patch) maxFiles = patch.maxFiles;
        if ('maxFileSize' in patch) maxFileSize = patch.maxFileSize;
        if ('maxTotalSize' in patch) maxTotalSize = patch.maxTotalSize;
        if ('customValidity' in patch) customValidity = patch.customValidity;
        if ('expandedDropArea' in patch) expandedDropArea = patch.expandedDropArea;
        if ('secondExpanded' in patch) secondExpanded = patch.secondExpanded;
        if ('show' in patch) show = patch.show;
        if ('cancelRemove' in patch) cancelRemove = patch.cancelRemove;
        if ('cancelReset' in patch) cancelReset = patch.cancelReset;
        if ('cancelNativeReset' in patch) cancelNativeReset = patch.cancelNativeReset;
    }
</script>
<form id="upload-form" on:submit={event => { event.preventDefault(); submits += 1; }}
    on:reset={event => { if (cancelNativeReset) event.preventDefault(); }}>
    <section id="fixture">
        {#if show}
            <FileUpload id="upload" name="documents" label="添付書類" supportText="PDF形式"
                bind:files bind:existingFiles bind:expandedDropArea
                {disabled} {readonly} {form} {required} {multiple} {accept} {maxFiles} {maxFileSize} {maxTotalSize} {customValidity}
                messages={{ maxFiles: '{max}個まで。現在{current}個。', invalidType: 'PDFを選択してください。' }}
                on:change={event => record('change', event.detail)}
                on:validation={event => record('validation', event.detail)}
                on:remove={event => { if (cancelRemove) event.preventDefault(); record('remove', event.detail); }}
                on:reset={event => { if (cancelReset) event.preventDefault(); record('reset', event.detail); }} />
        {/if}
    </section>
    <button id="reset" type="reset">リセット</button>
    <button id="submit" type="submit">確認</button>
</form>
<form id="external-upload-form"></form>
<section id="second-fixture"><FileUpload id="second" name="second" bind:expandedDropArea={secondExpanded} /></section>
`;

async function addFiles(
  page,
  entries,
  { selector = "#upload", drop = false } = {},
) {
  await page.evaluate(`
        const transfer = new DataTransfer();
        for (const entry of ${JSON.stringify(entries)}) transfer.items.add(new File([new ArrayBuffer(entry.size)], entry.name, { type: entry.type || '' }));
        const target = document.querySelector(${JSON.stringify(selector)});
        ${
          drop
            ? "target.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transfer }));"
            : "target.files = transfer.files; target.dispatchEvent(new Event('change', { bubbles: true }));"
        }
        await window.settle();
    `);
}
const file = (name, size = 1024, type = "application/pdf") => ({
  name,
  size,
  type,
});
const formFiles =
  "Array.from(new FormData(document.querySelector('#upload-form')).getAll('documents')).map(file => [file.name, file.size])";
const nativeFiles =
  "Array.from(document.querySelector('#upload').files).map(file => [file.name, file.size])";

browserTest(
  "FileUpload: native file inputs and local selection",
  harnessSource,
  async (t, page, runCase) => {
    await runCase(
      "changing external form association moves submission and reset ownership",
      async (page) => {
        await page.setState({
          form: "external-upload-form",
          files: [file("external.pdf")],
        });
        await page.expect(
          "new FormData(document.getElementById('external-upload-form')).getAll('documents').map(file => file.name)",
          ["external.pdf"],
        );
        await page.expect(
          "new FormData(document.getElementById('upload-form')).has('documents')",
          false,
        );
        await page.evaluate(
          "HTMLFormElement.prototype.reset.call(document.getElementById('upload-form')); await window.settle();",
        );
        await page.expect(
          "window.harness.snapshot().files.map(file => file.name)",
          ["external.pdf"],
        );
        await page.evaluate(
          "HTMLFormElement.prototype.reset.call(document.getElementById('external-upload-form')); await window.settle();",
        );
        await page.expect("window.harness.snapshot().files", []);
        await page.setState({ form: null, files: [file("local.pdf")] });
        await page.evaluate(
          "HTMLFormElement.prototype.reset.call(document.getElementById('external-upload-form')); await window.settle();",
        );
        await page.expect(
          "window.harness.snapshot().files.map(file => file.name)",
          ["local.pdf"],
        );
        await page.evaluate(
          "HTMLFormElement.prototype.reset.call(document.getElementById('upload-form')); await window.settle();",
        );
        await page.expect("window.harness.snapshot().files", []);
      },
    );

    await runCase(
      "chooser activation by keyboard, accumulated files, FormData and same-file reselect",
      async (page) => {
        await page.evaluate(`
            window.chooserClicks = 0;
            document.querySelector('#fixture input[hidden][type=file]').addEventListener('click', event => { event.preventDefault(); window.chooserClicks += 1; });
        `);
        await page.focus("#upload-button");
        await page.key("\uE007");
        await page.expect("window.chooserClicks", 1);
        await addFiles(page, [file("申請.pdf")], {
          selector: "#fixture input[hidden][type=file]",
        });
        await addFiles(page, [file("申請.pdf")], {
          selector: "#fixture input[hidden][type=file]",
        });
        await page.expect(nativeFiles, [
          ["申請.pdf", 1024],
          ["申請.pdf", 1024],
        ]);
        await page.expect(formFiles, [
          ["申請.pdf", 1024],
          ["申請.pdf", 1024],
        ]);
        await page.expect(
          "document.querySelector('#fixture input[hidden][type=file]').files.length",
          0,
        );
        await page.expect(
          "new FormData(document.querySelector('#upload-form')).getAll('documents-existing')",
          ["stored"],
        );
        await page.expect(
          "window.harness.snapshot().files.map(file => file.name)",
          ["申請.pdf", "申請.pdf"],
        );
        await page.expect(
          "window.harness.snapshot().events.filter(event => event.type === 'change').map(event => [event.reason, event.valid, event.count])",
          [
            ["select", true, 2],
            ["select", true, 3],
          ],
        );
        await page.expect(
          "document.querySelector('#upload-selected-files').textContent",
          "選択中：3個、3KB（3,072バイト）",
        );
      },
    );

    await runCase(
      "local drop validates every file, aggregate size/count and blocks native submission",
      async (page) => {
        await page.setState({ maxFiles: 2, maxTotalSize: "2KB" });
        await addFiles(
          page,
          [
            file("不正.exe", 2049, "application/octet-stream"),
            file("正常.PDF", 1024),
          ],
          { selector: "#fixture .dads-file-upload__drop-area", drop: true },
        );
        await page.expect(
          "document.querySelector('#upload').validity.customError",
          true,
        );
        await page.expect(
          "document.querySelectorAll('#fixture [data-error=true]').length",
          1,
        );
        await page.expect(
          "document.querySelector('#upload-error-messages').textContent.includes('2個まで。現在3個。')",
          true,
        );
        await page.expect(
          "document.querySelector('#upload-error-messages').textContent.includes('合計が上限')",
          true,
        );
        await page.expect(
          "document.querySelector('#fixture [data-error=true]').textContent.includes('PDFを選択してください。')",
          true,
        );
        await page.expect(
          "document.querySelector('#fixture [aria-live=assertive]').textContent.includes('不正.exe')",
          true,
        );
        await page.click("#submit");
        await page.expect("window.harness.snapshot().submits", 0);
        await page.expect("document.activeElement.id", "upload-button");
        await page.click("#upload-file-0-remove");
        await page.click("#upload-file-0-remove");
        await page.expect(
          "document.querySelector('#upload').validity.valid",
          true,
        );
        await page.expect(formFiles, [["正常.PDF", 1024]]);
        await page.click("#submit");
        await page.expect("window.harness.snapshot().submits", 1);
      },
    );

    await runCase(
      "removal is cancelable, focuses next/previous item and finally the chooser",
      async (page) => {
        await addFiles(page, [file("1.pdf"), file("2.pdf")]);
        await page.setState({ cancelRemove: true });
        await page.click("#upload-file-1-remove");
        await page.expect("window.harness.snapshot().files.length", 2);
        await page.setState({ cancelRemove: false });
        await page.click("#upload-file-1-remove");
        await page.expect("document.activeElement.id", "upload-file-1-remove");
        await page.expect(nativeFiles, [["2.pdf", 1024]]);
        await page.click("#upload-file-1-remove");
        await page.expect("document.activeElement.id", "upload-file-0-remove");
        await page.click("#upload-file-0-remove");
        await page.expect("document.activeElement.id", "upload-button");
        await page.expect(
          "document.querySelector('#fixture .dads-file-upload__empty-message').textContent",
          "ファイルが選択されていません",
        );
        await page.expect("window.harness.snapshot().existingFiles", []);
        await page.expect(nativeFiles, []);
      },
    );

    await runCase(
      "required is native, including with existing metadata; custom validity is respected",
      async (page) => {
        await page.setState({ required: true });
        await page.click("#submit");
        await page.expect(
          "document.querySelector('#upload').validity.valueMissing",
          true,
        );
        await page.expect(
          "document.querySelector('#upload-error-messages').textContent.includes('ファイルを選択してください。')",
          true,
        );
        await addFiles(page, [file("required.pdf")]);
        await page.expect(
          "document.querySelector('#upload').validity.valid",
          true,
        );
        await page.evaluate(
          "document.querySelector('#upload').setCustomValidity('外部の検証エラー');",
        );
        await page.setState({ maxTotalSize: "9KB" });
        await page.expect(
          "document.querySelector('#upload').validationMessage",
          "外部の検証エラー",
        );
        await page.click("#submit");
        await page.expect("window.harness.snapshot().submits", 0);
        await page.evaluate(
          "document.querySelector('#upload').setCustomValidity('');",
        );
        await page.setState({ customValidity: "利用側エラー" });
        await page.expect(
          "document.querySelector('#upload').validationMessage",
          "利用側エラー",
        );
        await page.setState({ disabled: true, customValidity: "" });
        await page.setState({ disabled: false });
        await page.expect(
          "document.querySelector('#upload').validity.valid",
          true,
        );
      },
    );

    await runCase(
      "parent files, metadata and constraints update UI, native input and FormData",
      async (page) => {
        await page.setState({
          files: [file("parent.PDF", 2048)],
          existingFiles: [{ id: "parent-id", name: "差替.pdf", size: 512 }],
        });
        await page.expect(nativeFiles, [["parent.PDF", 2048]]);
        await page.expect(formFiles, [["parent.PDF", 2048]]);
        await page.expect(
          "new FormData(document.querySelector('#upload-form')).get('documents-existing')",
          "parent-id",
        );
        await page.setState({ maxFileSize: 2047 });
        await page.expect(
          "document.querySelector('#upload').validity.customError",
          true,
        );
        await page.setState({ maxFileSize: 2048, accept: "application/*" });
        await page.expect(
          "document.querySelector('#upload').validity.valid",
          true,
        );
        await page.setState({ files: [], existingFiles: [] });
        await page.expect(nativeFiles, []);
        await page.expect(
          "document.querySelectorAll('#fixture .dads-file-upload__file-item').length",
          0,
        );
        await page.expect(
          "new FormData(document.querySelector('#upload-form')).has('documents-existing')",
          false,
        );
      },
    );

    await runCase(
      "reset clears new files and restores initial existing metadata; cancellations preserve state",
      async (page) => {
        await addFiles(page, [file("reset.pdf")]);
        await page.click("#upload-file-0-remove");
        await page.setState({ cancelNativeReset: true });
        await page.click("#reset");
        await page.expect(nativeFiles, [["reset.pdf", 1024]]);
        await page.setState({ cancelNativeReset: false, cancelReset: true });
        await page.click("#reset");
        await page.expect(nativeFiles, [["reset.pdf", 1024]]);
        await page.setState({ cancelReset: false });
        await page.click("#reset");
        await page.expect(nativeFiles, []);
        await page.expect("window.harness.snapshot().files", []);
        await page.expect("window.harness.snapshot().existingFiles", [
          { id: "stored", name: "既存.pdf", size: 1024 },
        ]);
        await page.expect(
          "window.harness.snapshot().events.filter(event => event.type === 'change').at(-1).reason",
          "reset",
        );
        await page.expect(
          "new FormData(document.querySelector('#upload-form')).get('documents-existing')",
          "stored",
        );
      },
    );

    await runCase(
      "disabled refuses drops/changes/removal and excludes all fields; readonly keeps submission data",
      async (page) => {
        await addFiles(page, [file("kept.pdf")]);
        await page.setState({ disabled: true });
        await addFiles(page, [file("ignored.pdf")], {
          selector: "#fixture .dads-file-upload__drop-area",
          drop: true,
        });
        await addFiles(page, [file("ignored.pdf")]);
        await page.evaluate(
          "document.querySelector('#upload-file-0-remove').click(); await window.settle();",
        );
        await page.expect(nativeFiles, [["kept.pdf", 1024]]);
        await page.expect(
          "Array.from(new FormData(document.querySelector('#upload-form')).keys())",
          [],
        );
        await page.setState({ disabled: false, readonly: true });
        await page.expect(
          "document.querySelectorAll('#fixture button').length",
          0,
        );
        await page.expect(formFiles, [["kept.pdf", 1024]]);
        await addFiles(page, [file("ignored.pdf")], {
          selector: "#fixture .dads-file-upload__inner",
          drop: true,
        });
        await page.expect(nativeFiles, [["kept.pdf", 1024]]);
      },
    );

    await runCase(
      "readonly errors still block submission and focus the visible wrapper",
      async (page) => {
        await page.setState({
          readonly: true,
          customValidity: "保存済み資料の検証エラー",
        });
        await page.click("#submit");
        await page.expect("window.harness.snapshot().submits", 0);
        await page.expect(
          "document.activeElement.classList.contains('dads-file-upload-field')",
          true,
        );
        await page.expect(
          "document.querySelector('#upload-error-messages').textContent.includes('保存済み資料の検証エラー')",
          true,
        );
        await page.setState({ customValidity: "", required: true });
        await page.click("#submit");
        await page.expect(
          "document.querySelector('#upload').validity.valueMissing",
          true,
        );
        await page.expect(
          "document.activeElement.classList.contains('dads-file-upload-field')",
          true,
        );
      },
    );

    await runCase(
      "single mode replaces stored/new files, oversized drops stay visible and invalid",
      async (page) => {
        await page.setState({ multiple: false });
        await addFiles(page, [file("first.pdf")]);
        await page.expect("window.harness.snapshot().existingFiles", []);
        await addFiles(page, [file("second.pdf")]);
        await page.expect(nativeFiles, [["second.pdf", 1024]]);
        await addFiles(page, [file("one.pdf"), file("two.pdf")], {
          selector: "#fixture .dads-file-upload__drop-area",
          drop: true,
        });
        await page.expect(
          "document.querySelectorAll('#fixture .dads-file-upload__file-item').length",
          2,
        );
        await page.expect(
          "document.querySelector('#upload').validity.customError",
          true,
        );
        await page.expect(
          "document.querySelector('#upload-error-messages').textContent.includes('1個まで。現在2個。')",
          true,
        );
      },
    );

    await runCase(
      "expanded drop area has a single owner and cleanup removes document listeners",
      async (page) => {
        await page.setState({ expandedDropArea: true, secondExpanded: true });
        await page.expect("window.harness.snapshot().expandedDropArea", false);
        await page.setState({ expandedDropArea: true });
        await page.expect("window.harness.snapshot().secondExpanded", false);
        await page.evaluate(`
            const transfer = new DataTransfer(); transfer.items.add(new File(['x'], 'wide.pdf', { type: 'application/pdf' }));
            document.body.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: transfer }));
            await window.settle();
            if (!document.querySelector('#fixture .dads-file-upload__viewport-overlay')) throw new Error('Missing expanded overlay');
            document.body.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transfer }));
            await window.settle();
        `);
        await page.expect(nativeFiles, [["wide.pdf", 1]]);
        await page.expect(
          "document.querySelector('#fixture .dads-file-upload__viewport-overlay') === null",
          true,
        );
        await page.setState({ show: false });
        await page.evaluate(`
            const transfer = new DataTransfer(); transfer.items.add(new File(['x'], 'orphan.pdf'));
            const event = new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transfer });
            document.body.dispatchEvent(event); await window.settle();
            if (event.defaultPrevented) throw new Error('Unmounted instance still handles drops');
        `);
        assert.deepEqual((await page.snapshot()).files, [
          { name: "wide.pdf", size: 1 },
        ]);
      },
    );

    await runCase(
      "unsupported DataTransfer synchronization reports an error and prevents normal submission",
      async (page) => {
        await page.evaluate(
          "window.originalDataTransfer = window.DataTransfer; window.DataTransfer = class { constructor() { throw new Error('unsupported'); } };",
        );
        await page.setState({ files: [file("unsupported.pdf")] });
        await page.expect(
          "document.querySelector('#upload').validity.customError",
          true,
        );
        await page.expect(
          "document.querySelector('#upload-error-messages').textContent.includes('フォーム入力に反映できません')",
          true,
        );
        await page.click("#submit");
        await page.expect("window.harness.snapshot().submits", 0);
        await page.evaluate(
          "window.DataTransfer = window.originalDataTransfer;",
        );
        await page.setState({ files: [] });
        await page.expect(
          "document.querySelector('#upload').validity.valid",
          true,
        );
      },
    );
  },
);
