import assert from "node:assert/strict";
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { compile } from "svelte/compiler";
import { render } from "svelte/server";

const root = fileURLToPath(new URL("../", import.meta.url));
const componentDirectory = path.join(root, "src/lib/components");

// Compile the real components and their dependencies rather than stubbing them.
// Each suite owns an isolated directory, so node:test can run suites concurrently.
export async function createComponentTestHarness(names) {
  const cache = path.join(root, ".svelte-kit");
  await mkdir(cache, { recursive: true });
  const temporary = await mkdtemp(path.join(cache, "component-tests-"));
  const compiled = new Map();
  const components = new Map();
  const compiling = new Set();
  let harnessNumber = 0;

  async function rewriteImports(code, filename) {
    const matches = [
      ...code.matchAll(/(\bfrom\s+|\bimport\s*)(['"])([^'"]+\.svelte)\2/g),
    ];
    for (const match of matches) {
      const source = path.resolve(path.dirname(filename), match[3]);
      await compileComponent(path.basename(source, ".svelte"));
      code = code.replace(
        match[0],
        `${match[1]}${JSON.stringify(`./${path.basename(source, ".svelte")}.mjs`)}`,
      );
    }
    return code;
  }

  async function compileComponent(name) {
    if (compiled.has(`${name}:server`) || compiling.has(name)) return;
    compiling.add(name);
    const filename = path.join(componentDirectory, `${name}.svelte`);
    const source = await readFile(filename, "utf8");
    for (const generate of ["client", "server"]) {
      const result = compile(source, { filename, generate });
      compiled.set(`${name}:${generate}`, result);
      if (generate === "server") {
        await writeFile(
          path.join(temporary, `${name}.mjs`),
          await rewriteImports(result.js.code, filename),
        );
      }
    }
    compiling.delete(name);
  }

  try {
    names ??= (await readdir(componentDirectory))
      .filter((name) => name.endsWith(".svelte"))
      .map((name) => name.slice(0, -7));
    for (const name of names) await compileComponent(name);
    for (const key of compiled.keys()) {
      if (!key.endsWith(":server")) continue;
      const name = key.slice(0, -7);
      components.set(
        name,
        (await import(pathToFileURL(path.join(temporary, `${name}.mjs`)).href))
          .default,
      );
    }
  } catch (error) {
    await rm(temporary, { recursive: true, force: true });
    throw error;
  }

  async function compileSource(source) {
    const name = `Harness${++harnessNumber}`;
    const filename = path.join(root, "tests", `${name}.svelte`);
    let server;
    for (const generate of ["client", "server"]) {
      const result = compile(source, { filename, generate });
      assert.deepEqual(
        result.warnings,
        [],
        `${name}: ${generate} harness warnings`,
      );
      if (generate === "server") server = result;
    }
    const target = path.join(temporary, `${name}.mjs`);
    await writeFile(target, await rewriteImports(server.js.code, filename));
    return (await import(pathToFileURL(target).href)).default;
  }

  return {
    compiled,
    components,
    warnings: (name, generate) => compiled.get(`${name}:${generate}`).warnings,
    render: (name, props = {}) => render(components.get(name), { props }).body,
    compileSource,
    async renderSource(source, props = {}) {
      return render(await compileSource(source), { props }).body;
    },
    async cleanup() {
      await rm(temporary, { recursive: true, force: true });
    },
  };
}
