# インプットテキスト（InputText）

1行のテキスト・パスワード入力と、任意のラベル・補助文・エラーメッセージを組み合わせた入力欄です。

利用前に[共通の準備](./README.md#共通の準備)でデザイントークンを読み込んでください。

## 基本的な使い方

```svelte
<script lang="ts">
    import { InputText } from '@sharelib-jp/digital-agency-components-svelte-implements';

    let displayName = '';
</script>

<InputText
    id="display-name"
    label="表示名"
    size="md"
    supportText="サービス内に表示する名前を入力してください。"
    required
    bind:value={displayName}
/>
<p>入力値：{displayName}</p>
```

## Props

| 名前          | 型                       | 既定値      | 説明                                                                              |
| ------------- | ------------------------ | ----------- | --------------------------------------------------------------------------------- |
| `id`          | `string \| undefined`    | `undefined` | 入力欄の ID。未指定時は UUID を使って生成します。SSR では明示指定を推奨します。   |
| `size`        | `'sm'` / `'md'` / `'lg'` | `'sm'`      | 入力欄の高さ。                                                                    |
| `fullWidth`   | `boolean`                | `false`     | 入力欄と外側のラベル領域を親要素の幅いっぱい（100%）に表示します。                |
| `type`        | `'text' \| 'password'`   | `'text'`    | 内部 input の種類。`'password'` では入力内容をマスクします。                      |
| `readonly`    | `boolean`                | `false`     | ユーザーからの編集を禁止します。                                                  |
| `disabled`    | `boolean`                | `false`     | 入力欄を無効にします。                                                            |
| `value`       | `string`                 | `''`        | 入力値。`bind:value` に対応します。                                               |
| `errorText`   | `string \| null`         | `null`      | エラーメッセージ。空でない場合にエラー表示と `aria-invalid="true"` を設定します。 |
| `label`       | `string`                 | `''`        | 入力欄に関連付けるラベル。空の場合は内部ラベルを表示しません。                    |
| `required`    | `boolean`                | `false`     | 入力欄の `required` とラベルの必須表示を設定します。                              |
| `supportText` | `string \| null`         | `null`      | ラベルの下に表示する補助文。内部ラベルがある場合に描画します。                    |

## 使用例

### サイズ・読み取り専用・無効状態

```svelte
<script lang="ts">
    import { InputText } from '@sharelib-jp/digital-agency-components-svelte-implements';
</script>

<InputText id="text-small" label="小サイズ" size="sm" value="初期値" />
<InputText id="text-large" label="大サイズ" size="lg" />
<InputText id="text-readonly" label="確認済みの内容" size="md" value="変更できません" readonly />
<InputText id="text-disabled" label="利用できない入力欄" size="md" value="無効です" disabled />
```

### 親要素の幅いっぱいに表示する

`fullWidth` を指定すると、入力欄と外側のラベル領域がともに親要素の幅いっぱいに広がります。幅の上限は親要素側で指定します。

```svelte
<script lang="ts">
    import { InputText } from '@sharelib-jp/digital-agency-components-svelte-implements';
</script>

<div style="width: 100%; max-width: 36rem;">
    <InputText
        id="text-full-width"
        label="表示名"
        size="md"
        fullWidth
        supportText="サービス内に表示する名前を入力してください。"
    />
</div>
```

### パスワードを入力する

小文字の `type` に `'password'` を指定します。`bind:value` で値を同期できますが、入力値をテキストとして画面に表示したり、ログに出力したりしないでください。

```svelte
<script lang="ts">
    import { InputText } from '@sharelib-jp/digital-agency-components-svelte-implements';

    let password = '';
</script>

<InputText
    id="account-password"
    label="パスワード"
    size="md"
    type="password"
    required
    bind:value={password}
/>
```

### 呼び出し元で検証してエラーを表示する

```svelte
<script lang="ts">
    import { InputText } from '@sharelib-jp/digital-agency-components-svelte-implements';

    let value = '';
    let checked = false;
    $: errorText = checked && !value.trim() ? '名前を入力してください。' : null;
</script>

<InputText id="validated-name" label="名前" required bind:value {errorText} />
<button type="button" on:click={() => checked = true}>入力内容を確認する</button>
```

## バインド・イベント・スロット

- `bind:value` で入力値を親と同期できます。
- 現在の実装には `input`・`change`・`focus`・`blur` などのイベント転送、カスタムイベント、スロットはありません。値に応じた処理は親側のリアクティブ処理で行ってください。

## 注意点・アクセシビリティ

- 入力目的を伝えるため、通常は `label` を指定します。[フォームコントロールラベル](./FormControlLabel.md)が内部で使用され、`for` と入力 ID が関連付けられます。
- SSR と hydration では ID の自動生成結果が異なる可能性があるため、ページ内で一意の `id` を明示してください。
- `supportText` の描画には空でない `label` が必要です。補助文を指定する場合はラベルも指定してください。
- 補助文とエラー文がある場合は、その ID を `aria-describedby` に設定します。`errorText` は表示と ARIA の状態を変えるもので、独自の検証処理や custom validity は追加しません。
- `readonly` は編集禁止、`disabled` は無効状態です。状態に合わせて使い分けてください。
- 内部入力の種類は既定で `type="text"` です。`type="password"` も指定できますが、それ以外の入力種類には対応していません。パスワードのマスクは見た目だけで、値を暗号化するものではありません。
- `name`、`placeholder`、`autocomplete`、`maxlength`、`aria-*`、`Class` などの追加属性は転送されません。現在は `name` が設定されないため、ネイティブな form の名前付きフィールドとしては送信されません。`bind:value` で取得した値を呼び出し元から送信するか、必要な属性を備えた入力要素を使用してください。
- 複数行の入力には[テキストエリア（Textarea）](./Textarea.md)を使用します。

[コンポーネント一覧に戻る](./README.md)
