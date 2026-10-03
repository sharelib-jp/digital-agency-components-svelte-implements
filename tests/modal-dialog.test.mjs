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

const componentNames = ["ModalDialog"];
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

test("ModalDialog: heading/description associations, width and SSR open deferred to mount", () => {
  const html = renderComponent("ModalDialog", {
    id: "confirm",
    open: true,
    heading: "確認",
    description: "実行前の確認",
    describedBy: "external-help",
    message: "続行しますか",
    width: "40rem",
  });
  const dialog = getTag(html, "dialog", {
    id: "confirm",
    "aria-labelledby": "confirm-heading",
    "aria-describedby": "confirm-description external-help",
    "data-scroll": "outer",
  });
  assert.match(dialog.attributes.style, /--modal-dialog-width:\s*40rem/);
  assertAbsentAttribute(dialog, "open");
  assert.equal(
    text(element(html, "h2", { id: "confirm-heading", tabindex: "-1" }).inner),
    "確認",
  );
  assert.equal(
    text(element(html, "p", { id: "confirm-description" }).inner),
    "実行前の確認",
  );
  assert.match(text(html), /続行しますか/);
});

for (const scroll of ["outer", "inner"]) {
  for (const fixedHeader of [false, true]) {
    for (const fixedActions of [false, true]) {
      test(`ModalDialog: ${scroll} scroll, fixedHeader=${fixedHeader}, fixedActions=${fixedActions} SSR structure`, () => {
        const html = renderComponent("ModalDialog", {
          id: "scroll-modal",
          scroll,
          fixedHeader,
          fixedActions,
        });
        getTag(html, "dialog", { "data-scroll": scroll });
        assert.equal(
          matchingTags(html, "h2", { id: "scroll-modal-heading" }).length,
          1,
        );
        assert.equal(
          matchingTags(html, "div", { class: "dads-modal-dialog__header" })
            .length,
          1,
        );
        assert.equal(
          matchingTags(html, "div", { class: "dads-modal-dialog__actions" })
            .length,
          1,
        );
        const hasScrollArea =
          scroll === "inner" && (fixedHeader || fixedActions);
        assert.equal(
          matchingTags(html, "div", { class: "dads-modal-dialog__scroll-area" })
            .length,
          hasScrollArea ? 1 : 0,
        );
        if (hasScrollArea) {
          const area = element(html, "div", {
            class: "dads-modal-dialog__scroll-area",
          });
          assert.equal(
            matchingTags(area.inner, "div", {
              class: "dads-modal-dialog__header",
            }).length,
            fixedHeader ? 0 : 1,
          );
          assert.equal(
            matchingTags(area.inner, "div", {
              class: "dads-modal-dialog__actions",
            }).length,
            fixedActions ? 0 : 1,
          );
          getTag(area.inner, "div", { class: "dads-modal-dialog__body" });
        }
      });
    }
  }
}

test("ModalDialog: optional description, close control and actions are omitted", () => {
  const html = renderComponent("ModalDialog", {
    id: "minimal-modal",
    hasCloseButton: false,
    hasActions: false,
  });
  assertAbsentAttribute(getTag(html, "dialog"), "aria-describedby");
  assert.equal(tags(html, "button").length, 0);
  assert.equal(
    matchingTags(html, "p", { class: "dads-modal-dialog__description" }).length,
    0,
  );
  assert.equal(
    matchingTags(html, "div", { class: "dads-modal-dialog__actions" }).length,
    0,
  );
});
