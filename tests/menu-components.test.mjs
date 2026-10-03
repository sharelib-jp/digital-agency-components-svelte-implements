import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createComponentTestHarness } from "./component-test-helpers.mjs";

let harness;
before(async () => {
  harness = await createComponentTestHarness();
});
after(async () => {
  await harness?.cleanup();
});

function tags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "g"))].map(
    (match) => match[0],
  );
}
function attribute(tag, name) {
  const match = tag.match(new RegExp(`(?:\\s)${name}="([^"]*)"`));
  return match?.[1];
}
function itemTag(html, id) {
  return [...tags(html, "a"), ...tags(html, "button")].find(
    (tag) => attribute(tag, "data-item-id") === id,
  );
}

for (const name of ["MenuList", "MenuListBox"]) {
  for (const generate of ["client", "server"]) {
    test(`${name}: ${generate} compiles without warnings`, () => {
      assert.deepEqual(harness.warnings(name, generate), []);
    });
  }
}

test("MenuList: native links and actions, defaults, escaping and attribute forwarding", () => {
  const html = harness.render("MenuList", {
    id: "navigation",
    label: "ページ",
    Class: "custom",
    "data-fixture": "menu",
    items: [
      { id: "link", label: "<資料>", href: "/docs?a=1&b=2" },
      { id: "action", label: "更新" },
    ],
  });
  assert.equal(attribute(tags(html, "ul")[0], "role"), "list");
  assert.equal(attribute(tags(html, "ul")[0], "aria-label"), "ページ");
  assert.equal(attribute(tags(html, "ul")[0], "data-fixture"), "menu");
  assert.match(
    attribute(tags(html, "ul")[0], "class"),
    /dads-menu-list.*custom/,
  );
  assert.equal(attribute(itemTag(html, "link"), "href"), "/docs?a=1&amp;b=2");
  assert.match(html, /&lt;資料(?:&gt;|>)/);
  assert.match(itemTag(html, "action"), /^<button\b/);
  assert.equal(attribute(itemTag(html, "action"), "type"), "button");
  assert.equal(attribute(itemTag(html, "link"), "data-type"), "standard");
  assert.equal(attribute(itemTag(html, "link"), "data-size"), "regular");
});

test("MenuList: selectedId overrides current flags; links and actions have appropriate current semantics", () => {
  const items = [
    { id: "one", label: "資料", href: "/docs", current: true },
    { id: "two", label: "更新", current: true },
  ];
  const initial = harness.render("MenuList", { items });
  assert.equal(attribute(itemTag(initial, "one"), "aria-current"), "page");
  assert.equal(attribute(itemTag(initial, "two"), "aria-current"), "true");
  const selected = harness.render("MenuList", { items, selectedId: "two" });
  assert.equal(attribute(itemTag(selected, "one"), "data-current"), undefined);
  assert.equal(attribute(itemTag(selected, "two"), "data-current"), "");
  const missing = harness.render("MenuList", { items, selectedId: "missing" });
  assert.equal(attribute(itemTag(missing, "two"), "data-current"), undefined);
});

test("MenuList: source children stay visible, recurse, and inherit size/type/current/indentation", () => {
  const html = harness.render("MenuList", {
    type: "box",
    size: "small",
    selectedId: "leaf",
    indentation: 1,
    items: [
      {
        id: "parent",
        label: "情報",
        children: [
          {
            id: "child",
            label: "資料",
            children: [{ id: "leaf", label: "詳細", href: "/detail" }],
          },
        ],
      },
    ],
  });
  assert.equal(tags(html, "ul").length, 3);
  assert.equal(attribute(itemTag(html, "parent"), "data-expanded"), "");
  assert.equal(attribute(itemTag(html, "leaf"), "data-type"), "box");
  assert.equal(attribute(itemTag(html, "leaf"), "data-size"), "small");
  assert.equal(attribute(itemTag(html, "leaf"), "aria-current"), "page");
  assert.match(
    attribute(tags(html, "ul")[2], "style"),
    /--menu-list-indentation: 3/,
  );
  assert.match(html, /dads-menu-list__end-icon/);
  assert.doesNotMatch(html, /\shidden(?:=""|\s|>)/);
});

test("MenuList: disabled links lose href; disabled actions and descendants are unavailable", () => {
  const html = harness.render("MenuList", {
    items: [
      { id: "link", label: "リンク", href: "/blocked", disabled: true },
      {
        id: "parent",
        label: "親",
        disabled: true,
        children: [{ id: "child", label: "子" }],
      },
    ],
  });
  assert.equal(attribute(itemTag(html, "link"), "href"), undefined);
  for (const id of ["link", "parent", "child"]) {
    assert.equal(attribute(itemTag(html, id), "aria-disabled"), "true");
    assert.equal(attribute(itemTag(html, id), "tabindex"), "-1");
  }
  assert.match(itemTag(html, "child"), /\sdisabled(?:=""|\s|>)/);
});

