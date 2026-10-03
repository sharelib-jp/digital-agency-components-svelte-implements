# 画像（Image）

画像を枠付き・枠なし・リンク付きで表示します。キャプション、レスポンシブ画像の `srcset`、`<picture>` による画像の切り替えに対応しています。

導入と共通CSSの設定は[共通の準備](./README.md#共通の準備)を参照してください。

## 基本的な使い方

`src` と `alt` は必須です。以下を含むすべての画像例のURLは、**利用アプリで画像ファイルを用意して配信するURL**です。パッケージに画像は同梱されていません。URLと画像寸法、代替テキストを実際の画像に合わせて変更してください。

```svelte
<script lang="ts">
  import { Image } from '@sharelib-jp/digital-agency-components-svelte-implements';
</script>

<Image
  id="image-office-basic"
  src="/images/office-entrance.jpg"
  alt="庁舎正面入口の右側にあるスロープ"
  width={960}
  height={640}
  caption="庁舎正面入口。車いすをご利用の方は右側のスロープから入れます。"
/>
```

既定の `type="border"` では画像領域に1pxの枠が付きます。ルートは `<figure>`、キャプションは `<figcaption>` です。

## Props

| Prop           | 型                                   | 必須   | デフォルト  | 説明                                                                                 |
| -------------- | ------------------------------------ | ------ | ----------- | ------------------------------------------------------------------------------------ |
| `src`          | `string`                             | はい   | なし        | `<img>` の画像URL。`sources` 使用時もフォールバックとして必要です。                  |
| `alt`          | `string`                             | はい   | なし        | `<img>` の代替テキスト。内容と用途に応じて利用側が設定します。                       |
| `srcset`       | `string \| undefined`                | いいえ | `undefined` | `<img>` の候補画像と幅・解像度の指定。                                               |
| `sizes`        | `string \| undefined`                | いいえ | `undefined` | `<img>` の表示幅の指定。`srcset` の幅記述子と組み合わせます。                        |
| `width`        | `number \| undefined`                | いいえ | `undefined` | `<img>` の `width` 属性。画像の幅を数値で指定します。                                |
| `height`       | `number \| undefined`                | いいえ | `undefined` | `<img>` の `height` 属性。画像の高さを数値で指定します。                             |
| `sources`      | `ImageSource[]`                      | いいえ | `[]`        | 空でなければ `<picture>` を生成し、配列順に `<source>` を配置します。                |
| `loading`      | `'eager' \| 'lazy' \| undefined`     | いいえ | `undefined` | `<img>` の読み込み方式。未指定時は属性を付けません。                                 |
| `decoding`     | `'async' \| 'sync' \| 'auto'`        | いいえ | `'auto'`    | `<img>` のデコード方式。                                                             |
| `type`         | `'border' \| 'borderless' \| 'link'` | いいえ | `'border'`  | 枠付き、枠なし、画像領域を `<a>` にするリンク付きの選択。                            |
| `fullWidth`    | `boolean`                            | いいえ | `false`     | `true` で `<figure>` と画像を親領域の幅いっぱいにします。                            |
| `caption`      | `string \| null`                     | いいえ | `null`      | キャプション。空文字・`null` で、caption slotもなければ表示しません。                |
| `captionStyle` | `'dashed' \| 'solid'`                | いいえ | `'dashed'`  | キャプションの囲み線を破線・実線から選びます。                                       |
| `href`         | `string \| undefined`                | いいえ | `undefined` | `type="link"` の場合だけ内部の `<a>` に渡すリンク先。                                |
| `target`       | `HTMLAnchorAttributes['target']`     | いいえ | `undefined` | 内部の `<a>` のリンク先表示先。Svelteのアンカー属性型です。                          |
| `rel`          | `string \| undefined`                | いいえ | `undefined` | 内部の `<a>` の `rel`。`target="_blank"` では `noopener noreferrer` が追加されます。 |
| `Class`        | `string`                             | いいえ | `''`        | ルートの `<figure>` に追加するクラス。大文字の `C` です。                            |

`href`、`target`、`rel` は `type="border"` / `"borderless"` では使用されません。通常の枠なし画像には `type="borderless"` を使います。リンク画像はリンク用の枠とhover・focus表示になります。

### ImageSource

`ImageSource` はパッケージルートから `import type` できます。

| フィールド | 型       | 必須   | 説明                     |
| ---------- | -------- | ------ | ------------------------ |
| `srcset`   | `string` | はい   | `<source>` の候補画像。  |
| `media`    | `string` | いいえ | 適用するメディアクエリ。 |
| `type`     | `string` | いいえ | 画像のMIMEタイプ。       |
| `sizes`    | `string` | いいえ | 候補画像の表示幅。       |
| `width`    | `number` | いいえ | `<source>` の画像幅。    |
| `height`   | `number` | いいえ | `<source>` の画像高さ。  |

省略した任意フィールドは対応する属性を付けません。ブラウザーが採用する候補を配列順に評価するため、条件のある画像を先に配置してください。

## 使用例

### 枠なし・全幅・画像形式の切り替え

WebP画像とJPEGのフォールバックを利用アプリに配置する例です。`sizes` は利用画面のレイアウトに合わせて設定します。

```svelte
<script lang="ts">
  import {
    Image,
    type ImageSource,
  } from '@sharelib-jp/digital-agency-components-svelte-implements';

  const sources: ImageSource[] = [
    {
      type: 'image/webp',
      srcset: '/images/park-640.webp 640w, /images/park-1280.webp 1280w',
      sizes: '(max-width: 48rem) 100vw, 48rem',
    },
  ];
</script>

<Image
  id="image-park-responsive"
  type="borderless"
  fullWidth
  src="/images/park-1280.jpg"
  srcset="/images/park-640.jpg 640w, /images/park-1280.jpg 1280w"
  sizes="(max-width: 48rem) 100vw, 48rem"
  {sources}
  alt="公園中央の芝生広場と、その周囲にある遊歩道"
  width={1280}
  height={720}
  loading="lazy"
  decoding="async"
  caption="公園の利用案内に掲載している芝生広場"
  captionStyle="solid"
/>
```

### リンク付き画像・caption slot・読み込みイベント

リンク画像の `alt` はリンクの目的が分かる内容にします。`target="_blank"` の場合でも、新規タブを開くことを知らせる表示は自動追加されないため、この例では代替テキストとキャプションで知らせます。

```svelte
<script lang="ts">
  import { Image } from '@sharelib-jp/digital-agency-components-svelte-implements';

  let imageState = '読み込み中';
</script>

<Image
  id="image-access-link"
  type="link"
  src="/images/access-map.jpg"
  alt="庁舎へのアクセス案内を開く（新規タブ）"
  width={800}
  height={600}
  href="/access"
  target="_blank"
  captionStyle="solid"
  on:load={() => (imageState = '読み込み完了')}
  on:error={() => (imageState = '画像を読み込めませんでした')}
>
  <span slot="caption">
    <strong>庁舎へのアクセス</strong>：画像を選ぶと案内ページを新規タブで開きます。
  </span>
</Image>

<p aria-live="polite">画像の状態：{imageState}</p>
```

## slots

| Slot      | slot props | 説明                                                                 |
| --------- | ---------- | -------------------------------------------------------------------- |
| `caption` | なし       | `<figcaption>` 内の内容。指定すると `caption` propより優先されます。 |

デフォルトslotはありません。caption slotは画像リンクの外側に配置され、キャプション自体はリンクになりません。

## events

| イベント | 型      | 発生元・抑止                                                          |
| -------- | ------- | --------------------------------------------------------------------- |
| `load`   | `Event` | 内部の `<img>` のネイティブイベントを転送します。キャンセル不可です。 |
| `error`  | `Event` | 内部の `<img>` のネイティブイベントを転送します。キャンセル不可です。 |

`CustomEvent` ではなくDOMイベントです。読み込み失敗時の代替画像・エラーメッセージは自動表示されません。リンクの `click` イベントは転送していません。

## 注意点

- `alt` の内容は利用側の責任です。情報を伝える画像には目的に沿った説明を、純粋な装飾画像には `alt=""` を指定します。画像だけのリンクでは、空の代替テキストにするとリンクの目的が伝わらなくなります。
- キャプションは代替テキストの自動生成には使われません。画像の説明と、補足・出典などのキャプションを用途に応じて書き分けてください。
- `type="link"` には有効な `href` を指定してください。未指定ではリンク先がなく、通常のリンクとして操作できません。
- 画像は `max-width: 100%`、`height: auto` で縦横比を保ちます。`fullWidth` は小さい画像も親幅まで拡大するため、必要な解像度を用意してください。枠はoutlineで、レイアウト上の寸法を増やしません。
- `width` と `height` を実画像の比率に合わせて指定すると、読み込み前の領域を確保できます。初期表示で重要な画像を遅延読み込みにするかどうかは利用画面で判断してください。
- 未宣言の属性（`id`、`aria-*` など）は `$$restProps` によりルートの `<figure>` に渡されます。内部の `<img>` や `<a>` には渡されません。追加クラスは `class` ではなく `Class` を使います。
