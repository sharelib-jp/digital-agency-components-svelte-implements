# チェックボックス（Checkbox）

複数の選択肢を個別に選ぶ場合や、同意の有無を入力する場合に使います。内部のnative checkboxに選択状態・未確定状態をbindでき、補足文とエラー文も表示できます。

導入とアプリrootで一度だけ設定する共通CSSについては、[共通の準備](./README.md#共通の準備)を参照してください。

## 基本的な使い方

```svelte
<script lang="ts">
  import { Checkbox } from '@sharelib-jp/digital-agency-components-svelte-implements';

  let receiveNews = false;
</script>

<Checkbox
  id="checkbox-news"
  name="receiveNews"
  value="yes"
  label="お知らせを受け取る"
  bind:checked={receiveNews}
/>
<p>受信設定：{receiveNews ? '受け取る' : '受け取らない'}</p>
```

## Props

`id`のみ必須です。型は現在のSvelte実装の`export let`に対応しています。

| Prop            | 型                     | 必須   | 既定値      | 説明                                                                        |
| --------------- | ---------------------- | ------ | ----------- | --------------------------------------------------------------------------- |
| `id`            | `string`               | はい   | なし        | 内部inputのID。labelの`for`と補足・エラー文のID生成にも使います。           |
| `name`          | `string \| undefined`  | いいえ | `undefined` | 内部inputの送信名。                                                         |
| `value`         | `string`               | いいえ | `'on'`      | チェックされたときの送信値。選択状態そのものではありません。                |
| `label`         | `string`               | いいえ | `''`        | checkboxの横に表示するラベル。                                              |
| `size`          | `'sm' \| 'md' \| 'lg'` | いいえ | `'sm'`      | checkboxとラベルの寸法・間隔。                                              |
| `checked`       | `boolean`              | いいえ | `false`     | 選択状態。`bind:checked`で双方向に同期できます。                            |
| `indeterminate` | `boolean`              | いいえ | `false`     | 一部選択などを表す未確定状態。`bind:indeterminate`で同期できます。          |
| `disabled`      | `boolean`              | いいえ | `false`     | native inputを無効化します。                                                |
| `required`      | `boolean`              | いいえ | `false`     | native必須制約。このcheckbox自身のチェックが必要になります。                |
| `errored`       | `boolean`              | いいえ | `false`     | inputを`aria-invalid="true"`にし、エラーの配色にします。                    |
| `supportText`   | `string \| null`       | いいえ | `null`      | checkboxの前に表示する補足文。空文字列では表示しません。                    |
| `errorText`     | `string \| null`       | いいえ | `null`      | checkboxの後に表示するエラー文。非空なら`aria-invalid="true"`にもなります。 |
| `Class`         | `string`               | いいえ | `''`        | 外側の`div.dads-checkbox-field`に追加するクラス。大文字の`C`です。          |

## 状態別・組合せ使用例

### 一部選択と「すべて選択」

`indeterminate`は子項目を自動集計しません。親で集計し、全選択の操作も親で処理します。

```svelte
<script lang="ts">
  import { Checkbox } from '@sharelib-jp/digital-agency-components-svelte-implements';

  let taxNews = true;
  let benefitNews = false;
  let allChecked = false;
  let partiallyChecked = false;

  $: allChecked = taxNews && benefitNews;
  $: partiallyChecked = taxNews !== benefitNews;

  function changeAll(event: Event) {
    const selected = (event.currentTarget as HTMLInputElement).checked;
    taxNews = selected;
    benefitNews = selected;
  }
</script>

<fieldset>
  <legend>受け取るお知らせ</legend>
  <Checkbox
    id="checkbox-all-news"
    label="すべて選択"
    size="md"
    bind:checked={allChecked}
    bind:indeterminate={partiallyChecked}
    on:change={changeAll}
  />
  <Checkbox
    id="checkbox-tax-news"
    name="news"
    value="tax"
    label="税金"
    bind:checked={taxNews}
  />
  <Checkbox
    id="checkbox-benefit-news"
    name="news"
    value="benefit"
    label="給付金"
    bind:checked={benefitNews}
  />
</fieldset>
```

### 必須項目のエラーと無効な項目

以下の確認ボタンはアプリ側のエラー表示を切り替えます。`errorText`自体がnative検証を行うわけではありません。

```svelte
<script lang="ts">
  import { Checkbox } from '@sharelib-jp/digital-agency-components-svelte-implements';

  let consent = false;
  let attempted = false;
  $: consentError = attempted && !consent ? '利用規約への同意が必要です。' : null;
</script>

<Checkbox
  id="checkbox-terms"
  name="consent"
  value="agreed"
  label="利用規約に同意する（必須）"
  size="lg"
  required
  supportText="利用規約を確認してから選択してください。"
  errorText={consentError}
  bind:checked={consent}
/>
<Checkbox
  id="checkbox-fixed-service"
  label="契約に含まれるサービス（変更不可）"
  checked
  disabled
/>
<button type="button" on:click={() => attempted = true}>入力内容を確認</button>
```

## bind・イベント・native属性

- `bind:checked`は選択状態、`bind:indeterminate`は未確定状態を同期します。両者は独立しています。利用者の操作で未確定状態が解除されるため、その変化も取得するならbindしてください。
- 配列を扱う`bind:group`は実装されていません。複数項目の状態管理は親で行います。
- 転送されるイベントは`on:input`、`on:change`、`on:focus`、`on:blur`です。内部inputの元のDOMイベントであり、独自の`CustomEvent`や`detail`はありません。最新のDOM状態をハンドラー内で読む場合は`event.currentTarget`のinputを参照できます。`on:click`などの明示的なイベント転送はありません。
- slotはありません。ラベル・補足文・エラー文は文字列propsで指定します。
- `$$restProps`は**内部の`input[type="checkbox"]`**に適用されます。例えば`form`、`aria-label`、`aria-labelledby`、`aria-describedby`、`data-*`、`style`を渡せます。外側のdivやlabelには適用されません。
- inputの`id`、`name`、`value`、`type`、`class`、選択状態、`disabled`、`required`は実装側の指定が優先されます。`class`では内部クラスを追加できないため、外側のカスタマイズには`Class`を使ってください。
- `aria-describedby`は渡した値に、表示中の`${id}-support-text`と`${id}-error-text`を追加します。`aria-invalid`は`errored`または非空の`errorText`があると`'true'`になり、それ以外は渡した値を使います。

## 注意点・アクセシビリティ

- `id`は同じページ内で一意にしてください。補足・エラー文用の派生IDとも衝突させないでください。
- `label`を省略すると見えるラベルは空になります。外部labelや`aria-label`、`aria-labelledby`でアクセシブルな名前を必ず付けてください。関連する複数項目は`fieldset`と`legend`でまとめます。
- `size`のcheckbox領域は`sm`が24px相当、`md`が32px相当、`lg`が44px相当です。実際のinputはその75%で、ラベルが非空の場合は上下の余白も付きます。
- nativeフォーム送信では、`name`があり、無効でなく、`checked`の項目だけが`name=value`として送信されます。同じ`name`の複数項目は複数値になります。`indeterminate`は見た目の状態であり、送信可否・必須制約の判断は`checked`に依存します。
- 複数のcheckboxに`required`を付けると、それぞれのチェックが必要になります。「どれか1つ以上」という検証は親で実装してください。必須の文字表示は自動追加されないため、ラベル等でも説明してください。
- `errored`・`errorText`は表示とARIAの状態です。`setCustomValidity()`による検証やエラーの自動検出は行いません。
- `aria-disabled="true"`はARIAと無効時の配色を設定しますが、操作を止めるハンドラーはありません。操作・フォーカス・フォーム送信をnativeに無効化するには`disabled`を使ってください。
- CSSはフォーカス表示とforced-colors時の配色を備えています。カスタマイズ時にこれらを消さないでください。
