const documentationBase =
  "https://github.com/sharelib-jp/digital-agency-components-svelte-implements/blob/main/docs/";

export function docsParameters(markdown: string) {
  // Relative Markdown links would otherwise point to nonexistent files on Pages.
  const description = markdown.replace(
    /\]\((\.{1,2}\/[^)\s]+)\)/g,
    (_, link: string) => `](${new URL(link, documentationBase).href})`,
  );
  return { docs: { description: { component: description } } };
}
