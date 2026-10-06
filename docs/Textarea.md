# テキストエリア（Textarea）

複数行の文章を入力する場合に使います。ラベル・補足文・エラー文のほか、任意の文字数カウンタと超過時のnative検証、読み上げ用の通知を備えています。

導入とアプリrootで一度だけ設定する共通CSSについては、[共通の準備](./README.md#共通の準備)を参照してください。

## 基本的な使い方

```svelte
<script lang="ts">
  import { Textarea } from '@sharelib-jp/digital-agency-components-svelte-implements';

  let message = '';
</script>

<Textarea
  id="textarea-message"
  name="message"
  label="お問い合わせ内容"
  rows={5}
  cols={40}
  supportText="状況を具体的に記入してください。"
  bind:value={message}
/>
<p>入力済みの長さ：{message.length}</p>
```

## Props

`id`のみ必須です。型は現在のSvelte実装の`export let`に対応しています。

| Prop                      | 型                     | 必須   | 既定値                        | 説明                                                                                 |
| ------------------------- | ---------------------- | ------ | ----------------------------- | ------------------------------------------------------------------------------------ |
| `id`                      | `string`               | はい   | なし                          | 内部textareaのID。labelとの関連付けと補足・エラー文のID生成に使います。              |
| `name`                    | `string \| undefined`  | いいえ | `undefined`                   | native textareaの送信名。                                                            |
| `value`                   | `string`               | いいえ | `''`                          | 入力内容。`bind:value`で双方向に同期できます。                                       |
| `label`                   | `string`               | いいえ | `''`                          | textareaの前に表示するラベル。非空の場合だけlabel要素を描画します。                  |
| `size`                    | `'sm' \| 'md' \| 'lg'` | いいえ | `'md'`                        | ラベルの文字サイズと周囲の間隔。入力欄の行数ではありません。                         |
| `fullWidth`               | `boolean`              | いいえ | `false`                       | 入力欄と外側のラベル領域を親要素の幅いっぱい（100%）に表示します。                   |
| `rows`                    | `number \| undefined`  | いいえ | `undefined`                   | nativeの表示行数。未指定ならブラウザーの既定値を使います。                           |
| `cols`                    | `number \| undefined`  | いいえ | `undefined`                   | nativeの表示幅の目安。未指定ならブラウザーの既定値を使います。                       |
| `readonly`                | `boolean`              | いいえ | `false`                       | 編集不可にします。フォーカス・コピー・フォーム送信は可能です。                       |
| `readonlyText`            | `string`               | いいえ | `'編集不可'`                  | `readonly`かつラベルがある場合の状態表示。必須・任意の表示に代わります。             |
| `disabled`                | `boolean`              | いいえ | `false`                       | native textareaを無効化し、フォーム送信から除外します。                              |
| `required`                | `boolean`              | いいえ | `false`                       | native必須制約と、`readonly`でない場合のラベルの「※必須」表示。                      |
| `supportText`             | `string \| null`       | いいえ | `null`                        | 入力欄の前に表示する補足文。空文字列では表示しません。                               |
| `errorText`               | `string \| null`       | いいえ | `null`                        | 入力欄の後に表示するエラー文。非空なら`aria-invalid="true"`にもなります。            |
| `counterMax`              | `number \| null`       | いいえ | `null`                        | カウンタと超過検証の基準。`null`ならカウンタなし。入力を切り詰める値ではありません。 |
| `counterErrorMessage`     | `string`               | いいえ | `'{count}文字超過しています'` | 超過時に`setCustomValidity()`へ設定するメッセージ。                                  |
| `counterExceededMessage`  | `string`               | いいえ | `'{count}文字超過'`           | 超過時のassertiveな読み上げ通知。                                                    |
| `counterRemainingMessage` | `string`               | いいえ | `'残り{count}文字'`           | 残り数のpoliteな読み上げ通知。                                                       |
| `Class`                   | `string`               | いいえ | `''`                          | 外側の`div.dads-form-control-label`に追加するクラス。大文字の`C`です。               |

3つのカウンタ用メッセージは、すべての`{count}`を数値に置換します。エラー・超過通知では超過数、残り通知では残り数です。画面のカウンタ表示はこれらの文言によらず「現在数 / counterMax」です。

## 状態別・組合せ使用例

### 親要素の幅いっぱいに表示する

`fullWidth`を指定すると、入力欄と外側のラベル領域がともに親要素の幅いっぱいに広がります。`cols`による幅の目安ではなく親要素の幅に合わせるため、幅の上限は親要素側で指定します。

```svelte
<script lang="ts">
  import { Textarea } from '@sharelib-jp/digital-agency-components-svelte-implements';

  let message = '';
</script>

<div style="width: 100%; max-width: 36rem;">
  <Textarea
    id="textarea-full-width"
    label="お問い合わせ内容"
    rows={5}
    fullWidth
    supportText="状況を具体的に記入してください。"
    bind:value={message}
  />
</div>
```

### 必須入力と文字数カウンタ

`counterMax`は超過入力を許可し、超過分を表示・検証します。この例には入力を止める`maxlength`を付けていません。送信ボタンによるnative検証は残したまま、実際の送信だけを抑止します。

```svelte
<script lang="ts">
  import { Textarea } from '@sharelib-jp/digital-agency-components-svelte-implements';

  let summary = '';
  let confirmed = false;

  function confirm(event: SubmitEvent) {
    event.preventDefault();
    confirmed = true;
  }
</script>

<form id="textarea-summary-form" on:submit={confirm}>
  <Textarea
    id="textarea-summary"
    name="summary"
    label="申請の概要"
    required
    rows={4}
    counterMax={100}
    counterErrorMessage={'上限を{count}文字超えています。'}
    counterExceededMessage={'{count}文字減らしてください。'}
    counterRemainingMessage={'あと{count}文字入力できます。'}
    supportText="100文字以内で記入してください。絵文字などは複数単位で数える場合があります。"
    bind:value={summary}
    on:input={() => confirmed = false}
  />
  <button type="submit">入力内容を確認</button>
</form>
<p>{confirmed ? 'native検証を通過しました。' : '確認前です。'}</p>
```

### 読み取り専用と無効状態

読み取り専用は値の参照・コピー用、無効状態は操作や送信の対象から外す場合に使います。

```svelte
<script lang="ts">
  import { Textarea } from '@sharelib-jp/digital-agency-components-svelte-implements';

  let receipt = '申請を受け付けました。';
  let unavailableMemo = 'この項目は現在利用できません。';
</script>

<Textarea
  id="textarea-receipt"
  name="receipt"
  label="受付結果"
  size="sm"
  rows={3}
  readonly
  readonlyText="参照のみ"
  supportText="内容をコピーできます。"
  bind:value={receipt}
/>
<Textarea
  id="textarea-unavailable-memo"
  name="memo"
  label="追加メモ"
  rows={3}
  disabled
  bind:value={unavailableMemo}
/>
```

### 親で判定するエラーと外部の説明

`errorText`は表示用です。以下の業務ルールは親が確認ボタンで判定し、既存の説明IDは自動生成される説明IDと併用します。

```svelte
<script lang="ts">
  import { Textarea } from '@sharelib-jp/digital-agency-components-svelte-implements';

  let reason = '';
  let errorText: string | null = null;

  function checkReason() {
    errorText = reason.trim().length < 10 ? '理由を10文字以上で記入してください。' : null;
  }
</script>

<p id="textarea-reason-guide">個人情報は記入しないでください。</p>
<Textarea
  id="textarea-reason"
  name="reason"
  label="申請理由"
  size="lg"
  rows={5}
  placeholder="申請が必要な理由"
  aria-describedby="textarea-reason-guide"
  supportText="確認ボタンで内容を確認できます。"
  errorText={errorText}
  bind:value={reason}
  on:input={() => errorText = null}
/>
<button type="button" on:click={checkReason}>理由を確認</button>
```

## bind・イベント・native属性

- `bind:value`で入力内容を親と同期します。親から値を変更すると、IME変換中でなければカウンタと超過検証も更新されます。親からの値変更だけでは`input`・`change`や新しい読み上げ通知を生成しません。
- 転送されるイベントは`on:input`、`on:change`、`on:focus`、`on:blur`、`on:compositionstart`、`on:compositionend`です。内部textareaの元のDOMイベントであり、独自の`CustomEvent`や`detail`はありません。`input`とcompositionには内部処理もあります。ハンドラー中に最新の入力欄の内容を読む場合は`event.currentTarget`のtextareaを参照してください。
- `on:keydown`などの明示的な転送はありません。slotやtextarea要素の参照を公開するpropもありません。
- `$$restProps`は**内部の`textarea.dads-textarea__textarea`**に適用されます。例えば`placeholder`、`maxlength`、`minlength`、`autocomplete`、`form`、`wrap`、`aria-label`、`aria-labelledby`、`aria-describedby`、`data-*`、`style`を渡せます。外側のdivやlabelには適用されません。
- textareaの`id`、`name`、`class`、`rows`、`cols`、入力値、`readonly`、`disabled`、`required`は実装側の指定が優先されます。`class`で内部クラスを追加することはできません。外側には`Class`を使います。
- `aria-describedby`は渡した値に、表示中の`${id}-support-text`と`${id}-error-text`を追加します。カウンタ自体のIDは追加しません。`aria-invalid`は非空の`errorText`があると`'true'`になり、それ以外は渡した値を使います。`errored`というexport propはありません。

### IME・カウンタ・超過検証

- `compositionstart`とinputイベントの`isComposing`を参照し、IME変換中はカウンタ用の値の更新を保留します。`compositionend`でtextareaの内容を`value`に代入し、カウンタを更新します。変換途中のDOM入力と表示カウント・超過判定は一時的に異なり得ます。イベント転送自体は変換中も行います。
- 長さはJavaScriptの`string.length`、つまり**UTF-16コード単位数**です。絵文字1つが2以上になる場合や、結合文字を個別に数える場合があります。Unicodeコードポイント数や見た目の文字数ではありません。
- `counterMax`を超えるとカウンタをエラー色にし、`counterErrorMessage`を使って内部textareaに`setCustomValidity()`を設定します。上限以内に戻る、または`counterMax=null`になるとカスタムエラーを解除します。入力の拒否・切り詰めはしません。
- カウンタ超過だけでは`errorText`を作らず、`aria-invalid="true"`も自動設定しません。入力欄のエラー配色はCSSの`:user-invalid`または`aria-invalid="true"`に依存します。固定のエラー文が必要なら親から渡してください。
- 確定した入力の更新時、残り数は待機後にpolite、超過数はassertiveのlive regionへ通知します。残り数の待機は最短1秒で、残り数が多いほど長くなり、通知の反映にはさらに100msのタイマーを使います。初期表示や親からの値変更だけで通知文は生成しません。`counterMax=null`と破棄時には通知用タイマーを解除します。
- `counterMax`に範囲・整数チェックはありません。利用側で0以上の有限整数を指定してください。`0`はカウンタを有効にし、空でない内容を超過とします。`maxlength`は別のnative属性で、`counterMax`から自動設定されません。

## 注意点・アクセシビリティ

- `id`をページ内で一意にし、`${id}-support-text`・`${id}-error-text`とも衝突させないでください。
- `label`を省略する場合は外部labelや`aria-label`、`aria-labelledby`で名前を付けてください。placeholderや補足文だけではラベルの代わりになりません。
- ラベルがあり、`readonly=false`の場合は、disabledでも「※必須」または「※任意」を表示します。`readonly=true`の場合は代わりに`readonlyText`を表示します。無効でないreadonlyの入力欄は破線になります。readonlyやdisabledのtextareaはnative制約検証の対象外です。
- `name`があり、無効でなければ、空文字列やreadonlyの値もフォーム送信の対象です。`disabled`の値は送信されません。`aria-disabled="true"`はARIAと無効時の見た目だけで、編集・フォーカス・送信を止める処理はありません。
- `errorText`は説明文とARIAの状態を設定しますが、それ自体はnative送信を止めません。業務ルールの検証は親で行ってください。カウンタ制御も`setCustomValidity()`を更新するため、外部から独自のカスタム検証を設定する場合は上書きに注意してください。
- `rows`・`cols`にはnative属性として有効な正の整数を指定してください。入力欄は最大幅100%で、`fullWidth=true`では入力欄と外側のラベル領域の幅を100%にします。縦方向のみリサイズ可能で、disabled相当の見た目ではリサイズを無効にします。`size`は主にラベル・間隔を変えるもので、行数や入力文字のサイズを変えません。
- フォーカス表示、forced-colors時の配色、読み上げ用live regionをカスタマイズで消さないでください。
