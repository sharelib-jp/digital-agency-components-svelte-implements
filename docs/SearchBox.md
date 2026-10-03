# 検索ボックス（SearchBox）

検索語の入力と送信に使う、`role="search"` を持つフォームです。検索対象の選択と、詳細条件を入れる開閉領域を追加できます。検索結果の取得・表示は行いません。

導入と共通CSSの設定は[共通の準備](./README.md#共通の準備)を参照してください。

## 基本的な使い方

`bind:value` で検索語を受け取り、`on:search` で送信を処理します。既定ではブラウザーのフォーム送信を止めます。

```svelte
<script lang="ts">
  import {
    SearchBox,
    type SearchBoxSearchDetail,
  } from '@sharelib-jp/digital-agency-components-svelte-implements';

  let value = '';
  let submittedValue = '';

  function handleSearch(event: CustomEvent<SearchBoxSearchDetail>) {
    submittedValue = event.detail.value;
  }
</script>

<SearchBox
  id="site-search"
  label="検索語"
  formLabel="サイト内検索"
  placeholder="キーワードを入力"
  bind:value
  on:search={handleSearch}
/>
<p aria-live="polite">送信した検索語：{submittedValue}</p>
```

## Props

すべて省略可能です。`id` はフォームではなく検索入力に設定されます。

| Prop             | 型                                                 | 既定値               | 必須   | 説明                                                                            |
| ---------------- | -------------------------------------------------- | -------------------- | ------ | ------------------------------------------------------------------------------- |
| `id`             | `string \| undefined`                              | `undefined`          | いいえ | 検索入力のID。                                                                  |
| `size`           | `'lg' \| 'md' \| 'sm'`                             | `'lg'`               | いいえ | 入力・検索ボタンのサイズ。`sm` では検索対象のラベルが視覚的に非表示になります。 |
| `value`          | `string`                                           | `''`                 | いいえ | 検索語。入力との双方向バインドに対応。                                          |
| `name`           | `string`                                           | `'q'`                | いいえ | 検索入力の送信フィールド名。                                                    |
| `label`          | `string`                                           | `'検索'`             | いいえ | 検索入力の、視覚的に非表示のラベル。                                            |
| `formLabel`      | `string`                                           | `'サイト内検索'`     | いいえ | フォームの `aria-label`。                                                       |
| `ariaLabelledby` | `string \| undefined`                              | `undefined`          | いいえ | 検索入力の `aria-labelledby`。外部ラベルのIDを指定。                            |
| `placeholder`    | `string`                                           | `''`                 | いいえ | 検索入力のプレースホルダー。                                                    |
| `autocomplete`   | `NonNullable<HTMLInputAttributes['autocomplete']>` | `'off'`              | いいえ | 検索入力のネイティブ属性。`HTMLInputAttributes` は `svelte/elements` の型。     |
| `required`       | `boolean`                                          | `false`              | いいえ | 検索入力を必須にする。                                                          |
| `readonly`       | `boolean`                                          | `false`              | いいえ | 検索入力だけを読み取り専用にする。                                              |
| `disabled`       | `boolean`                                          | `false`              | いいえ | 検索入力・検索対象・検索／resetボタン・詳細条件の `fieldset` を無効にする。     |
| `action`         | `string \| undefined`                              | `undefined`          | いいえ | フォームの送信先。ネイティブ送信には `preventDefault={false}` が必要。          |
| `method`         | `'get' \| 'post'`                                  | `'get'`              | いいえ | フォームの送信方法。                                                            |
| `preventDefault` | `boolean`                                          | `true`               | いいえ | submit時にネイティブ送信を止める。`search` の発火は止めない。                   |
| `buttonLabel`    | `string`                                           | `'検索'`             | いいえ | 通常領域と詳細領域の検索ボタンの文言。                                          |
| `scopeOptions`   | `SearchScopeOption[]`                              | `[]`                 | いいえ | 検索対象の選択肢。空配列ではセレクトを描画しない。                              |
| `scope`          | `string`                                           | `''`                 | いいえ | 選択した検索対象の値。双方向バインドと選択肢に合わせた補正に対応。              |
| `scopeName`      | `string`                                           | `'scope'`            | いいえ | 検索対象セレクトの送信フィールド名。                                            |
| `scopeLabel`     | `string`                                           | `'検索対象'`         | いいえ | 検索対象セレクトのラベル。                                                      |
| `detailLabel`    | `string`                                           | `'詳細検索'`         | いいえ | 詳細領域の `summary` の文言。                                                   |
| `detailOpen`     | `boolean`                                          | `false`              | いいえ | 詳細領域の開閉状態。`detail` スロットがある場合だけ反映。                       |
| `resetLabel`     | `string`                                           | `'検索条件をクリア'` | いいえ | 詳細領域のresetボタンの文言。空文字にする処理を意味するものではない。           |

## 使用例

### 検索対象を選んで送信する

検索対象の状態も `bind:scope` で受け取れます。送信データには、検索語の `name` と検索対象の `scopeName` が使われます。

```svelte
<script lang="ts">
  import {
    SearchBox,
    type SearchBoxSearchDetail,
    type SearchScopeOption,
  } from '@sharelib-jp/digital-agency-components-svelte-implements';

  const scopeOptions: SearchScopeOption[] = [
    { value: 'all', label: 'すべて' },
    { value: 'documents', label: '資料' },
    { value: 'archived', label: '過去の情報', disabled: true },
  ];
  let value = '';
  let scope = 'all';
  let submission = '';

  function handleSearch(event: CustomEvent<SearchBoxSearchDetail>) {
    const { value: query, scope: category, formData } = event.detail;
    submission = `${category}：${query}（送信分類：${String(formData.get('category') ?? '')}）`;
  }
</script>

<SearchBox
  id="document-search"
  size="md"
  label="資料の検索語"
  formLabel="資料検索"
  scopeName="category"
  {scopeOptions}
  bind:value
  bind:scope
  on:search={handleSearch}
/>
<p aria-live="polite">{submission}</p>
```

### 詳細条件を追加し、明示的に空の条件へ戻す

この例はcancelableな `reset` を取り消し、親の状態を更新します。ブラウザーの既定値へ戻すネイティブresetとは別の処理です。

```svelte
<script lang="ts">
  import {
    SearchBox,
    type SearchBoxSearchDetail,
    type SearchScopeOption,
  } from '@sharelib-jp/digital-agency-components-svelte-implements';

  const scopeOptions: SearchScopeOption[] = [
    { value: 'all', label: 'すべて' },
    { value: 'documents', label: '資料' },
  ];
  let value = '';
  let scope = 'all';
  let detailOpen = true;
  let publishedOnly = false;
  let submission = '';

  function handleSearch(event: CustomEvent<SearchBoxSearchDetail>) {
    const { value: query, formData } = event.detail;
    submission = `${query}：${formData.has('published') ? '公開済みのみ' : 'すべて'}`;
  }

  function clearConditions(event: CustomEvent<{ originalEvent: Event }>) {
    event.preventDefault();
    value = '';
    scope = 'all';
    publishedOnly = false;
    submission = '';
  }
</script>

<SearchBox
  id="advanced-search"
  label="検索語"
  formLabel="詳細条件付き検索"
  {scopeOptions}
  bind:value
  bind:scope
  bind:detailOpen
  on:search={handleSearch}
  on:reset={clearConditions}
>
  <label slot="detail">
    <input type="checkbox" name="published" value="yes" bind:checked={publishedOnly} />
    公開済みの資料だけを検索
  </label>
</SearchBox>
<p>詳細条件：{detailOpen ? '表示中' : '非表示'}</p>
<p aria-live="polite">{submission}</p>
```

### ブラウザーのGETフォームとして送信する

`preventDefault={false}` でネイティブ送信を許可します。この例の送信先 `/search` は利用側で用意する必要があります。

```svelte
<script lang="ts">
  import { SearchBox } from '@sharelib-jp/digital-agency-components-svelte-implements';

  let value = '';
</script>

<h2 id="search-heading">公開資料を検索</h2>
<SearchBox
  id="native-search"
  label="資料の検索語"
  ariaLabelledby="search-heading"
  formLabel="公開資料検索"
  action="/search"
  method="get"
  name="query"
  required
  preventDefault={false}
  bind:value
/>
```

## 型・bind・イベント・スロット

### 公開型と選択肢

`SearchScopeOption` と `SearchBoxSearchDetail` はパッケージルートから名前付きで `import type` できます。

| `SearchScopeOption` のフィールド | 型        | 必須   | 説明                               |
| -------------------------------- | --------- | ------ | ---------------------------------- |
| `value`                          | `string`  | はい   | 選択値。                           |
| `label`                          | `string`  | はい   | 選択肢の表示文言。                 |
| `disabled`                       | `boolean` | いいえ | 選択肢を無効にする。省略時は有効。 |

`scopeOptions` が空でなく、現在の `scope` が有効な選択肢に一致しない場合は、先頭の有効な選択肢の `value` に補正されます。全選択肢が無効なら `scope` は `''` に補正され、セレクトも無効になります。空配列ではこの補正は行われません。選択値が区別できるように `value` を設定してください。

### bindとネイティブ属性

- `bind:value`：検索入力の変更を親へ反映します。
- `bind:scope`：選択の変更と、選択肢変更による補正を親へ反映します。
- `bind:detailOpen`：ネイティブ `details` の開閉を親へ反映します。`detail` スロットがないと開閉領域自体を描画しません。
- これらは通常のSvelteの `export let` によるbindです。DOM要素を受け取る専用propや公開メソッドはありません。
- Props表にある属性だけが、指定した内部要素へ設定されます。`$$restProps` による任意属性の転送はなく、`class`・`aria-describedby` などを任意に検索入力へ渡すAPIはありません。
- ネイティブ `input`・`change`・`submit`・`reset` のイベント転送はありません。`on:reset` は下記のカスタムイベントです。

### イベント

| イベント | detail                     | cancelable | タイミング                                                                      |
| -------- | -------------------------- | ---------- | ------------------------------------------------------------------------------- |
| `search` | `SearchBoxSearchDetail`    | はい       | 無効でないフォームのsubmit時。                                                  |
| `reset`  | `{ originalEvent: Event }` | はい       | 無効でないフォームのネイティブreset処理前。公開された専用detail型はありません。 |

`SearchBoxSearchDetail` の全フィールドは次のとおりです。

| フィールド      | 型            | 内容                                                                        |
| --------------- | ------------- | --------------------------------------------------------------------------- |
| `value`         | `string`      | submit時の検索語。                                                          |
| `scope`         | `string`      | 有効な検索対象セレクトがある場合の値。セレクトがない、または無効なら `''`。 |
| `formData`      | `FormData`    | 内部フォームから `new FormData(form)` で作ったデータ。詳細条件も含む。      |
| `originalEvent` | `SubmitEvent` | 元のネイティブsubmitイベント。                                              |

- `search` の `event.preventDefault()` はネイティブ送信を中止します。`preventDefault={false}` の場合も中止できます。既定の `preventDefault={true}` では、`originalEvent` は `search` の発火前に既に取り消されています。
- `reset` の `event.preventDefault()` はネイティブresetを中止します。resetハンドラーは `value`・`scope` を空にする代入を行っていません。取り消さなければブラウザーの既定値へのresetが行われ、Svelteのネイティブbindによって入力／選択の状態も同期されます。必ず空にしたい場合は使用例のように取り消して状態を更新してください。
- `disabled` のときはネイティブsubmit／resetを止め、どちらのカスタムイベントも発火しません。
- ネイティブ制約検証で送信が止まればsubmit自体が発生せず、`search` も発火しません。`formData` はネイティブの成功したフォームコントロールに従い、無効な入力や未選択のcheckboxなどは含みません。送信ボタンを第2引数に渡す `FormData` の生成ではありません。
- カスタムイベントはDOMをbubbleしません。コンポーネントに `on:search`・`on:reset` を付けて購読します。

### スロット

| 名前     | slot props | 内容                                                               |
| -------- | ---------- | ------------------------------------------------------------------ |
| `detail` | なし       | 詳細条件のフォームコントロール。内部の `fieldset` に配置されます。 |

デフォルトスロットはありません。`detail` を指定すると `details` と詳細側の検索／resetボタンが描画されます。閉じていても詳細条件はDOMに残るため、有効な `name` 付きコントロールは送信データに含まれます。

## 注意点

- 内部に `form` を描画するので、別の `form` の内側に配置しないでください。`detail` スロットにもフォームを入れないでください。
- `readonly` は検索語だけに作用します。検索対象・詳細条件・検索／resetボタンは使え、検索語も送信対象です。`disabled` とは異なります。`disabled` でも詳細の `summary` の開閉そのものは無効になりません。
- `required` は検索語だけの属性です。詳細条件の必須指定やラベルは、スロット内のコントロールに利用側で設定します。
- `ariaLabelledby` を使う場合は、実在するラベル要素のIDを渡してください。フォームの名前は別の `formLabel` です。プレースホルダーはラベルの代替ではありません。
- 詳細領域を開くと通常領域の検索ボタンはCSSの `visibility: hidden` になり、詳細側の検索ボタンを使います。resetボタンは詳細領域にのみ存在します。
- ネイティブresetは「既定値に戻す」処理で、必ず空にする処理ではありません。`detailOpen` を閉じる処理もありません。明示的なクリアでは、親が管理するスロットの状態も合わせて更新してください。
- 検索入力のブラウザー組み込みクリアボタンはCSSで非表示です。検索・resetに伴う通信、結果表示、状態の保存は実装されていません。
