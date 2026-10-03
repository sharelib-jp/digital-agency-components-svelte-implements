import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { render } from "svelte/server";
import { createComponentTestHarness } from "./component-test-helpers.mjs";
import { fixtures, representativeTags } from "./component-fixtures.mjs";
import {
  tags,
  matchingTags,
  getTag,
  element,
  text,
  assertAbsentAttribute,
  assertInternalDescriptions,
} from "./ssr-assertions.mjs";

const componentNames = ["Image"];
let harness, compiled, components;
before(async () => {
  harness = await createComponentTestHarness(componentNames);
  compiled = harness.compiled;
  components = harness.components;
});
after(async () => {
  await harness?.cleanup();
});
const renderComponent = (name, props = structuredClone(fixtures[name])) =>
  harness.render(name, props);
const compileHarness = (source) => harness.compileSource(source);

for (const type of ["border", "borderless", "link"]) {
  test(`Image: ${type} wrapper, alt and full-width variant`, () => {
    const html = renderComponent("Image", {
      src: "/test-image.png",
      alt: '庁舎 & "入口" <正面>',
      type,
      fullWidth: true,
      href: "/image",
      target: "_blank",
      rel: "author",
    });
    getTag(html, "figure", { "data-full-width": "" });
    getTag(html, "img", {
      src: "/test-image.png",
      alt: '庁舎 & "入口" <正面>',
      decoding: "auto",
    });
    const area = getTag(html, type === "link" ? "a" : "div", {
      class: "dads-image__image-area",
    });
    assert.equal(
      Object.hasOwn(area.attributes, "data-bordered"),
      type === "border",
    );
    if (type === "link") {
      assert.equal(area.attributes.href, "/image");
      assert.equal(area.attributes.target, "_blank");
      assert.equal(area.attributes.rel, "author noopener noreferrer");
    } else assertAbsentAttribute(area, "href");
  });
}

test("Image: decorative alt, responsive picture sources and image attributes", () => {
  const html = renderComponent("Image", {
    src: "/small.png",
    alt: "",
    srcset: "/small.png 1x, /large.png 2x",
    sizes: "100vw",
    width: 640,
    height: 480,
    loading: "lazy",
    decoding: "async",
    sources: [
      {
        srcset: "/wide.webp",
        media: "(min-width: 48rem)",
        type: "image/webp",
        sizes: "50vw",
        width: 1280,
        height: 720,
      },
    ],
  });
  getTag(html, "picture");
  getTag(html, "source", {
    srcset: "/wide.webp",
    media: "(min-width: 48rem)",
    type: "image/webp",
    sizes: "50vw",
    width: "1280",
    height: "720",
  });
  getTag(html, "img", {
    alt: "",
    srcset: "/small.png 1x, /large.png 2x",
    sizes: "100vw",
    width: "640",
    height: "480",
    loading: "lazy",
    decoding: "async",
  });
  assert.equal(tags(html, "figcaption").length, 0);
});

for (const captionStyle of ["dashed", "solid"]) {
  test(`Image: ${captionStyle} caption`, () => {
    const html = renderComponent("Image", { ...fixtures.Image, captionStyle });
    assert.equal(
      text(element(html, "figcaption", { "data-style": captionStyle }).inner),
      "図の説明",
    );
  });
}
