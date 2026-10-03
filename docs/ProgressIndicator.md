# プログレスインジケーター（ProgressIndicator）

処理中であることと、判明している場合の進捗率を表示します。参照 HTML の円形・線形・静的な砂時計、3 レイアウト、大小の SVG、開始・完了・定期通知を Svelte 5 の legacy API に移植しています。通信や進捗の計測は行いません。

## 基本例：確定進捗

共通トークンの CSS はアプリケーション全体で一度読み込みます。以下の例はそれぞれ独立したコンポーネントとして使用できます。

```svelte
<script lang="ts">
  import ProgressIndicator from '@sharelib-jp/digital-agency-components-svelte-implements/components/ProgressIndicator.svelte';
  import '@sharelib-jp/digital-agency-components-svelte-implements/global.css';

  let value = 30;
</script>

<label>送信率 <input type="range" min="0" max="100" bind:value /></label>
<ProgressIndicator shape="linear" label="送信中" {value} />
```

`value` が有限数なら Fill モード、`null`・`undefined`・非有限数なら Loop モードです。`value={0}` は不確定ではなく 0% です。

## 不確定進捗と明示的な操作の通知

```svelte
<script lang="ts">
  import ProgressIndicator from '@sharelib-jp/digital-agency-components-svelte-implements/components/ProgressIndicator.svelte';
  import '@sharelib-jp/digital-agency-components-svelte-implements/global.css';

  let active = false;
</script>

<button type="button" on:click={() => active = !active}>
  {active ? '処理を終了' : '処理を開始'}
</button>
<ProgressIndicator
  shape="circular"
  type="stacked-underlay"
  intent="explicit"
  {active}
  value={null}
  label="資料を作成中"
  announceInterval={10}
  announceStart="資料の作成を開始しました"
  announceEnd="資料の作成が完了しました"
  announceLong="資料を作成中です"
/>
```

`active={false}` でインジケーターを非表示にします。完了通知を届けるため、終了時はコンポーネントを直ちに `{#if}` で削除せず `active` を切り替えてください。静的表示なら `shape="static"` を使います。

## 独自の範囲・読み上げ文言・小さな静的表示

```svelte
<script lang="ts">
  import ProgressIndicator, {
    type ProgressIndicatorShape,
    type ProgressIndicatorType,
    type ProgressIndicatorSize,
    type ProgressIndicatorIntent,
  } from '@sharelib-jp/digital-agency-components-svelte-implements/components/ProgressIndicator.svelte';
  import '@sharelib-jp/digital-agency-components-svelte-implements/global.css';

  const shape: ProgressIndicatorShape = 'static';
  const type: ProgressIndicatorType = 'inlined';
  const size: ProgressIndicatorSize = 'sm';
  const intent: ProgressIndicatorIntent = 'passive';
  const processed = 3;
  const total = 5;
</script>

<ProgressIndicator
  {shape} {type} {size} {intent}
  min={0} max={total} value={processed}
  label="ファイルを確認中"
  valueText={`${total}件中${processed}件確認しました`}
  showPercentage={false}
/>
```

静的な砂時計は値に応じて形を変えません。確定値を指定すれば、ARIA と任意のパーセント表示は更新します。

## Props

すべて省略可能です。

