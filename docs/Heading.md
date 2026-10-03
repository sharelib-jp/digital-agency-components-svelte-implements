# 見出し（Heading）

文書の見出しを表示します。見出しの階層を表す `level` と、見た目の文字サイズを表す `size` を独立して選べます。ショルダー（見出しの上に置く補助テキスト）、左側のチップ、アイコン、下線を追加できます。

導入と共通CSSの設定は[共通の準備](./README.md#共通の準備)を参照してください。

## 基本的な使い方

`level` はHTMLの見出し要素、`size` は文字列で指定する表示サイズです。未指定では `<h2>` と `'36'` になります。

```svelte
<script lang="ts">
  import { Heading } from '@sharelib-jp/digital-agency-components-svelte-implements';
</script>

<Heading id="heading-procedure-basic" level="h2" size="36" text="申請手続き" />
<p>申請に必要な書類と手続きの流れをご案内します。</p>
```

## Props

すべて任意です。ただし `text` またはデフォルトslotで、内容のある見出しを指定してください。

| Prop       | 型                                                                             | 必須   | デフォルト  | 説明                                                                   |
| ---------- | ------------------------------------------------------------------------------ | ------ | ----------- | ---------------------------------------------------------------------- |
| `level`    | `'h1' \| 'h2' \| 'h3' \| 'h4' \| 'h5' \| 'h6'`                                 | いいえ | `'h2'`      | 内部の見出し要素。                                                     |
| `size`     | `'64' \| '57' \| '45' \| '36' \| '32' \| '28' \| '24' \| '20' \| '18' \| '16'` | いいえ | `'36'`      | 見出しの表示サイズ。数値ではなく文字列を指定します。                   |
| `text`     | `string`                                                                       | いいえ | `''`        | 見出しテキスト。デフォルトslotが優先されます。                         |
| `shoulder` | `string \| null`                                                               | いいえ | `null`      | 見出しの上に置く補助テキスト。shoulder slotが優先されます。            |
| `chip`     | `boolean`                                                                      | いいえ | `false`     | 左側に縦長のチップを表示します。                                       |
| `icon`     | `boolean`                                                                      | いいえ | `false`     | 見出し先頭に既定のSVGアイコンを表示します。icon slotでも表示できます。 |
| `rule`     | `'8' \| '6' \| '4' \| '2' \| undefined`                                        | いいえ | `undefined` | 見出し領域の下線の太さ。未指定では下線なし。                           |
| `id`       | `string \| undefined`                                                          | いいえ | `undefined` | 内部の `<h1>`〜`<h6>` に設定するID。外側の要素には付きません。         |
| `Class`    | `string`                                                                       | いいえ | `''`        | 外側の要素に追加するクラス。大文字の `C` です。                        |

`HeadingLevel` / `HeadingSize` は内部の型名で、パッケージルートからは公開されていません。表の文字列リテラルを指定してください。

### 表示バリエーション

- `size` の値は `calc(値 / 16 * 1rem)` に対応します。すべて太字です。サイズに合わせて行高・字間・ショルダーのサイズも変わります。見出し階層は変化しません。
- `shoulder` が空でない、またはshoulder slotがあるときは外側が `<hgroup>`、それ以外は `<div>` になります。ショルダーはその中の `<p>` です。
- `chip`、`icon`、`rule` は組み合わせて使用できます。icon slotがあれば `icon={false}` でもアイコン領域を表示します。

| `rule` | 下線の太さ            | 下線までの下側余白     |
| ------ | --------------------- | ---------------------- |
| `'8'`  | `calc(8 / 16 * 1rem)` | `calc(32 / 16 * 1rem)` |
| `'6'`  | `calc(6 / 16 * 1rem)` | `calc(24 / 16 * 1rem)` |
| `'4'`  | `calc(4 / 16 * 1rem)` | `calc(16 / 16 * 1rem)` |
| `'2'`  | `calc(2 / 16 * 1rem)` | `calc(8 / 16 * 1rem)`  |

## 使用例

### 文書階層と表示サイズを別々に指定する

`level` は文書構造に合わせて選び、`size` は画面のレイアウトに合わせて選びます。文字を小さくしたいという理由だけで `h2` を `h3` に変更しないでください。

```svelte
<script lang="ts">
  import { Heading } from '@sharelib-jp/digital-agency-components-svelte-implements';
</script>

<Heading id="heading-guide-page" level="h1" size="45" text="手続きガイド" />
<p>オンライン申請を始める前にご確認ください。</p>

<section aria-labelledby="heading-guide-documents">
  <Heading id="heading-guide-documents" level="h2" size="28" text="必要な書類" />
  <p>本人確認書類と申請書をご用意ください。</p>

  <section aria-labelledby="heading-guide-identity">
    <Heading id="heading-guide-identity" level="h3" size="20" text="本人確認書類" />
    <p>有効期限内の書類を使用してください。</p>
  </section>
</section>
```

### ショルダー・チップ・下線とslotによる見出し

slotの内容は既存の見出し・ショルダー要素の中に入ります。追加の見出し要素ではなく、テキストやインライン要素を渡します。

```svelte
<script lang="ts">
  import { Heading } from '@sharelib-jp/digital-agency-components-svelte-implements';
</script>

<Heading id="heading-support-decorated" level="h2" size="32" chip rule="4">
  <span slot="shoulder">オンラインで手続きをする方へ</span>
  <svg slot="icon" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="currentColor" />
    <path d="M11 7h2v2h-2zm0 4h2v6h-2z" fill="white" />
  </svg>
  申請前の<strong>確認事項</strong>
</Heading>

<p>送信前に入力内容と添付書類を確認してください。</p>
```

## slots

| Slot       | slot props | 挿入先・フォールバック                                                                    |
| ---------- | ---------- | ----------------------------------------------------------------------------------------- |
| デフォルト | なし       | `level` で指定した見出し要素の中。未指定時は `text`。                                     |
| `shoulder` | なし       | 見出しの前の `<p>` の中。未指定時は `shoulder`。                                          |
| `icon`     | なし       | 見出し先頭の `<span aria-hidden="true">` の中。未指定で `icon={true}` の場合は既定のSVG。 |

アイコンは装飾として支援技術から隠されます。意味を持つ情報はアイコンだけにせず、見出しテキストにも含めてください。

## 注意点

- 文書の見出し階層に合わせて `level` を設定してください。コンポーネントは階層の整合性や見出しの空欄を検証しません。
- `size` と `rule` は文字列です。`size={36}` や `rule={4}` ではなく `size="36"` / `rule="4"` を指定します。
- `id` は見出し自体に付くため、アンカーリンクや `aria-labelledby` の参照先として使えます。同じページで重複しないIDを指定してください。
- ショルダーは別の見出しではありません。主題が伝わる見出しテキストを省略しないでください。
- icon slot内に操作ボタンやリンクなどを置かないでください。領域全体が `aria-hidden="true"` です。
- 未宣言の属性は `$$restProps` により外側の `<div>` / `<hgroup>` に渡されます。内部の見出し要素に任意属性を転送するAPIはありません。追加クラスには `Class` を使います。
- 公開イベントや状態を更新するbind APIはありません。DOMイベントもコンポーネントから転送していません。
