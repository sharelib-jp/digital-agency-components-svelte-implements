# 区切り線（Divider）

コンテンツの区切り線を表示します。意味のある話題の区切りには `<hr>`、見た目だけの装飾には `<div>` を選べます。線の色・種類・太さを変更できます。

導入と共通CSSの設定は[共通の準備](./README.md#共通の準備)を参照してください。

## 基本的な使い方

既定では `<hr>` による意味的な区切りになります。

```svelte
<script lang="ts">
  import { Divider } from '@sharelib-jp/digital-agency-components-svelte-implements';
</script>

<p>窓口での受付は平日の午前9時から午後5時までです。</p>
<Divider id="divider-contact-basic" />
<p>オンラインでの申請は24時間受け付けています。</p>
```

## Props

すべて任意です。

| Prop      | 型                                                | 必須   | デフォルト         | 説明                                                         |
| --------- | ------------------------------------------------- | ------ | ------------------ | ------------------------------------------------------------ |
| `element` | `'hr' \| 'div'`                                   | いいえ | `'hr'`             | 意味的な区切り、または装飾用の要素を選びます。               |
| `color`   | `'solid-gray-420' \| 'solid-gray-536' \| 'black'` | いいえ | `'solid-gray-420'` | 線の色。対応する共通カラートークンを使います。               |
| `style`   | `'solid' \| 'dashed'`                             | いいえ | `'solid'`          | 実線・破線の選択。CSSのインラインstyle文字列ではありません。 |
| `width`   | `'1' \| '2' \| '3' \| '4'`                        | いいえ | `'1'`              | 線の太さ。各値が1〜4pxの `border-top-width` に対応します。   |
| `Class`   | `string`                                          | いいえ | `''`               | 区切り線の要素に追加するクラス。大文字の `C` です。          |

### hrと装飾の使い分け

| `element` | 出力                       | アクセシビリティ                                                        |
| --------- | -------------------------- | ----------------------------------------------------------------------- |
| `'hr'`    | `<hr>`                     | HTML標準の意味的な区切り（separator）です。`aria-hidden` は付けません。 |
| `'div'`   | `<div aria-hidden="true">` | 装飾として支援技術から隠します。意味的な区切りにはなりません。          |

## 使用例

### 見た目だけの区切りを破線にする

同じ話題の中で表示を整理するだけの場合は `element="div"` を指定します。`width` は横幅ではなく、線の太さです。

```svelte
<script lang="ts">
  import { Divider } from '@sharelib-jp/digital-agency-components-svelte-implements';
</script>

<div>
  <p>申請先：市民サービス課</p>
  <Divider
    id="divider-office-decoration"
    element="div"
    color="black"
    style="dashed"
    width="2"
  />
  <p>問い合わせ先：市民サービス課の案内窓口</p>
</div>
```

## 注意点

- 意味のある区切りには `hr` を使い、単なる装飾には `div` を使います。線の太さや色だけでは意味は変わりません。
- `width` は文字列です。`width={2}` ではなく `width="2"` を指定してください。
- `style` は線の種類を選ぶpropです。`style="margin: 1rem"` のようなCSS文字列を渡す用途ではありません。
- 線は上側のborderで描画します。コンポーネントのmarginは `0` なので、前後の余白やレイアウト上の横幅は利用側のレイアウトで調整します。
- 未宣言の属性（`id` など）は `$$restProps` により選択したルート要素に渡されます。追加クラスには `Class` を使います。`aria-hidden` は実装側で `element` に応じて設定されます。
- slots、公開イベント、状態を更新するbind APIはありません。コンテンツやDOMイベントを転送するAPIもありません。
