# ラジオボタン（RadioButton）

選択肢から1つを選ぶ入力に使います。複数のコンポーネントで同じ`name`と親の状態変数を共有し、`bind:group`で選択値を同期します。

導入とアプリrootで一度だけ設定する共通CSSについては、[共通の準備](./README.md#共通の準備)を参照してください。

## 基本的な使い方

```svelte
<script lang="ts">
  import { RadioButton } from '@sharelib-jp/digital-agency-components-svelte-implements';

  let contactMethod: string | number | null = 'email';
</script>

<fieldset>
  <legend>連絡方法</legend>
  <RadioButton
    id="radio-contact-email"
    name="contactMethod"
    value="email"
    label="メール"
    bind:group={contactMethod}
  />
  <RadioButton
    id="radio-contact-phone"
    name="contactMethod"
    value="phone"
    label="電話"
    bind:group={contactMethod}
  />
</fieldset>
<p>選択値：{contactMethod ?? '未選択'}</p>
```

## Props

`id`と`name`が必須です。型は現在のSvelte実装の`export let`に対応しています。

| Prop          | 型                         | 必須   | 既定値  | 説明                                                                     |
| ------------- | -------------------------- | ------ | ------- | ------------------------------------------------------------------------ |
| `id`          | `string`                   | はい   | なし    | 内部inputのID。labelとの関連付けと補足・エラー文のID生成に使います。     |
| `name`        | `string`                   | はい   | なし    | native radioのグループ名・フォーム送信名。                               |
| `value`       | `string \| number`         | いいえ | `''`    | この選択肢の値。選択されると`group`へ代入されます。                      |
| `group`       | `string \| number \| null` | いいえ | `null`  | グループの現在値。`group === value`のとき選択状態になります。            |
| `label`       | `string`                   | いいえ | `''`    | radioの横に表示するラベル。                                              |
| `size`        | `'sm' \| 'md' \| 'lg'`     | いいえ | `'sm'`  | radioとラベルの寸法・間隔。                                              |
| `disabled`    | `boolean`                  | いいえ | `false` | native inputを無効化します。                                             |
| `required`    | `boolean`                  | いいえ | `false` | native radioグループの必須制約。                                         |
| `errored`     | `boolean`                  | いいえ | `false` | inputを`aria-invalid="true"`にし、エラーの配色にします。                 |
| `supportText` | `string \| null`           | いいえ | `null`  | radioの前に表示する補足文。空文字列では表示しません。                    |
| `errorText`   | `string \| null`           | いいえ | `null`  | radioの後に表示するエラー文。非空なら`aria-invalid="true"`にもなります。 |
| `Class`       | `string`                   | いいえ | `''`    | 外側の`div.dads-radio-field`に追加するクラス。大文字の`C`です。          |

## 状態別・組合せ使用例

### 数値の選択値とフォームreset

数値の`value`は`value={1}`のように渡します。フォームreset後は、各コンポーネント生成時の`group`へ戻ります。

```svelte
<script lang="ts">
  import { RadioButton } from '@sharelib-jp/digital-agency-components-svelte-implements';

  let course: string | number | null = 1;
</script>

<form id="radio-course-form" on:submit={(event) => event.preventDefault()}>
  <fieldset>
    <legend>受講コース（必須）</legend>
    <RadioButton
      id="radio-course-basic"
      name="course"
      value={1}
      label="基礎"
      size="md"
      required
      bind:group={course}
    />
    <RadioButton
      id="radio-course-advanced"
      name="course"
      value={2}
      label="応用"
      size="md"
      required
      bind:group={course}
    />
  </fieldset>
  <button type="submit">選択を確認</button>
  <button type="reset">初期の選択に戻す</button>
</form>
<p>現在の選択値：{course ?? '未選択'}</p>
```

### 未選択のエラーを共有し、選べない項目を示す

エラー文は最初の項目に表示し、もう一方は`errored`と外部の`aria-describedby`で同じ説明を参照します。確認ボタンによるエラー判定は親の処理です。

```svelte
<script lang="ts">
  import { RadioButton } from '@sharelib-jp/digital-agency-components-svelte-implements';

  let channel: string | number | null = null;
  let attempted = false;
  $: errorText = attempted && channel === null ? '通知経路を選択してください。' : null;
</script>

<fieldset>
  <legend>通知経路（必須）</legend>
  <RadioButton
    id="radio-channel-email"
    name="channel"
    value="email"
    label="メール"
    size="lg"
    required
    errorText={errorText}
    bind:group={channel}
  />
  <RadioButton
    id="radio-channel-phone"
    name="channel"
    value="phone"
    label="電話"
    size="lg"
    required
    errored={Boolean(errorText)}
    aria-describedby={errorText ? 'radio-channel-email-error-text' : undefined}
    bind:group={channel}
  />
  <RadioButton
    id="radio-channel-post"
    name="channel"
    value="post"
    label="郵送（受付停止中）"
    size="lg"
    disabled
    bind:group={channel}
  />
</fieldset>
<button type="button" on:click={() => attempted = true}>入力内容を確認</button>
```

## bind・イベント・native属性

- 同じ選択肢群には、同じ`name`と同じ親変数の`bind:group`を指定してください。`name`はブラウザーの排他選択・キーボード操作・送信に、`group`はSvelte側の状態同期に必要です。どちらかだけ共有するとDOMと親の状態が一致しないことがあります。
- `group`と`value`は厳密等価で比較します。数値の`2`と文字列の`'2'`は別の選択値です。値はグループ内で重複させないでください。`null`やどの値にも一致しない値なら未選択になります。
- `checked`というexport propや`bind:checked`はありません。親から選択を変える場合も`group`を変更します。親からの値変更だけでは`input`・`change`イベントを生成しません。
- 転送されるイベントは`on:input`、`on:change`、`on:focus`、`on:blur`です。`input`・`change`の内部ハンドラーは、対象inputがチェックされている場合に`group = value`を実行してから元のDOMイベントを転送します。独自の`CustomEvent`や`detail`はありません。`on:click`などの明示的な転送はありません。
- slotはありません。ラベル・補足文・エラー文は文字列propsで指定します。
- `$$restProps`は**内部の`input[type="radio"]`**に適用されます。例えば`form`、`aria-label`、`aria-labelledby`、`aria-describedby`、`data-*`、`style`を渡せます。外側のdivやlabelには適用されません。
- inputの`id`、`name`、`value`、`type`、`class`、`checked`、`defaultChecked`、`disabled`、`required`は実装側の指定が優先されます。`class`では内部クラスを追加できません。外側には`Class`を使います。
- `aria-describedby`は渡した値に、表示中の`${id}-support-text`と`${id}-error-text`を追加します。`aria-invalid`は`errored`または非空の`errorText`があると`'true'`になり、それ以外は渡した値を使います。

### フォームresetの扱い

生成時の`group`を初期値として保持し、初期値と`value`の一致をnative inputの`defaultChecked`にも反映します。後から親の`group`を変更しても、保持した初期値は更新されません。

所属フォームのresetを監視し、native resetと他のイベントハンドラーの実行後、`setTimeout(..., 0)`で`group`を初期値へ戻します。resetイベント内で即座に親の値が戻るとは限りません。`preventDefault()`でresetが取り消された場合は戻しません。`form`属性で指定した外部フォームのresetにも対応します。

グループ全体が同じ初期値と所属フォームを共有する構成にしてください。`group`への代入で初期選択を変更することと、フォームresetの基準を変更することは別です。

## 注意点・アクセシビリティ

- `id`はページ内で一意にし、`${id}-support-text`・`${id}-error-text`とも衝突させないでください。異なるグループが同じフォーム内で同じ`name`を使わないようにしてください。
- 関連項目は`fieldset`と`legend`でまとめます。`label`を省略する場合は外部labelや`aria-label`、`aria-labelledby`で各項目に名前を付けてください。native radioとしての矢印キー操作はブラウザーに任せています。
- radio領域は`sm`が24px相当、`md`が32px相当、`lg`が44px相当です。ラベルが非空の場合は上下の余白も付きます。
- nativeフォーム送信では選択中かつ無効でない項目の`name=value`が送信されます。`group`が数値でも、フォームデータの値は文字列です。未選択ならそのグループの値は送信されません。
- native radioグループの`required`は「グループから1つ選ぶ」という制約です。必須の文字表示は自動追加されないため、legend等にも説明してください。
- `errored`・`errorText`は表示とARIAの状態で、native検証結果を自動判定せず、`setCustomValidity()`も呼びません。グループのエラーをどの項目に関連付けるかは親で決めてください。
- `aria-disabled="true"`はARIAと無効時の配色のみで、選択を止める処理はありません。nativeの操作・フォーカス・送信を無効化するには`disabled`を使ってください。
- フォーカス表示とforced-colors時の配色をカスタマイズで消さないでください。