test("MenuList: three source icon positions and accessible new-tab indicator", () => {
  const html = harness.render("MenuList", {
    items: [
      {
        id: "icons",
        label: "外部資料",
        href: "https://example.com",
        target: "_blank",
        iconPath: "M0 0h24v24H0z",
        endIconPath: "M0 0h16v16H0z",
      },
    ],
  });
  for (const position of ["front", "tail", "end"])
    assert.match(html, new RegExp(`dads-menu-list__${position}-icon`));
  assert.equal(attribute(itemTag(html, "icons"), "rel"), "noopener noreferrer");
  const tail = tags(html, "svg").find((tag) =>
    attribute(tag, "class")?.includes("__tail-icon"),
  );
  assert.equal(attribute(tail, "role"), "img");
  assert.equal(attribute(tail, "aria-label"), "新規タブで開きます");
});

test("MenuList: menu mode has presentation items and one enabled roving tab stop", () => {
  const html = harness.render("MenuList", {
    role: "menu",
    activeId: "second",
    items: [
      { id: "first", label: "先頭" },
      { id: "second", label: "次", href: "/next" },
      { id: "disabled", label: "無効", disabled: true },
    ],
  });
  assert.equal(attribute(tags(html, "ul")[0], "role"), "menu");
  assert.ok(
    tags(html, "li").every((tag) => attribute(tag, "role") === "presentation"),
  );
  assert.equal(attribute(itemTag(html, "second"), "role"), "menuitem");
  assert.equal(attribute(itemTag(html, "second"), "tabindex"), "0");
  assert.equal(attribute(itemTag(html, "first"), "tabindex"), "-1");
  assert.equal(attribute(itemTag(html, "disabled"), "tabindex"), "-1");
});

test("MenuListBox: stable ids, source closed defaults, roles and hidden popup", () => {
  const props = { id: "operations", items: [{ id: "edit", label: "編集" }] };
  const html = harness.render("MenuListBox", props);
  assert.equal(html, harness.render("MenuListBox", props));
  const opener = tags(html, "button").find(
    (tag) => attribute(tag, "id") === "operations-opener",
  );
  assert.equal(attribute(opener, "aria-controls"), "operations-menu");
  assert.equal(attribute(opener, "aria-haspopup"), "menu");
  assert.equal(attribute(opener, "aria-expanded"), "false");
  assert.equal(attribute(opener, "data-size"), "sm");
  assert.equal(attribute(opener, "data-style"), "text");
  assert.equal(attribute(opener, "data-text-weight"), "normal");
  assert.equal(
    attribute(tags(html, "ul")[0], "aria-labelledby"),
    "operations-opener",
  );
  assert.match(
    tags(html, "div").find((tag) =>
      attribute(tag, "class")?.includes("__popup"),
    ),
    /\shidden(?:=""|\s|>)/,
  );
  assert.equal(attribute(itemTag(html, "edit"), "tabindex"), "-1");
  assert.equal(attribute(itemTag(html, "edit"), "data-type"), "box");
});

test("MenuListBox: SSR open state, current item and all opener variants", () => {
  for (const Style of ["text", "outlined", "filled"]) {
    for (const size of ["sm", "md"]) {
      const html = harness.render("MenuListBox", {
        id: "open-menu",
        open: true,
        Style,
        size,
        fontWeight: "bold",
        selectedId: "edit",
        iconPath: "M0 0h24v24H0z",
        items: [
          { id: "blocked", label: "無効", disabled: true },
          { id: "edit", label: "編集" },
        ],
      });
      const opener = tags(html, "button")[0];
      assert.equal(attribute(opener, "aria-expanded"), "true");
      assert.equal(attribute(opener, "data-style"), Style);
      assert.equal(attribute(opener, "data-size"), size);
      assert.equal(attribute(opener, "data-text-weight"), "bold");
      assert.equal(attribute(itemTag(html, "edit"), "data-current"), "");
      assert.equal(attribute(itemTag(html, "edit"), "tabindex"), "0");
      assert.match(html, /dads-menu-list-box__opener-icon/);
      assert.doesNotMatch(
        tags(html, "div").find((tag) =>
          attribute(tag, "class")?.includes("__popup"),
        ),
        /\shidden(?:=""|\s|>)/,
      );
    }
  }
});

test("MenuListBox: disabled forces closed and has no available item tab stops", () => {
  const html = harness.render("MenuListBox", {
    id: "disabled-menu",
    open: true,
    disabled: true,
    items: [{ id: "edit", label: "編集", href: "/edit" }],
  });
  assert.equal(attribute(tags(html, "button")[0], "aria-expanded"), "false");
  assert.match(tags(html, "button")[0], /\sdisabled(?:=""|\s|>)/);
  assert.equal(attribute(itemTag(html, "edit"), "href"), undefined);
  assert.equal(attribute(itemTag(html, "edit"), "tabindex"), "-1");
});

test("MenuListBox: legacy label slot and multiple instances have independent ARIA references", async () => {
  const html = await harness.renderSource(`
    <script>
      import MenuListBox from './MenuListBox.svelte';
    </script>
    <MenuListBox id="one"><span slot="label">操作を選ぶ</span></MenuListBox>
    <MenuListBox id="two" label="その他" />
  `);
  assert.match(html, /操作を選ぶ/);
  assert.equal(attribute(tags(html, "ul")[0], "aria-labelledby"), "one-opener");
  assert.equal(attribute(tags(html, "ul")[1], "aria-labelledby"), "two-opener");
});
