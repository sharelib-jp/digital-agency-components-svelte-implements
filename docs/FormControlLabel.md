# フォームコントロールラベル（FormControlLabel）

入力欄のラベル、必須・任意の表示、補助文を出力するコンポーネントです。入力要素そのものは出力しません。

利用前に[共通の準備](./README.md#共通の準備)を確認してください。専用のコンポーネント CSS は持たないため、見た目は組み合わせる入力コンポーネントや利用アプリの CSS で調整します。

## 基本的な使い方

```svelte
<script lang="ts">
    import { FormControlLabel } from '@sharelib-jp/digital-agency-components-svelte-implements';

    let value = '';
</script>

<FormControlLabel For="custom-name" label="名前" required />
<input id="custom-name" name="name" type="text" required bind:value />
```

`For` の先頭は大文字です。内部の label の `for` 属性に設定されるため、入力要素の `id` と同じ値を指定します。

## Props

| 名前            | 型                    | 既定値      | 説明                                                                                |
| --------------- | --------------------- | ----------- | ----------------------------------------------------------------------------------- |
| `For`           | `string`              | `''`        | ラベルを関連付ける入力要素の ID。                                                   |
| `label`         | `string`              | `''`        | ラベルのテキスト。                                                                  |
| `required`      | `boolean`             | `false`     | `true` で「※必須」、`false` で「※任意」を表示します。入力要素自体には影響しません。 |
| `supportText`   | `string \| null`      | `null`      | ラベルの後に表示する補助文。空でない場合に表示します。                              |
| `supportTextId` | `string \| undefined` | `undefined` | 補助文の p 要素に付ける ID。入力側の `aria-describedby` で関連付けます。            |

## 使用例

### 任意入力と補助文

```svelte
<script lang="ts">
    import { FormControlLabel } from '@sharelib-jp/digital-agency-components-svelte-implements';

    let nickname = '';
</script>

<FormControlLabel
    For="custom-nickname"
    label="ニックネーム"
    supportText="本名以外の名前を指定できます。"
    supportTextId="custom-nickname-support"
/>
<input
    id="custom-nickname"
    name="nickname"
    type="text"
    aria-describedby="custom-nickname-support"
    bind:value={nickname}
/>
```

## イベント・スロット

イベント転送、カスタムイベント、スロットはありません。ラベル・補助文はそれぞれの props で指定します。

## 注意点・アクセシビリティ

- `For` と入力要素の `id` を一致させてください。補助文を読ませる場合は `supportTextId` と入力側の `aria-describedby` も一致させます。
- `required` は必須の表示だけを制御します。実際の必須入力にするには、入力要素にも `required` を設定してください。
- `label` は入力の目的が分かるテキストにします。空のラベルや、必須・任意の表示だけのラベルは避けてください。
- `For` は単一の入力との関連付けです。複数のチェックボックスやラジオボタンをまとめる見出しには、ネイティブの fieldset と legend を使用してください。
- `Class`、`aria-*` などの追加属性は転送されません。
- [InputText](./InputText.md)、[Textarea](./Textarea.md)、[Switch](./Switch.md)では、ラベル付きの構成の一部として使用されています。これらを使う場合、ラベルを別途重複配置する必要はありません。

[コンポーネント一覧に戻る](./README.md)
