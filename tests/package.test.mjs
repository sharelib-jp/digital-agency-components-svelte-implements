import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execute = promisify(execFile);
const root = fileURLToPath(new URL("../", import.meta.url));
const names = [
  "Button",
  "Checkbox",
  "Divider",
  "EmergencyBanner",
  "FormControlLabel",
  "Heading",
  "HorizontalMenu",
  "Image",
  "InputText",
  "Link",
  "ModalDialog",
  "NotificationBanner",
  "PageNavigation",
  "RadioButton",
  "ResourceList",
  "SearchBox",
  "Switch",
  "Textarea",
  "MenuList",
  "MenuListBox",
  "ProgressIndicator",
  "FileUpload",
  "StepNavigation",
  "DatePicker",
];

test("Every public package export has a built implementation and type declaration", async () => {
  const manifest = JSON.parse(
    await readFile(path.join(root, "package.json"), "utf8"),
  );
  for (const target of Object.values(manifest.exports["."])) {
    assert.ok((await stat(path.join(root, target))).isFile());
  }
  for (const name of names) {
    for (const target of Object.values(
      manifest.exports["./components/*.svelte"],
    )) {
      assert.ok(
        (await stat(path.join(root, target.replace("*", name)))).isFile(),
      );
    }
  }
  assert.ok(
    (await stat(path.join(root, manifest.exports["./global.css"]))).isFile(),
  );
  assert.deepEqual(manifest.files, ["dist", "THIRD_PARTY_NOTICES.md"]);
  assert.equal(manifest.publishConfig.registry, "https://npm.pkg.github.com");
});

test(
  "Consumer type checking validates generated declarations without skipLibCheck",
  { timeout: 30_000 },
  async () => {
    const cache = path.join(root, ".svelte-kit");
    await mkdir(cache, { recursive: true });
    const temporary = await mkdtemp(path.join(cache, "package-types-"));
    try {
      const fixture = path.join(temporary, "consumer.ts");
      await writeFile(
        fixture,
        `
import { ${names.join(", ")}, type ResourceListItem, type HorizontalMenuItem, type MenuListItem, type FileUploadExistingFile, type StepNavigationStep, type DatePickerChangeDetail } from '@sharelib-jp/digital-agency-components-svelte-implements';
import LinkSubpath from '@sharelib-jp/digital-agency-components-svelte-implements/components/Link.svelte';
export const components = [${names.join(", ")}, LinkSubpath];
export const resource: ResourceListItem = { id: 'guide', type: 'link', title: 'ガイド', href: '/guide' };
export const menu: HorizontalMenuItem = { id: 'home', label: 'ホーム', href: '/' };
export const list: MenuListItem = { id: 'guide', label: 'ガイド', href: '/guide' };
export const stored: FileUploadExistingFile = { id: 'saved', name: 'saved.pdf', size: 1024 };
export const step: StepNavigationStep = { id: 'input', label: '入力', status: 'editing' };
export const date: DatePickerChangeDetail = { value: '2024-02-29', date: null, valid: true, source: 'input' };
`,
      );
      await execute(
        "pnpm",
        [
          "exec",
          "tsc",
          "--ignoreConfig",
          "--noEmit",
          "--skipLibCheck",
          "false",
          "--module",
          "ESNext",
          "--moduleResolution",
          "bundler",
          "--target",
          "ES2022",
          "--lib",
          "ES2022,DOM,DOM.Iterable",
          fixture,
        ],
        { cwd: root, timeout: 25_000 },
      );
    } finally {
      await rm(temporary, { recursive: true, force: true });
    }
  },
);