| Prop                    | 型                                   | 既定値                        | 説明                                                                                                                     |
| ----------------------- | ------------------------------------ | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `shape`                 | `ProgressIndicatorShape`             | `'circular'`                  | `'circular'`・`'linear'`・`'static'`。円形、線形、静的な砂時計。                                                         |
| `type`                  | `ProgressIndicatorType`              | `'stacked'`                   | `'stacked'`：縦並び、`'inlined'`：横並び、`'stacked-underlay'`：背景パネル付き縦並び。参照の `data-type` に対応。        |
| `size`                  | `ProgressIndicatorSize \| undefined` | `undefined`                   | `'lg'`・`'sm'`。省略時は `inlined` が `sm`、それ以外が `lg`。円／砂時計は 48／24、線形は幅 240／80・高さ 4 を rem 換算。 |
| `value`                 | `number \| null \| undefined`        | `null`                        | 有限数で確定進捗。内部の表示値を範囲に収める。元の prop は変更しない。                                                   |
| `min`                   | `number`                             | `0`                           | 進捗の下限。                                                                                                             |
| `max`                   | `number`                             | `100`                         | 進捗の上限。                                                                                                             |
| `active`                | `boolean`                            | `true`                        | `false` で非表示、アニメーション停止。                                                                                   |
| `label`                 | `string`                             | `'読み込み中'`                | 可視ラベル。空／空白のみなら省略。                                                                                       |
| `ariaLabel`             | `string \| undefined`                | `undefined`                   | progressbar の名前。省略時は空でない `label`、なければ「読み込み中」。空文字は避ける。                                   |
| `valueText`             | `string \| undefined`                | `undefined`                   | `aria-valuetext`。件数など進捗率より適切な表現を指定できる。                                                             |
| `showPercentage`        | `boolean`                            | `true`                        | 可視ラベルがあり確定進捗なら、丸めた割合を `(50%)` の形で併記。                                                          |
| `intent`                | `ProgressIndicatorIntent`            | `'passive'`                   | `'explicit'` は読み上げ通知あり、`'passive'` は通知なし。HTML 版の必須属性と異なり既定値がある。                         |
| `announceInterval`      | `number`                             | `5`                           | 定期通知の間隔（秒）。正の有限数以外は 5 秒。`explicit` のときだけ使用。                                                 |
| `announceStart`         | `string`                             | `'読み込みを開始しました'`    | 開始通知。                                                                                                               |
| `announceEnd`           | `string`                             | `'読み込みが完了しました'`    | 停止時の通知。停止が失敗・キャンセルを意味する場合は適切な文言へ変更する。                                               |
| `announceLong`          | `string`                             | `'読み込み中です'`            | 不確定進捗の定期通知。                                                                                                   |
| `announceLongWithValue` | `string`                             | `'{value}% 読み込みました。'` | 確定進捗の定期通知。`{value}` を丸めた **割合** に置換。                                                                 |
| `id`                    | `string \| undefined`                | `undefined`                   | progressbar の DOM ID。                                                                                                  |
| `Class`                 | `string`                             | `''`                          | ルートの `dads-progress-indicator` に追加するクラス。HTML 属性と衝突しないよう先頭大文字を使用。                         |

### 範囲の扱い

- `min`・`max` と差が有限で、`max > min` ならその範囲を使用。それ以外は内部で **0〜100** に戻します。
- 確定値を上下限に収めて `aria-valuenow` に使用し、塗りつぶし・表示割合・定期通知は `(表示値 − min) / (max − min) × 100` で統一します。
- 不確定時は `aria-valuenow` と `--value` を外します。`aria-valuemin`／`aria-valuemax` は残ります。親からの値・範囲変更にも追従します。
- `bind:value` や `bind:active` は通常の legacy props として使用できますが、このコンポーネントはそれらを書き換えません。

## 公開型・イベント・スロット

コンポーネントの公開サブパスから上記の4型を名前付きで import できます。

- `ProgressIndicatorShape = 'circular' | 'linear' | 'static'`
- `ProgressIndicatorType = 'stacked' | 'inlined' | 'stacked-underlay'`
- `ProgressIndicatorSize = 'lg' | 'sm'`
- `ProgressIndicatorIntent = 'explicit' | 'passive'`

イベント、スロット、任意属性の転送、DOM を渡す prop、`start()`／`stop()` メソッドはありません。開始・停止は親から `active` を変更します。

## アクセシビリティ・注意点

- ルートは `role="progressbar"`。SVG は装飾として `aria-hidden="true"`。通知用の `role="status"` は progressbar の **外側** にあります。
- `explicit` はマウント時に処理中なら開始通知し、指定間隔ごとに最新の進捗を通知します。通知は約 100ms 後に入り、約 1 秒後に消えます。再開始・`passive` への変更・破棄では古いタイマーを取り消します。通知間隔の変更にも追従します。
- `passive` から処理中の `explicit` へ切り替えると開始通知します。`passive` へ切り替えた場合は完了通知しません。
- 通知テンプレートの `{value}` はコンポーネントが置換します。Svelte 自身の属性補間を避けるため、上書きするときは `announceLongWithValue={'{value}% 確認しました'}` のように文字列式で渡してください。
- SSR 中に DOM・`window`・乱数 ID・タイマーは使用しません。通知はクライアントのマウント後だけです。
- `prefers-reduced-motion: reduce` では元実装と同じく円／線のアニメーションをすべて停止します。確定進捗の充填は保持し、不確定時は静止した 35% 相当の円弧／線分を表示します。これは 35% 完了という意味ではなく、ARIA の確定値はありません。動きなしの明確な代替が必要なら `shape="static"` を選びます。
- 強制カラーではトラックを `Canvas`、線・枠・砂時計を `CanvasText` にします。色は既存の `--color-key-*` トークンを使い、HTML 版の青を固定しません。
- 長時間動かす場合は利用側で中止や静的表示への切替を検討してください。ラベルの表示だけでは処理成功・失敗を通知できないため、必要な結果メッセージは親で用意します。
