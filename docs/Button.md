# ボタン（Button）

操作を表すラベル付きのボタンです。サイズ・アウトライン・全幅表示を切り替えられます。

利用前に[共通の準備](./README.md#共通の準備)でデザイントークンを読み込んでください。

## 基本的な使い方

```svelte
<script lang="ts">
    import { Button } from '@sharelib-jp/digital-agency-components-svelte-implements';
</script>

<Button label="登録する" />
```

## Props

| 名前        | 型                                               | 既定値         | 説明                                                                                           |
| ----------- | ------------------------------------------------ | -------------- | ---------------------------------------------------------------------------------------------- |
| `label`     | `string`                                         | `'ボタン'`     | ボタンに表示するテキスト。                                                                     |
| `size`      | `'xs'` / `'sm'` / `'md'` / `'lg'`                | `'md'`         | ボタンのサイズ。                                                                               |
| `type`      | `'solid-fill'` / `'solid-outline'` / `'outline'` | `'solid-fill'` | デザインの種別。ネイティブ button の `type` 属性ではありません。下記の制約を参照してください。 |
| `fullWidth` | `boolean`                                        | `false`        | 親要素の幅いっぱいに表示します。                                                               |

## 使用例

### サイズの比較

```svelte
<script lang="ts">
    import { Button } from '@sharelib-jp/digital-agency-components-svelte-implements';
</script>

<Button size="xs" label="極小" />
<Button size="sm" label="小" />
<Button size="md" label="中" />
<Button size="lg" label="大" />
```

### アウトライン・全幅表示

```svelte
<script lang="ts">
    import { Button } from '@sharelib-jp/digital-agency-components-svelte-implements';
</script>

<Button type="outline" label="戻る" />
<Button fullWidth label="内容を確認する" />
```

## イベント・スロット

現在の実装にはイベント転送、カスタムイベント、スロットはありません。内容は `label` で指定します。

## 注意点・アクセシビリティ

- `type` の型には `solid-outline` が含まれますが、対応する CSS は現在定義されていません。デザインが実装されている `solid-fill` または `outline` を使用してください。
- `disabled`、`id`、`Class`、`aria-*` などの追加属性は内部の button へ転送されません。`on:click` も転送されません。
- 内部の button にネイティブな `type` 属性がないため、form 内では通常の button の既定の送信動作に注意してください。送信・クリック処理・無効化などを明示的に制御する場合は、ネイティブの `<button type="button">` / `<button type="submit">` を使用します。
- `label` には、そのボタンで実行する操作を具体的に記述してください。空のラベルは避けてください。

[コンポーネント一覧に戻る](./README.md)
