# ページナビゲーション（PageNavigation）

現在ページと総ページ数を表示し、前後1ページへの移動を提供するナビゲーションです。親の状態を更新するボタン方式と、URLへ遷移するリンク方式を選べます。ページ内容の取得や表示は行いません。

導入と共通CSSの設定は[共通の準備](./README.md#共通の準備)を参照してください。

## 基本的な使い方

`hrefForPage` を指定しなければボタン方式です。操作が受け入れられると `currentPage` が更新され、`bind:currentPage` で親へ反映できます。

```svelte
<script lang="ts">
  import { PageNavigation } from '@sharelib-jp/digital-agency-components-svelte-implements';

  let currentPage = 1;
  const totalPages = 5;
</script>

<PageNavigation label="資料一覧のページ" bind:currentPage {totalPages} />
<p>表示するページ：{currentPage}</p>
```

## Props

すべて省略可能です。ただし既定の `totalPages={1}` ではナビゲーション全体を描画しません。

| Prop            | 型                                        | 既定値         | 必須   | 説明                                                                                    |
| --------------- | ----------------------------------------- | -------------- | ------ | --------------------------------------------------------------------------------------- |
| `type`          | `PageNavigationType`                      | `'text'`       | いいえ | `'text'`・`'outline'`・`'arrow'`。前後コントロールの外観。                              |
| `size`          | `PageNavigationSize \| undefined`         | `undefined`    | いいえ | `'lg'`・`'md'`・`'sm'`・`'xs'`。未指定時は `text` が `md`、`outline`／`arrow` が `lg`。 |
| `currentPage`   | `number`                                  | `1`            | いいえ | 現在ページ。範囲内の整数へ補正される。ボタン方式の操作でも更新される。                  |
| `totalPages`    | `number`                                  | `1`            | いいえ | 総ページ数。内部で非負の安全な整数に補正して使用。                                      |
| `disabled`      | `boolean`                                 | `false`        | いいえ | 表示されている前後コントロールを無効にする。カウンターは残る。                          |
| `label`         | `string`                                  | `'ページ'`     | いいえ | 外側の `nav` の `aria-label`。カウンターに付く接頭辞ではない。                          |
| `previousLabel` | `string`                                  | `'前のページ'` | いいえ | 前のページの文言。矢印型では視覚的に非表示のラベル。                                    |
| `nextLabel`     | `string`                                  | `'次のページ'` | いいえ | 次のページの文言。矢印型では視覚的に非表示のラベル。                                    |
| `hrefForPage`   | `((page: number) => string) \| undefined` | `undefined`    | いいえ | 前後の対象ページ番号からURLを返す関数。指定するとリンク方式になる。                     |

## 使用例

### 矢印型で、移動の取り消しと無効状態を扱う

`change` は状態更新前のcancelableイベントです。この例では3ページ目以降への移動を許可制にし、別のチェックでナビゲーション全体を無効にできます。

```svelte
<script lang="ts">
  import {
    PageNavigation,
    type PageNavigationChangeDetail,
    type PageNavigationSize,
    type PageNavigationType,
  } from '@sharelib-jp/digital-agency-components-svelte-implements';

  const type: PageNavigationType = 'arrow';
  const size: PageNavigationSize = 'md';
  let currentPage = 1;
  let disabled = false;
  let allowLaterPages = false;
  let message = '';

  function handleChange(event: CustomEvent<PageNavigationChangeDetail>) {
    if (event.detail.currentPage >= 3 && !allowLaterPages) {
      event.preventDefault();
      message = '3ページ目以降への移動は許可されていません。';
      return;
    }
    message = `${event.detail.previousPage}ページから${event.detail.currentPage}ページへ移動します。`;
  }
</script>

<label>
  <input type="checkbox" bind:checked={allowLaterPages} />
  3ページ目以降への移動を許可
</label>
<label>
  <input type="checkbox" bind:checked={disabled} />
  ページ操作を無効にする
</label>
<PageNavigation
  label="資料一覧のページ"
  {type}
  {size}
  {disabled}
  totalPages={5}
  bind:currentPage
  on:change={handleChange}
/>
<p aria-live="polite">{message}</p>
```

### URLを生成するリンク方式

リンク方式では、通常の選択時に `change` を通知しますが、`currentPage` は内部で更新しません。利用側が表示済みのページに合わせて指定します。この例の `?page=番号` に対応するページ表示処理は利用側で用意してください。

```svelte
<script lang="ts">
  import {
    PageNavigation,
    type PageNavigationChangeDetail,
  } from '@sharelib-jp/digital-agency-components-svelte-implements';

  const currentPage = 2;
  const totalPages = 8;
  let destination = '';

  function hrefForPage(page: number): string {
    return `?page=${page}`;
  }

  function handleChange(event: CustomEvent<PageNavigationChangeDetail>) {
    destination = `${event.detail.currentPage}ページへのリンクを選びました。`;
  }
</script>

<PageNavigation
  type="outline"
  label="検索結果のページ"
  {currentPage}
  {totalPages}
  {hrefForPage}
  on:change={handleChange}
/>
<p aria-live="polite">{destination}</p>
```

## 型・bind・イベント・スロット

### 公開型

次の3型はパッケージルートから名前付きで `import type` できます。

| 型                           | 定義・用途                               |
| ---------------------------- | ---------------------------------------- |
| `PageNavigationType`         | `'text' \| 'outline' \| 'arrow'`。外観。 |
| `PageNavigationSize`         | `'lg' \| 'md' \| 'sm' \| 'xs'`。サイズ。 |
| `PageNavigationChangeDetail` | `change` のdetail。全フィールドは後述。  |

### bind・ページ境界・ネイティブ転送

- `bind:currentPage` は、ボタン方式の受け入れられた操作と、値の補正を親へ反映します。通常のSvelteの `export let` によるbindです。
- `totalPages` が有限数なら、小数部を切り捨てて `0` 以上 `Number.MAX_SAFE_INTEGER` 以下に収めた値を内部の総ページ数に使います。非有限数は内部では `0` です。元の `totalPages` prop自体は書き換えません。
- 内部の総ページ数が `0` なら `currentPage` は `0` になります。それ以外では有限の `currentPage` の小数部を切り捨てて `1` から総ページ数の範囲に収めます。非有限の `currentPage` は `1` として補正します。
- 内部の総ページ数が `0` または `1` なら、`nav`・前後コントロール・カウンターをすべて描画しません。非表示でも `currentPage` の補正は行います。
- 先頭ページでは前のコントロール、末尾ページでは次のコントロールを描画しません。境界のコントロールを無効表示する方式ではありません。
- `$$restProps` による任意属性の転送、ネイティブ `click` などのイベント転送、内部DOMを受け取るpropはありません。リンクの `target`・`rel` を指定するAPIもありません。

### イベント

`on:change` は `CustomEvent<PageNavigationChangeDetail>` を受け取ります。**cancelableです**。受け入れられた操作の状態更新前に発火し、DOMをbubbleしません。

| detailのフィールド | 型                 | 内容                                                             |
| ------------------ | ------------------ | ---------------------------------------------------------------- |
| `currentPage`      | `number`           | 移動先のページ番号。この時点ではコンポーネントの現在値は移動前。 |
| `previousPage`     | `number`           | 移動前のページ番号。                                             |
| `direction`        | `'prev' \| 'next'` | 選んだ方向。                                                     |
| `originalEvent`    | `MouseEvent`       | 元のclickイベント。                                              |

- `event.preventDefault()` は、ボタン方式のページ更新とリンク方式の既定遷移を止めます。
- `event.detail.originalEvent.preventDefault()` だけを呼んだ場合はネイティブ遷移を止めますが、カスタムイベント自体は取り消されません。ボタン方式ならその後の `currentPage` 更新は続きます。
- リンク方式では、イベントが受け入れられても `currentPage` を自動更新しません。遷移先のページが実際に表示されるまで現在ページを保つ実装です。
- 元のclickが既に取り消されている、左ボタン以外、またはMeta／Ctrl／Shift／Alt付きならイベントと状態更新を行いません。有効なリンクではブラウザーの修飾キー付き操作をそのまま使えます。
- `disabled` の場合は既定動作を止めて `change` を発火しません。範囲外への移動も止めます。親からの `currentPage` 変更や値の補正では `change` を発火しません。

### スロットとボタン／リンクの違い

スロットはありません。文言はラベルのpropsで指定します。

| 項目               | ボタン方式                                                     | リンク方式                                             |
| ------------------ | -------------------------------------------------------------- | ------------------------------------------------------ |
| 切り替え           | `hrefForPage` 未指定                                           | `hrefForPage` 指定                                     |
| 要素               | `button type="button"`                                         | `a`                                                    |
| 受け入れられた操作 | `currentPage` を更新                                           | URLへのネイティブ遷移。`currentPage` は更新しない      |
| 無効状態           | ネイティブ `disabled`、`aria-disabled="true"`、`tabindex="-1"` | `href` を外し、`aria-disabled="true"`、`tabindex="-1"` |

## 注意点

- 初期値のまま表示されない場合は、`totalPages` が2以上か確認してください。
- `hrefForPage` は表示する前後のリンクURLを生成するために呼ばれます。通信や状態変更ではなく、ページ番号からURLを返す関数として用意してください。リンクが無効な間は `href` の生成を行いません。
- リンク方式で遷移だけを取り消しても、ページ内容や現在ページを切り替える処理はありません。利用側がURLと表示内容と `currentPage` の整合を管理してください。
- `text` はテキスト、`outline` は枠付き、`arrow` は円形の矢印のみの外観です。矢印型でも `previousLabel`・`nextLabel` は視覚的に非表示のラベルとして残ります。
- カウンターは `aria-live="polite"`・`aria-atomic="true"` を持ちます。総ページ数を日本語ロケールで桁区切りして、`現在 / 総数` の形で表示します。
- ページ番号一覧、先頭／末尾へ直接移動するボタン、`readonly`、reset API、ページ内容の取得、ルーター連携はありません。ボタン方式の現在ページを戻したい場合は親から `currentPage` を設定してください。
