# カード（Card）

見出しと中身を props または子要素で指定する、枠線・角丸・余白だけのシンプルなカードです。HTML 版カード作例の配色・余白を参考にし、画像やリンクを必須にしない汎用コンテナとして実装しています。HTML 版の6作例をすべて再現するコンポーネントではありません。

利用前に[共通の準備](./README.md#共通の準備)でデザイントークンを読み込んでください。`Card` は次回公開するバージョンに含まれます。

## 基本的な使い方

```svelte
<script lang="ts">
    import { Card } from '@sharelib-jp/digital-agency-components-svelte-implements';
</script>

<Card title="お知らせ" content="オンライン申請を受け付けています。" />
```

### props を省略してタグとして使う

```svelte
<script lang="ts">
    import { Card } from '@sharelib-jp/digital-agency-components-svelte-implements';
</script>

<Card>hoge</Card>

<Card title="">
    <p>見出しなしの本文です。</p>
    <a href="/guide">手続きガイドを読む</a>
</Card>
```

`title` を省略するか `title=""` にすると、見出し要素と見出し用の余白を出力しません。`content` を省略すると、タグで囲んだテキスト・HTML・コンポーネントを表示します。見出しだけを `title` prop で指定し、中身を子要素で渡すこともできます。

## Props

すべて任意です。`content` と子要素を両方指定すると、`content` が優先されます。明示的な `content=""` は子要素も非表示にします。`content` が未指定または `undefined` の場合にのみ子要素を表示します。

| 名前           | 型                                             | 既定値      | 説明                                                                                                             |
| -------------- | ---------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------- |
| `title`        | `string`                                       | `''`        | カード内の見出し。HTML の `title` 属性ではありません。                                                           |
| `content`      | `string \| Snippet \| undefined`               | `undefined` | 中身のテキスト、または引数なしの snippet。未指定なら子要素を表示します。文字列はエスケープし、改行を保持します。 |
| `children`     | `Snippet \| undefined`                         | `undefined` | `<Card>...</Card>` の中身。Svelte が自動的に渡す snippet。`content` が未指定の場合に表示します。                 |
| `headingLevel` | `'h1' \| 'h2' \| 'h3' \| 'h4' \| 'h5' \| 'h6'` | `'h2'`      | 見出し要素。文字サイズを変えずに文書の階層を指定できます。                                                       |
| `id`           | `string \| undefined`                          | `undefined` | 外側の `div` の ID。                                                                                             |
| `Class`        | `string`                                       | `''`        | 外側の `div` に追加する CSS クラス。大文字の `C` で指定します。                                                  |

`Snippet` は `svelte` が提供する型です。`CardProps` はパッケージ直下から import できます。追加の HTML 属性（`aria-*`、`data-*`、`style` など）は外側の `div` へ転送されます。クラスの追加には `class` ではなく `Class` を使います。

### props オブジェクトを渡す

```svelte
<script lang="ts">
    import { Card, type CardProps } from '@sharelib-jp/digital-agency-components-svelte-implements';

    const cardProps = {
        title: '必要な書類',
        content: '本人確認書類をご用意ください。',
        headingLevel: 'h3',
    } satisfies CardProps;
</script>

<Card {...cardProps} />
```

### 画像・リンク・ボタンなど任意の中身を渡す

中身を props で渡す場合は、`{#snippet ...}` で定義した snippet を `content` prop に指定できます。タグで囲む書き方と同様に、snippet 内では他のコンポーネント・HTML 要素・イベント処理を自由に組み合わせられます。

```svelte
<script lang="ts">
    import { Card } from '@sharelib-jp/digital-agency-components-svelte-implements';

    let count = 0;
</script>

{#snippet cardContent()}
    <p>申請する前に、次の書類をご確認ください。</p>
    <ul>
        <li>本人確認書類</li>
        <li>申請書</li>
    </ul>
    <a href="/guide">手続きガイドを読む</a>
    <button type="button" on:click={() => count += 1}>確認しました</button>
    <p>確認回数: {count}</p>
{/snippet}

<Card title="申請の準備" content={cardContent} />
```

## 表示・アクセシビリティ

- 幅は親要素に合わせます。複数列のレイアウトや最大幅は、親要素側で設定します。
- カード自体はクリック可能ではなく、フォーカスも受け取りません。操作は子要素や snippet 内のリンク・ボタンで指定してください。
- `headingLevel` は文書の見出し階層に合わせて選びます。空の `title` では見出しを出力しません。
- `content` の文字列を HTML として挿入する処理はありません。リッチな内容には snippet を使います。
- snippet 直下の要素は上下の margin をリセットし、要素間に余白を付けます。必要な画像のサイズ・代替テキストや、リンク・ボタンのラベルは呼び出し側で設定してください。
- 子要素は Svelte 5 の `children` snippet として受け取り、legacy の `<slot>` は使っていません。カスタムイベントやバインドはありません。子要素・snippet 内の状態は親コンポーネント側で管理します。
- 強制カラーモードでも枠線と文字を表示します。アニメーションはありません。

[コンポーネント一覧に戻る](./README.md)
