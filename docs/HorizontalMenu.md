# 横並びメニュー（HorizontalMenu）

ページ間の移動や操作項目を横並びに表示するナビゲーションです。子項目を持つ親は開閉ボタンになり、1段のサブメニューを表示します。リンクと、リンク先を持たない操作ボタンを混在できます。

導入と共通CSSの設定は[共通の準備](./README.md#共通の準備)を参照してください。

## 基本的な使い方

リンク項目には `href` を指定します。`bind:selectedId` を使うと、通常の選択操作で更新されるIDを親で受け取れます。

```svelte
<script lang="ts">
  import {
    HorizontalMenu,
    type HorizontalMenuItem,
  } from '@sharelib-jp/digital-agency-components-svelte-implements';

  const items: HorizontalMenuItem[] = [
    { id: 'overview', label: '概要', href: '/overview' },
    { id: 'services', label: 'サービス', href: '/services' },
    { id: 'contact', label: 'お問い合わせ', href: '/contact' },
  ];
  let selectedId: string | null = 'overview';
</script>

<HorizontalMenu label="主要ページ" {items} bind:selectedId />
```

## Props

すべて省略可能です。

| Prop         | 型                     | 既定値             | 必須   | 説明                                                                         |
| ------------ | ---------------------- | ------------------ | ------ | ---------------------------------------------------------------------------- |
| `items`      | `HorizontalMenuItem[]` | `[]`               | いいえ | 最上位の項目。子項目は各項目の `children` に指定。                           |
| `label`      | `string`               | `'メインメニュー'` | いいえ | 外側の `nav` の `aria-label`。                                               |
| `selectedId` | `string \| null`       | `null`             | いいえ | 現在項目のID。`null` のときは各項目の `current` を参照。選択時に更新される。 |
| `expandedId` | `string \| null`       | `null`             | いいえ | 開いている親項目のID。`null` なら閉じる。開けるサブメニューは1つだけ。       |
| `disabled`   | `boolean`              | `false`            | いいえ | 全項目を無効にし、開いているサブメニューを閉じる。                           |

## 使用例

### 子項目を操作ボタンにし、選択を取り消す

`href` を省略した子項目は `type="button"` のボタンになります。`select` を取り消した場合は選択IDも開閉状態も更新されません。この例では許可されていないときだけ集計項目の選択を止めます。

```svelte
<script lang="ts">
  import {
    HorizontalMenu,
    type HorizontalMenuItem,
    type HorizontalMenuSelectDetail,
  } from '@sharelib-jp/digital-agency-components-svelte-implements';

  const items: HorizontalMenuItem[] = [
    { id: 'dashboard', label: 'ダッシュボード' },
    {
      id: 'tools',
      label: '操作',
      children: [
        { id: 'edit', label: '編集' },
        { id: 'reports', label: '集計' },
        { id: 'unavailable', label: '準備中', disabled: true },
      ],
    },
  ];
  let selectedId: string | null = 'dashboard';
  let expandedId: string | null = null;
  let allowReports = false;
  let message = '';

  function handleSelect(event: CustomEvent<HorizontalMenuSelectDetail>) {
    if (event.detail.id === 'reports' && !allowReports) {
      event.preventDefault();
      message = '集計を選ぶには許可のチェックを入れてください。';
      return;
    }
    message = `${event.detail.item.label}を選択しました。`;
  }
</script>

<label>
  <input type="checkbox" bind:checked={allowReports} />
  集計の選択を許可
</label>
<HorizontalMenu
  label="操作の選択"
  {items}
  bind:selectedId
  bind:expandedId
  on:select={handleSelect}
/>
<p>選択ID：{selectedId ?? '未選択'}／開いている親：{expandedId ?? 'なし'}</p>
<p aria-live="polite">{message}</p>
```

### 子ページの現在地とサブメニューの開閉を表示する

子項目が現在地なら、その親にも現在地の装飾が付きます。`toggle` は開いた親・閉じた親の状態を通知します。

```svelte
<script lang="ts">
  import {
    HorizontalMenu,
    type HorizontalMenuItem,
  } from '@sharelib-jp/digital-agency-components-svelte-implements';

  const items: HorizontalMenuItem[] = [
    { id: 'home', label: 'ホーム', href: '/' },
    {
      id: 'information',
      label: '情報',
      children: [
        { id: 'notices', label: 'お知らせ', href: '/notices' },
        { id: 'documents', label: '資料', href: '/documents' },
        { id: 'archive', label: '過去の資料', href: '/archive', disabled: true },
      ],
    },
  ];
  let selectedId: string | null = 'documents';
  let expandedId: string | null = null;
  let lastToggle = '';

  function handleToggle(event: CustomEvent<{ id: string; expanded: boolean }>) {
    lastToggle = `${event.detail.id}：${event.detail.expanded ? '開いた' : '閉じた'}`;
  }
</script>

<HorizontalMenu
  label="情報へのナビゲーション"
  {items}
  bind:selectedId
  bind:expandedId
  on:toggle={handleToggle}
/>
<p aria-live="polite">{lastToggle}</p>
```

## 型・bind・イベント・スロット

### 公開型と項目

`HorizontalMenuItem`・`HorizontalMenuLinkItem`・`HorizontalMenuSelectDetail` はパッケージルートから名前付きで `import type` できます。

`HorizontalMenuLinkItem` の全フィールドは次のとおりです。`HorizontalMenuItem` はこれらを継承し、`children` を追加します。

| フィールド    | 型                         | 必須   | 説明                                                                                                     |
| ------------- | -------------------------- | ------ | -------------------------------------------------------------------------------------------------------- |
| `id`          | `string`                   | はい   | 項目ID。選択・開閉・描画キーに使用。                                                                     |
| `label`       | `string`                   | はい   | 表示文言。親ではサブメニューの `aria-label` にも使用。                                                   |
| `href`        | `string`                   | いいえ | `undefined` でなければリンク、未指定なら操作ボタン。空文字もリンク扱い。子項目のある親では使用されない。 |
| `current`     | `boolean`                  | いいえ | `selectedId === null` の場合の現在地フラグ。省略時は現在地でない。                                       |
| `disabled`    | `boolean`                  | いいえ | この項目を無効にする。省略時は有効。                                                                     |
| `iconPath`    | `string`                   | いいえ | 前方の装飾SVGの `path` の `d`。空または未指定なら描画しない。                                            |
| `iconViewBox` | `string`                   | いいえ | 装飾SVGの `viewBox`。未指定時は `'0 0 24 24'`。                                                          |
| `children`    | `HorizontalMenuLinkItem[]` | いいえ | `HorizontalMenuItem` のみ。空でなければ親を開閉ボタンにする。孫項目は公開型にない。                      |

`selectedId` が `null` でなければ、すべての `current` フラグよりID一致が優先されます。子が現在地の親には `aria-current="true"`、現在地の末端項目には `aria-current="page"` が付きます。サブメニューの現在項目には `data-current` も付きます。

### bindとネイティブ転送

- `bind:selectedId`：選択が受け入れられた後のIDを受け取ります。リンクでも遷移完了を待たずに更新されます。
- `bind:expandedId`：開閉操作、外側への移動、選択に伴う閉じる処理、無効状態への補正を受け取ります。
- `expandedId` が存在しない親・子のない項目・無効な親を指す場合、または全体が `disabled` の場合は `null` に補正されます。`selectedId` には対応する補正はありません。
- 公開propは通常のSvelteの `export let` です。フォーカス移動用の公開メソッドや内部DOMを受け取るpropはありません。
- `$$restProps` による任意属性の転送と、ネイティブ `click`・`keydown` などのイベント転送はありません。リンクの `target`・`rel` を指定する項目フィールドもありません。

### イベント

| イベント | detail                              | cancelable | 説明                                                                   |
| -------- | ----------------------------------- | ---------- | ---------------------------------------------------------------------- |
| `select` | `HorizontalMenuSelectDetail`        | はい       | 子項目のない最上位項目、または子項目の通常の選択時。状態更新前に発火。 |
| `toggle` | `{ id: string; expanded: boolean }` | いいえ     | 内部の開閉処理による変更後に発火。公開された専用detail型はありません。 |

`HorizontalMenuSelectDetail` の全フィールドは次のとおりです。

| フィールド      | 型                       | 内容                                    |
| --------------- | ------------------------ | --------------------------------------- |
| `id`            | `string`                 | 選択しようとしている項目のID。          |
| `item`          | `HorizontalMenuLinkItem` | 選択しようとしている項目。              |
| `parentId`      | `string \| null`         | 子項目なら親ID、最上位項目なら `null`。 |
| `originalEvent` | `MouseEvent`             | 元のclickイベント。                     |

- `select` の `event.preventDefault()` は、`selectedId` の更新・サブメニューを閉じる処理・リンクの既定遷移をすべて止めます。
- `event.detail.originalEvent.preventDefault()` だけを呼ぶ場合はネイティブ遷移を止めますが、カスタムイベント自体は取り消されないので内部の選択更新と閉じる処理は続きます。
- 選択が受け入れられると `selectedId` を更新してサブメニューを閉じます。リンク先のない子ボタンでは、閉じた親ボタンへフォーカスを戻します。
- 元のclickが既に取り消されている、左ボタン以外、またはMeta／Ctrl／Shift／Alt付きなら `select` と状態更新を行いません。有効なリンクではブラウザーの修飾キー付き操作を妨げません。
- 子項目のある親を押す操作は開閉だけで、`select` は発火しません。
- `toggle` は親を切り替えた場合、旧親の `{ expanded: false }`、新親の `{ expanded: true }` の順に通知します。親からの `expandedId` の直接代入や、不正な展開IDを `null` にするリアクティブな補正では発火しません。`toggle` を取り消して開閉を止めることはできません。
- 無効な項目の選択では `select` を発火しません。カスタムイベントはDOMをbubbleしないので、コンポーネントに直接ハンドラーを付けてください。

### スロットとキーボード操作

スロットはありません。表示内容は `items` のフィールドで指定します。

| 操作場所           | キー      | 動作                                                                       |
| ------------------ | --------- | -------------------------------------------------------------------------- |
| 最上位項目         | 左／右    | 有効な最上位項目へ循環してフォーカス移動。開いているサブメニューは閉じる。 |
| 最上位項目         | Home／End | 有効な最上位項目の先頭／末尾へ移動。サブメニューは閉じる。                 |
| 子を持つ親         | 下／上    | サブメニューを開き、有効な子の先頭／末尾へ移動。                           |
| サブメニュー内     | 下／上    | 有効な子項目間を循環して移動。                                             |
| サブメニュー内     | Home／End | 有効な子の先頭／末尾へ移動。                                               |
| メニュー内で展開中 | Escape    | 閉じて親へフォーカスを戻す。                                               |

開いた親項目の外側へのpointerdownまたはfocusinでも閉じます。クリックで開いた際に子へフォーカスを移す処理はなく、下／上キーで開いた場合に移します。ネイティブのTabやリンク／ボタンの起動操作も使えます。

## 注意点

- `id` は親・子を通じて識別できる一意な値にしてください。`selectedId` に存在しない値を指定しても自動選択はされず、現在地の表示がなくなります。
- `selectedId === null` では `current` の付いた項目をすべて現在地と扱います。単一の現在地にしたい場合は利用側でフラグを管理してください。
- 非空の `children` を持つ親は必ず開閉ボタンです。親に `href` を付けても遷移しません。リンク先は子項目へ設定してください。
- 無効なリンクは `href` が外れ、`aria-disabled="true"` と `tabindex="-1"` が付きます。リンク先なしの項目や親ボタンはネイティブの `disabled` で無効になります。
- 現在地はURLから自動判定されません。ページ読み込み時やURL変更時の `selectedId`・`current` は利用側で設定します。リンクの選択によるID更新は、遷移先が実際に表示されたことを保証しません。
- `nav` とリストを使うナビゲーションで、ARIAの `menu`／`menubar` ウィジェットではありません。アイコンは `aria-hidden` の装飾なので、項目の意味を `label` で伝えてください。
- CSSは横並びで、サブメニューを親の直下に絶対配置します。モバイル用の別メニュー、折り返し制御、画面端に応じたサブメニュー位置補正、ルーター連携、reset APIはありません。
