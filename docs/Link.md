# リンク（Link）

別のページや文書に移動するテキストリンクです。別タブで開く場合は、そのことを示すアイコンも表示します。

利用前に[共通の準備](./README.md#共通の準備)でデザイントークンを読み込んでください。

## 基本的な使い方

```svelte
<script lang="ts">
    import { Link } from '@sharelib-jp/digital-agency-components-svelte-implements';
</script>

<Link href="/guide" label="利用ガイドを読む" />
```

## Props

| 名前    | 型        | 既定値  | 説明                                                           |
| ------- | --------- | ------- | -------------------------------------------------------------- |
| `href`  | `string`  | `''`    | リンク先 URL。                                                 |
| `label` | `string`  | `''`    | リンクの表示テキスト。                                         |
| `blank` | `boolean` | `false` | `true` で `target="_blank"` と新規タブ用アイコンを設定します。 |

## 使用例

### 別タブで開く

```svelte
<script lang="ts">
    import { Link } from '@sharelib-jp/digital-agency-components-svelte-implements';
</script>

<Link
    href="https://www.digital.go.jp/"
    label="デジタル庁のウェブサイト"
    blank
/>
```

### ページ内の見出しに移動する

```svelte
<script lang="ts">
    import { Link } from '@sharelib-jp/digital-agency-components-svelte-implements';
</script>

<Link href="#contact" label="お問い合わせへ移動する" />
<h2 id="contact">お問い合わせ</h2>
<p>お問い合わせ方法をご案内します。</p>
```

## イベント・スロット

現在の実装にはイベント転送、カスタムイベント、スロットはありません。内容は `label`、遷移先は `href` で指定します。

## 注意点・アクセシビリティ

- `href` と `label` を明示してください。「こちら」だけではなく、リンク先が分かるテキストを使用します。
- `blank` は必要な場合だけ使用してください。新規タブ用アイコンには「新規タブで開きます」というアクセシブルな名前が設定されます。
- `rel`、`target`、`download`、`Class`、`aria-*` などの追加属性は内部の a 要素へ転送されません。`on:click` も転送されません。
- `blank` 使用時も、このコンポーネントは明示的な `rel` 属性を設定しません。`rel="noopener noreferrer"` などを明示したい場合や、追加属性・クリック制御が必要な場合はネイティブの a 要素を使用してください。
- 画像をリンクにする場合は、[画像（Image）](./Image.md)の `type="link"` を検討してください。

[コンポーネント一覧に戻る](./README.md)
