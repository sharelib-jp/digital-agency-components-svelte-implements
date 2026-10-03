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

const componentNames = ["NotificationBanner"];
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

const notificationTypes = {
  success: ["status", "成功"],
  error: ["alert", "エラー"],
  warning: ["alert", "警告"],
  "info-1": ["status", "インフォメーション"],
  "info-2": ["status", "インフォメーション"],
};

for (const [type, [role, iconLabel]] of Object.entries(notificationTypes)) {
  for (const style of ["standard", "color-chip"]) {
    test(`NotificationBanner: ${type}/${style} role, icon and message`, () => {
      const html = renderComponent("NotificationBanner", {
        type,
        style,
        heading: "通知",
        message: "本文",
        dismissible: false,
      });
      getTag(html, "div", {
        class: "dads-notification-banner",
        "data-type": type,
        "data-style": style,
        role,
      });
      getTag(html, "svg", { role: "img", "aria-label": iconLabel });
      assert.match(text(html), /通知/);
      assert.match(text(html), /本文/);
      assert.equal(tags(html, "button").length, 0);
    });
  }
}

for (const closeButton of ["standard", "mobile-compact"]) {
  test(`NotificationBanner: ${closeButton} close control has an accessible name`, () => {
    const html = renderComponent("NotificationBanner", {
      closeButton,
      closeLabel: "通知を閉じる",
    });
    getTag(html, "button", { type: "button", "aria-label": "通知を閉じる" });
    assert.equal(tags(html, "button").length, 1);
  });
}

test("NotificationBanner: closed state is omitted and role/live/timestamp overrides are rendered", () => {
  assert.equal(
    matchingTags(
      renderComponent("NotificationBanner", { open: false }),
      "div",
      {
        class: "dads-notification-banner",
      },
    ).length,
    0,
  );
  const html = renderComponent("NotificationBanner", {
    type: "error",
    role: "status",
    ariaLive: "polite",
    timestamp: "更新時刻",
    datetime: "2026-10-03T12:00:00+09:00",
  });
  getTag(html, "div", {
    class: "dads-notification-banner",
    role: "status",
    "aria-live": "polite",
  });
  assert.equal(
    text(
      element(html, "time", { datetime: "2026-10-03T12:00:00+09:00" }).inner,
    ),
    "更新時刻",
  );
});
