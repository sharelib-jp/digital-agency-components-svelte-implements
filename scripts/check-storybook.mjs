import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(root, "storybook-static");

async function readOutput(name) {
  try {
    return await readFile(path.join(output, name), "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(
        "Storybook build is missing. Run pnpm build:storybook first.",
        {
          cause: error,
        },
      );
    }
    throw error;
  }
}

test("Every exported component has a Default story, documentation and a built story module", async () => {
  const source = await readFile(path.join(root, "src/lib/index.ts"), "utf8");
  const names = [...source.matchAll(/export \{ default as (\w+) \}/g)].map(
    ([, name]) => name,
  );
  assert.ok(names.length > 0, "No public components found");
  const index = JSON.parse(await readOutput("index.json"));
  const entries = Object.values(index.entries);
  const assets = await readdir(path.join(output, "assets"));
  for (const name of names) {
    const importPath = `./stories/${name}.stories.ts`;
    const stories = entries.filter((entry) => entry.importPath === importPath);
    assert.ok(
      stories.some(
        (entry) => entry.type === "story" && entry.exportName === "Default",
      ),
      `${name}: Default story is missing`,
    );
    assert.equal(
      stories.filter((entry) => entry.type === "docs").length,
      1,
      `${name}: expected one autodocs page`,
    );
    assert.ok(
      assets.some(
        (asset) =>
          asset.startsWith(`${name}.stories-`) && asset.endsWith(".js"),
      ),
      `${name}: built story module is missing`,
    );
  }
  console.log(
    `Verified ${names.length} components, ${entries.filter((entry) => entry.type === "story").length} stories and ${entries.filter((entry) => entry.type === "docs").length} docs pages.`,
  );
});

test("HTML asset references resolve below the GitHub Pages repository subpath", async () => {
  const base = new URL(
    "https://sharelib-jp.github.io/digital-agency-components-svelte-implements/",
  );
  for (const name of ["index.html", "iframe.html"]) {
    const html = await readOutput(name);
    // Ignore HTML examples inside scripts, but keep script src attributes.
    const markup = html.replace(
      /(<script\b[^>]*>)[\s\S]*?<\/script\s*>/gi,
      (_, opening) => `${opening}</script>`,
    );
    const references = [
      ...markup.matchAll(/(?:src|href)=["']([^"']+)["']/g),
    ].map(([, reference]) => reference);
    assert.ok(references.length > 0, `${name}: no assets found`);
    for (const reference of references) {
      if (/^(?:[a-z][\w+.-]*:|\/\/|#)/i.test(reference)) continue;
      const resolved = new URL(reference, new URL(name, base));
      assert.ok(
        resolved.pathname.startsWith(base.pathname),
        `${name}: asset escapes the Pages subpath: ${reference}`,
      );
      const relative = decodeURIComponent(
        resolved.pathname.slice(base.pathname.length),
      );
      assert.ok(
        (await stat(path.join(output, relative))).isFile(),
        `${name}: missing asset ${reference}`,
      );
    }
  }
  assert.match(
    await readOutput("iframe.html"),
    /document\.documentElement\.lang\s*=\s*["']ja["']/,
  );
  assert.match(await readOutput("iframe.html"), /rel="icon" href="data:,"/);
});

test("Storybook output contains no source directories or local credentials", async () => {
  const files = await readdir(output, { recursive: true });
  for (const file of files) {
    assert.doesNotMatch(
      file,
      /(?:^|[/\\])(?:node_modules|src|stories|tests|\.git|\.npmrc|\.env(?:\.[^/\\]+)?)(?:$|[/\\])/,
    );
  }
});

test("Markdown documentation links point to GitHub, not missing Markdown files on Pages", async () => {
  const source = await readFile(path.join(root, "stories/docs.ts"), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const { docsParameters } = await import(
    `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
  );
  const markdown =
    "[準備](./README.md#共通の準備) [本体](../README.md) [外部](https://example.com/) `For`";
  const { description } = docsParameters(markdown).docs;
  assert.equal(
    description.component,
    "[準備](https://github.com/sharelib-jp/digital-agency-components-svelte-implements/blob/main/docs/README.md#%E5%85%B1%E9%80%9A%E3%81%AE%E6%BA%96%E5%82%99) [本体](https://github.com/sharelib-jp/digital-agency-components-svelte-implements/blob/main/README.md) [外部](https://example.com/) `For`",
  );
});
