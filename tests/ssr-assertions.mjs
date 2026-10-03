import assert from "node:assert/strict";

function decodeEntities(value) {
  const named = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
  return value.replace(
    /&(?:#(\d+)|#x([\da-f]+)|(amp|lt|gt|quot|apos));/gi,
    (_, decimal, hexadecimal, name) =>
      decimal
        ? String.fromCodePoint(Number(decimal))
        : hexadecimal
          ? String.fromCodePoint(Number.parseInt(hexadecimal, 16))
          : named[name.toLowerCase()],
  );
}

// Small opening-tag queries avoid snapshots of generated Svelte hashes/comments
// and do not assume an attribute order or a particular boolean serialization.
export function tags(html, name) {
  const pattern = new RegExp(`<${name}\\b(?:[^"'<>]|"[^"]*"|'[^']*')*>`, "g");
  return [...html.matchAll(pattern)].map((match) => {
    const attributeSource = match[0]
      .replace(/^<[^\s/>]+/, "")
      .replace(/\/?>$/, "");
    const attributes = Object.fromEntries(
      [
        ...attributeSource.matchAll(
          /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g,
        ),
      ].map((attribute) => [
        attribute[1],
        decodeEntities(attribute[2] ?? attribute[3] ?? attribute[4] ?? ""),
      ]),
    );
    return {
      attributes,
      start: match.index,
      end: match.index + match[0].length,
    };
  });
}

export function matchingTags(html, name, expected = {}) {
  return tags(html, name).filter(({ attributes }) =>
    Object.entries(expected).every(([key, value]) =>
      key === "class"
        ? (attributes.class ?? "").split(/\s+/).includes(value)
        : Object.hasOwn(attributes, key) && attributes[key] === value,
    ),
  );
}

export function getTag(html, name, expected = {}) {
  const matches = matchingTags(html, name, expected);
  assert.ok(
    matches.length,
    `Missing <${name}> with ${JSON.stringify(expected)}`,
  );
  return matches[0];
}

export function element(html, name, expected = {}) {
  const opening = getTag(html, name, expected);
  const pattern = new RegExp(
    `<\\/?${name}\\b(?:[^"'<>]|"[^"]*"|'[^']*')*>`,
    "g",
  );
  pattern.lastIndex = opening.end;
  let depth = 1;
  for (let match; (match = pattern.exec(html));) {
    if (match[0].startsWith("</")) depth--;
    else if (!match[0].endsWith("/>")) depth++;
    if (depth === 0)
      return { ...opening, inner: html.slice(opening.end, match.index) };
  }
  assert.fail(`Missing closing </${name}>`);
}

export function text(html) {
  return decodeEntities(
    html
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<(?:[^"'<>]|"[^"]*"|'[^']*')*>/g, ""),
  )
    .replace(/\s+/g, " ")
    .trim();
}

export function assertAbsentAttribute(tag, attribute) {
  assert.equal(
    Object.hasOwn(tag.attributes, attribute),
    false,
    `Unexpected ${attribute}`,
  );
}

export function assertInternalDescriptions(html, control, id) {
  assert.equal(
    control.attributes["aria-describedby"],
    `external-help ${id}-support-text ${id}-error-text`,
  );
  for (const suffix of ["support-text", "error-text"]) {
    assert.equal(
      tags(html, "p")
        .concat(tags(html, "span"))
        .filter(({ attributes }) => attributes.id === `${id}-${suffix}`).length,
      1,
    );
  }
}
