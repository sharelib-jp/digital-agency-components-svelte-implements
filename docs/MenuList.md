# メニューリスト（MenuList）

リンクと操作ボタンを縦に並べるリストです。HTML版の標準／矩形、通常／小サイズ、3種類のアイコン、現在項目と親のハイライトを移植しています。子項目はHTML版の子メニュー例と同じく常時表示されます。開閉するメニューには[MenuListBox](./MenuListBox.md)を使います。

導入と共通CSSの設定は[共通の準備](./README.md#共通の準備)を参照してください。

## 基本的な使い方

```svelte
<script lang="ts">
  import { MenuList, type MenuListItem } from '@sharelib-jp/digital-agency-components-svelte-implements';

  const items: MenuListItem[] = [
    { id: 'overview', label: '概要', href: '/overview' },
    { id: 'documents', label: '資料', href: '/documents' },
    { id: 'refresh', label: '更新' },
  ];
  let selectedId: string | null = 'overview';
</script>

<nav aria-label="関連ページ">
  <MenuList {items} bind:selectedId />
</nav>
```

`href` がある項目はネイティブの `<a>`、ない項目は `type="button"` のボタンです。URLから現在地を自動判定しないため、初期の `selectedId` は利用側で設定します。

## Props

すべて省略可能です。

| Prop          | 型                     | 既定値       | 説明                                                                                            |
| ------------- | ---------------------- | ------------ | ----------------------------------------------------------------------------------------------- |
| `id`          | `string \| undefined`  | `undefined`  | ルートの `ul` のID。                                                                            |
| `items`       | `MenuListItem[]`       | `[]`         | 表示項目。再帰的な `children` に対応。                                                          |
| `label`       | `string \| undefined`  | `undefined`  | `ul` の `aria-label`。必要に応じて指定。                                                        |
| `type`        | `'standard' \| 'box'`  | `'standard'` | 項目の `data-type`。角丸／矩形。                                                                |
| `size`        | `'regular' \| 'small'` | `'regular'`  | 項目の `data-size`。通常／小。                                                                  |
| `selectedId`  | `string \| null`       | `null`       | 現在項目。`null` なら各項目の `current` を使用。`bind:selectedId` 対応。                        |
| `disabled`    | `boolean`              | `false`      | 全項目と子孫を無効にする。                                                                      |
| `indentation` | `number`               | `0`          | `--menu-list-indentation` の値。子リストでは1ずつ増える。                                       |
| `role`        | `'list' \| 'menu'`     | `'list'`     | 通常のリスト、またはMenuListBoxで使うARIAメニュー。                                             |
| `activeId`    | `string \| null`       | `null`       | `role="menu"` のとき `tabindex="0"` にする有効な項目のID。他は `-1`。通常リストには影響しない。 |
| `Class`       | `string`               | `''`         | ルートに追加するクラス。大文字の `C`。                                                          |

追加属性は `$$restProps` からルートの `ul` に転送します（例：`aria-labelledby`、`data-*`）。管理対象の `id`・`class`・`role`・`aria-label` はpropsが優先されます。`style` は保持し、末尾に `--menu-list-indentation` を追加します。ネイティブイベントの転送はありません。

## 子項目・アイコンの例

以下は単独で使える例です。親の選択は開閉ではなく通常の選択で、子項目は隠れません。親に `href` を指定することもできます。

```svelte
<script lang="ts">
  import { MenuList, type MenuListItem } from '@sharelib-jp/digital-agency-components-svelte-implements';

  const items: MenuListItem[] = [
    {
      id: 'information', label: '情報',
      children: [
        { id: 'notices', label: 'お知らせ', href: '/notices' },
        {
          id: 'guide', label: '外部ガイド', href: 'https://example.com/guide', target: '_blank',
          iconPath: 'M4 3h16v18H4z',
        },
        { id: 'archive', label: '準備中', disabled: true },
      ],
    },
  ];
  let selectedId: string | null = 'notices';
</script>

<MenuList label="情報一覧" {items} size="small" type="box" bind:selectedId />
```

現在の子孫を持つ親にはCSSの `:has()` で薄いハイライトが付きます。子を持つ項目には `data-expanded` と既定の末尾矢印が付きます。常時表示のため、折りたたみ操作を示す `aria-expanded` は付けません。

## 型と項目フィールド

`MenuListLinkItem`・`MenuListItem`・`MenuListSelectDetail` はパッケージルートから `import type` できます。`MenuListItem` は `MenuListLinkItem` を継承し、`children` を追加します。

| フィールド        | 型               | 必須／省略時        | 説明                                                                                                         |
| ----------------- | ---------------- | ------------------- | ------------------------------------------------------------------------------------------------------------ |
| `id`              | `string`         | 必須                | 項目ID。親・子孫を通じて一意にする。                                                                         |
| `label`           | `string`         | 必須                | 表示文言。HTMLではなく文字列として描画。                                                                     |
| `href`            | `string`         | 任意／なし          | 指定時はリンク。空文字列もリンク扱い。                                                                       |
| `target`          | `string`         | 任意／なし          | リンクの `target`。`'_blank'` なら新規タブアイコンも表示。                                                   |
| `rel`             | `string`         | 任意                | `target="_blank"` で未指定なら `'noopener noreferrer'`、それ以外はなし。                                     |
| `current`         | `boolean`        | 任意／`false`       | `selectedId === null` の場合の現在項目フラグ。                                                               |
| `disabled`        | `boolean`        | 任意／`false`       | この項目とその子孫を無効化。                                                                                 |
| `iconPath`        | `string`         | 任意／なし          | 前方の装飾SVGの `path`。                                                                                     |
| `iconViewBox`     | `string`         | 任意／`'0 0 24 24'` | 前方アイコンの `viewBox`。表示サイズ24×24。                                                                  |
| `tailIconPath`    | `string`         | 任意／なし          | ラベル直後のSVGの `path`。`_blank` の場合は未指定でも既定アイコンを表示。                                    |
| `tailIconViewBox` | `string`         | 任意／`'0 0 48 48'` | ラベル直後のアイコンの `viewBox`。表示サイズ16×16。                                                          |
| `tailIconLabel`   | `string`         | 任意                | 非空なら `role="img"` と読み上げ名を設定。`_blank` では未指定時 `'新規タブで開きます'`、それ以外は装飾扱い。 |
| `endIconPath`     | `string`         | 任意／なし          | 項目右端の装飾SVGの `path`。子がある場合は未指定でも矢印を表示。                                             |
| `endIconViewBox`  | `string`         | 任意／`'0 0 24 24'` | 右端アイコンの `viewBox`。表示サイズ16×16。                                                                  |
| `children`        | `MenuListItem[]` | 任意／なし          | `MenuListItem` のみ。再帰的な子リスト。空配列は子なし。                                                      |

前方・右端のアイコンは `aria-hidden="true"` の装飾です。項目の意味は `label` で伝えてください。

`selectedId !== null` なら `current` よりID一致が優先されます。現在項目には `data-current` と、リンクでは `aria-current="page"`、操作では `aria-current="true"` が付きます。存在しないIDは自動補正せず、現在地表示がなくなります。

## 選択の取消

```svelte
<script lang="ts">
  import { MenuList, type MenuListSelectDetail } from '@sharelib-jp/digital-agency-components-svelte-implements';

  let selectedId: string | null = null;
  let allowed = false;
  const items = [{ id: 'report', label: 'レポート', href: '/report' }];

  function select(event: CustomEvent<MenuListSelectDetail>) {
    if (!allowed) event.preventDefault();
  }
</script>

<label><input type="checkbox" bind:checked={allowed} />移動を許可する</label>
<MenuList {items} bind:selectedId on:select={select} />
```

| イベント | detail                 | cancelable | タイミング                              |
| -------- | ---------------------- | ---------- | --------------------------------------- |
| `select` | `MenuListSelectDetail` | はい       | 有効な項目の通常click時、選択ID更新前。 |

`MenuListSelectDetail` のフィールド：

- `id: string`：選択対象のID。
- `item: MenuListItem`：元の項目オブジェクト。
- `parentId: string | null`：直近の親ID。最上位なら `null`。
- `originalEvent: MouseEvent`：元のclickイベント。

`event.preventDefault()` は選択ID更新とリンクの既定遷移を両方止めます。子孫からの選択もルートへ1回だけ通知され、同じ取消処理が適用されます。`originalEvent.preventDefault()` だけならリンク遷移のみを止め、選択IDは更新します。

既に取り消されたclick、左ボタン以外、Meta／Ctrl／Shift／Alt付きclickでは `select` を発火せず、状態も更新しません。無効項目のリンクは `href` が外れ、`aria-disabled="true"` と `tabindex="-1"` が付きます。操作ボタンにはネイティブ `disabled` が付きます。

## スロット・キーボード・制約

- スロットと公開メソッドはありません。内容は `items` で指定します。
- 通常リストはネイティブのTab、リンクのEnter、ボタンのEnter／Spaceで操作します。独自の矢印キー処理はありません。
- `role="menu"` は平坦な項目に限定してください。`activeId` はTab順を設定するだけで、フォーカス移動・開閉・キーボード制御は実装しません。通常はMenuListBox経由で使用します。
- フォームの選択入力／`role="listbox"` ではありません。フォーム送信、ルーター連携、自動URL判定、子の折りたたみは提供しません。
- インデントは `standard` では左margin、`box` では左paddingに反映します。非負の有限な `indentation` を指定してください。
- カスタムイベントはDOMをbubbleしません。コンポーネントに直接 `on:select` を付けてください。
