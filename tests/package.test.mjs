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
import ts from "typescript";
import { addDeclarationDocs } from "../scripts/add-declaration-docs.mjs";

const execute = promisify(execFile);
const root = fileURLToPath(new URL("../", import.meta.url));
const names = [
  "Button",
  "Card",
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

test("Declaration documentation restoration is idempotent and leaves generated types unchanged", () => {
  const source = `<script lang="ts">
    /** 必須のID。 */
    export let id: string;
    /** ソースのラベル説明。 */
    export let label: string = '';
    export function focus() {}
</script>`;
  const declaration = `declare const Example: Component<{
    [x: string]: any;
    id: string;
    /** 既に生成されたラベル説明。 */ label?: string;
}, {}, {}>;
export default Example;`;
  const documented = addDeclarationDocs(source, declaration, "Example");
  assert.match(documented, /\/\*\* 必須のID。 \*\//);
  assert.match(documented, /既に生成されたラベル説明/);
  assert.doesNotMatch(documented, /ソースのラベル説明|focus/);
  assert.equal(addDeclarationDocs(source, documented, "Example"), documented);
  const withoutComments = (content) =>
    ts
      .createPrinter({ removeComments: true })
      .printFile(
        ts.createSourceFile(
          "component.d.ts",
          content,
          ts.ScriptTarget.Latest,
          true,
        ),
      );
  assert.equal(withoutComments(documented), withoutComments(declaration));
  const wrapped = declaration
    .replace(
      "Component<{",
      () => "Component<$$__sveltets_2_PropsWithChildren<{",
    )
    .replace("}, {}, {}>", "}>, {}, {}>");
  const documentedWrapped = addDeclarationDocs(source, wrapped, "Example");
  assert.match(documentedWrapped, /必須のID/);
  assert.equal(withoutComments(documentedWrapped), withoutComments(wrapped));
  assert.throws(
    () =>
      addDeclarationDocs(source, "declare const Example: unknown;", "Example"),
    /Cannot find generated props/,
  );
});

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
import { ${names.join(", ")}, ${names.map((name) => `type ${name}Props`).join(", ")}, type ResourceListItem, type HorizontalMenuItem, type MenuListItem, type FileUploadExistingFile, type StepNavigationStep, type DatePickerChangeDetail } from '@sharelib-jp/digital-agency-components-svelte-implements';
import type { ComponentProps } from 'svelte';
import LinkSubpath from '@sharelib-jp/digital-agency-components-svelte-implements/components/Link.svelte';
type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type IsAny<T> = 0 extends (1 & T) ? true : false;
${names
  .map(
    (
      name,
    ) => `type ${name}PropsMatch = Assert<Equal<${name}Props, ComponentProps<typeof ${name}>>>;
type ${name}PropsAreTyped = Assert<Equal<IsAny<${name}Props>, false>>;`,
  )
  .join("\n")}
export const buttonProps = { label: '登録する', size: 'md' } satisfies ButtonProps;
export const dateProps = { id: 'date', type: 'consolidated' } satisfies DatePickerProps;
export const inputProps = { id: 'password', type: 'password', fullWidth: true } satisfies InputTextProps;
export const textareaProps = { id: 'message', fullWidth: true } satisfies TextareaProps;
// @ts-expect-error InputText accepts only text or password.
export const invalidInputType: InputTextProps = { type: 'number' };
// @ts-expect-error InputText.fullWidth must be a boolean.
export const invalidInputWidth: InputTextProps = { fullWidth: 'true' };
// @ts-expect-error Textarea.fullWidth must be a boolean.
export const invalidTextareaWidth: TextareaProps = { id: 'message', fullWidth: 'true' };
export const cardProps = { title: 'お知らせ', content: '本文', headingLevel: 'h3' } satisfies CardProps;
declare const cardSnippet: import('svelte').Snippet;
export const snippetCardProps = { content: cardSnippet } satisfies CardProps;
export const childCardProps = { children: cardSnippet, title: '' } satisfies CardProps;
export const emptyCardProps = {} satisfies CardProps;
// @ts-expect-error Explicit children props must be Snippets; nested tag content is converted by Svelte.
export const invalidCardChildren: CardProps = { children: 'hoge' };
// @ts-expect-error Card only accepts text or a Snippet as content.
export const invalidCardContent: CardProps = { content: 123 };
// @ts-expect-error Card requires an HTML heading element as headingLevel.
export const invalidCardHeading: CardProps = { headingLevel: 'div' };
// @ts-expect-error Unknown sizes must not be accepted.
export const invalidSize: ButtonProps = { size: 'huge' };
// @ts-expect-error Button.type is a design variant, not the HTML button type.
export const invalidType: ButtonProps = { type: 'submit' };
// @ts-expect-error DatePicker requires a stable id.
export const missingId: DatePickerProps = {};
// @ts-expect-error DatePicker only accepts consolidated/separated variants.
export const invalidDateType: DatePickerProps = { id: 'date', type: 'native' };
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
          "--strict",
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

test(
  "Editor language service exposes prop types, completion and Japanese hover documentation",
  { timeout: 30_000 },
  async () => {
    const cache = path.join(root, ".svelte-kit");
    await mkdir(cache, { recursive: true });
    const temporary = await mkdtemp(path.join(cache, "package-hover-"));
    let service;
    try {
      const filename = path.join(temporary, "consumer.ts");
      const source = `
import type { ${names.map((name) => `${name}Props`).join(", ")} } from '@sharelib-jp/digital-agency-components-svelte-implements';
import type { ComponentProps } from 'svelte';
import Button from '@sharelib-jp/digital-agency-components-svelte-implements/components/Button.svelte';
${names.map((name) => `declare const props${name}: ${name}Props;`).join("\n")}
declare const directButton: ComponentProps<typeof Button>;
propsButton.size;
propsDatePicker.id;
directButton.size;
`;
      await writeFile(filename, source);
      const options = {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        strict: true,
        skipLibCheck: false,
      };
      service = ts.createLanguageService({
        ...ts.sys,
        useCaseSensitiveFileNames: () => ts.sys.useCaseSensitiveFileNames,
        getCompilationSettings: () => options,
        getScriptFileNames: () => [filename],
        getScriptVersion: () => "0",
        getScriptSnapshot(file) {
          const content = ts.sys.readFile(file);
          return content === undefined
            ? undefined
            : ts.ScriptSnapshot.fromString(content);
        },
        getCurrentDirectory: () => root,
        getDefaultLibFileName: ts.getDefaultLibFilePath,
      });
      const diagnostics = [
        ...service.getSyntacticDiagnostics(filename),
        ...service.getSemanticDiagnostics(filename),
      ];
      assert.equal(
        diagnostics.length,
        0,
        ts.formatDiagnosticsWithColorAndContext(diagnostics, {
          getCanonicalFileName: (file) => file,
          getCurrentDirectory: () => root,
          getNewLine: () => "\n",
        }),
      );

      const quickInfo = (expression) => {
        const position =
          source.indexOf(expression) + expression.indexOf(".") + 1;
        const info = service.getQuickInfoAtPosition(filename, position);
        assert.ok(info, `Missing hover information for ${expression}`);
        return {
          type: ts.displayPartsToString(info.displayParts),
          documentation: ts.displayPartsToString(info.documentation),
        };
      };
      for (const expression of ["propsButton.size", "directButton.size"]) {
        const info = quickInfo(expression);
        assert.match(info.type, /"xs" \| "sm" \| "md" \| "lg"/);
        assert.match(info.documentation, /ボタンのサイズ/);
        assert.match(info.documentation, /既定値: 'md'/);
      }
      const idInfo = quickInfo("propsDatePicker.id");
      assert.match(idInfo.type, /id: string/);
      assert.match(idInfo.documentation, /必須/);

      for (const name of names) {
        const position = source.indexOf(`props${name}:`) + 1;
        const checker = service.getProgram().getTypeChecker();
        const file = service.getProgram().getSourceFile(filename);
        const statement = file.statements.find(
          (node) => node.pos < position && position < node.end,
        );
        assert.ok(statement && ts.isVariableStatement(statement));
        const declaration = statement.declarationList.declarations[0];
        const props = checker.getTypeAtLocation(declaration.name);
        // Check declared props, not Svelte's synthetic children/$$events/$$slots metadata.
        const componentSource = await readFile(
          path.join(root, "src/lib/components", `${name}.svelte`),
          "utf8",
        );
        const properties = [
          ...componentSource.matchAll(/\bexport\s+let\s+(\w+)/g),
        ].map((match) => match[1]);
        assert.ok(properties.length > 0, `${name} must declare props`);
        for (const propertyName of properties) {
          const property = checker.getPropertyOfType(props, propertyName);
          assert.ok(property, `Missing prop type for ${name}.${propertyName}`);
          assert.ok(
            ts.displayPartsToString(property.getDocumentationComment(checker)),
            `Missing hover documentation for ${name}.${propertyName}`,
          );
        }
      }

      const completionPosition =
        source.indexOf("propsButton.size") + "propsButton.".length;
      const completions = service.getCompletionsAtPosition(
        filename,
        completionPosition,
        {},
      );
      const size = completions?.entries.find((entry) => entry.name === "size");
      assert.ok(size, "Button props should be offered as completions");
      const details = service.getCompletionEntryDetails(
        filename,
        completionPosition,
        size.name,
        {},
        size.source,
        {},
        size.data,
      );
      assert.match(
        ts.displayPartsToString(details?.documentation),
        /ボタンのサイズ/,
      );
    } finally {
      service?.dispose();
      await rm(temporary, { recursive: true, force: true });
    }
  },
);
