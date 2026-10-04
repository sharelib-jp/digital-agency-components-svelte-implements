import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "svelte/compiler";
import ts from "typescript";

// svelte2tsx's $$restProps wrapper can lose JSDoc when TypeScript emits declarations.
// Restore only missing comments; svelte-package remains the source of all prop types.
export function addDeclarationDocs(source, declaration, name) {
  const instance = parse(source).instance;
  if (!instance) return declaration;
  const script = source.slice(instance.content.start, instance.content.end);
  const input = ts.createSourceFile(
    "component.ts",
    script,
    ts.ScriptTarget.Latest,
    true,
  );
  const docs = new Map();
  for (const statement of input.statements) {
    if (
      !ts.isVariableStatement(statement) ||
      !statement.modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
      ) ||
      !(statement.declarationList.flags & ts.NodeFlags.Let)
    )
      continue;
    const comment = ts.getJSDocCommentsAndTags(statement).find(ts.isJSDoc);
    if (!comment) continue;
    const indent = script.slice(
      script.lastIndexOf("\n", comment.pos) + 1,
      comment.pos,
    );
    const text = comment
      .getText(input)
      .split("\n")
      .map((line, index) =>
        index > 0 && line.startsWith(indent) ? line.slice(indent.length) : line,
      )
      .join("\n");
    for (const variable of statement.declarationList.declarations) {
      if (ts.isIdentifier(variable.name)) docs.set(variable.name.text, text);
    }
  }
  if (!docs.size) return declaration;

  const output = ts.createSourceFile(
    "component.d.ts",
    declaration,
    ts.ScriptTarget.Latest,
    true,
  );
  const component = output.statements
    .filter(ts.isVariableStatement)
    .flatMap((statement) => statement.declarationList.declarations)
    .find(
      (variable) =>
        ts.isIdentifier(variable.name) && variable.name.text === name,
    );
  let props =
    component?.type && ts.isTypeReferenceNode(component.type)
      ? component.type.typeArguments?.[0]
      : undefined;
  if (
    props &&
    ts.isTypeReferenceNode(props) &&
    props.typeName.getText(output) === "$$__sveltets_2_PropsWithChildren"
  ) {
    props = props.typeArguments?.[0];
  }
  if (!props || !ts.isTypeLiteralNode(props)) {
    throw new Error(
      `Cannot find generated props for ${name}; check svelte-package's declaration format.`,
    );
  }
  const insertions = [];
  for (const member of props.members) {
    if (
      !ts.isPropertySignature(member) ||
      !member.name ||
      (!ts.isIdentifier(member.name) && !ts.isStringLiteral(member.name))
    )
      continue;
    const comment = docs.get(member.name.text);
    if (!comment || ts.getJSDocCommentsAndTags(member).length) continue;
    const position = member.getStart(output);
    const indent = declaration.slice(
      declaration.lastIndexOf("\n", position) + 1,
      position,
    );
    insertions.push({
      position,
      text: comment.replaceAll("\n", "\n" + indent) + "\n" + indent,
    });
  }
  for (const { position, text } of insertions.reverse()) {
    declaration =
      declaration.slice(0, position) + text + declaration.slice(position);
  }
  return declaration;
}

async function main() {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const components = path.join(root, "src/lib/components");
  for (const filename of await readdir(components)) {
    if (!filename.endsWith(".svelte")) continue;
    const target = path.join(root, "dist/components", `${filename}.d.ts`);
    const source = await readFile(path.join(components, filename), "utf8");
    const declaration = await readFile(target, "utf8");
    const documented = addDeclarationDocs(
      source,
      declaration,
      filename.slice(0, -7),
    );
    if (documented !== declaration) await writeFile(target, documented);
  }
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
) {
  await main();
}
