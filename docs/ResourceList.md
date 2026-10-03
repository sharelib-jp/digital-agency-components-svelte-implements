# リソースリスト（ResourceList）

資料や項目を、タイトル・説明・補足情報とともに一覧表示するコンポーネントです。通常表示、リンク、checkbox、radioを項目単位で選べます。本文の横に独立したアクションも配置できます。

導入と共通CSSの設定は[共通の準備](./README.md#共通の準備)を参照してください。

## 基本的な使い方

`items` に項目データを指定します。`interaction="whole"` のリンクでは本文がリンクになり、組み込みアクションボタンはそのリンクの外側に配置されます。

```svelte
<script lang="ts">
  import {
    ResourceList,
    type ResourceListAction,
    type ResourceListActionDetail,
    type ResourceListItem,
  } from '@sharelib-jp/digital-agency-components-svelte-implements';

  const guideAction: ResourceListAction = {
    label: '利用ガイドの操作',
    icon: 'menu',
  };
  const items: ResourceListItem[] = [
    {
      id: 'guide',
      type: 'link',
      title: '利用ガイド',
      href: '/documents/guide',
      label: '公開資料',
      supportText: '申請の手順と必要書類を確認できます。',
      subLabel: '2026年版',
      icon: true,
      action: guideAction,
    },
    {
      id: 'notice',
      title: '資料の更新予定',
      supportText: '次回の更新は10月です。',
    },
  ];
  let actionMessage = '';

  function handleAction(event: CustomEvent<ResourceListActionDetail>) {
    actionMessage = `${event.detail.item.title}のアクションを選びました。`;
  }
</script>

<ResourceList
  {items}
  interaction="whole"
  headingLevel="h3"
  aria-label="関連資料"
  on:action={handleAction}
/>
<p aria-live="polite">{actionMessage}</p>
```

アクションのアイコンは外観です。この例では通知を表示するだけで、メニューを開く処理はありません。

## Props

すべて省略可能です。

| Prop           | 型                                     | 既定値     | 必須   | 説明                                                                                                           |
| -------------- | -------------------------------------- | ---------- | ------ | -------------------------------------------------------------------------------------------------------------- |
| `items`        | `ResourceListItem[]`                   | `[]`       | いいえ | 表示する項目。checkbox／radioの操作時に新しい配列へ更新される。                                                |
| `style`        | `ResourceListStyle`                    | `'list'`   | いいえ | `'list'` は下罫線、`'frame'` は枠付き。項目の `style` で上書きできる。                                         |
| `interaction`  | `ResourceListInteraction`              | `'inline'` | いいえ | `'inline'` はタイトル／入力を操作、`'whole'` は本文全体を操作対象にする。項目の `interaction` で上書きできる。 |
| `headingLevel` | `'h2' \| 'h3' \| 'h4' \| 'h5' \| 'h6'` | `'h2'`     | いいえ | 通常項目とリンクのタイトル要素。checkbox／radioのタイトルは常に `p` 内の `label`。                             |
| `gap`          | `number`                               | `16`       | いいえ | 行間。数値を `gap / 16` の `rem` にして `--resource-list-gap` へ設定する。                                     |
| `square`       | `boolean`                              | `false`    | いいえ | 角丸をなくす。項目の `square` で上書きできる。                                                                 |
| `Class`        | `string`                               | `''`       | いいえ | 外側の `ul` に追加するクラス。大文字の `C`。                                                                   |

`style`・`interaction`・`square` は項目の値が未指定の場合に使う共通設定です。項目の `square: false` は、共通設定の `square: true` を上書きできます。

## 使用例

### checkboxの状態を受け取り、親でresetする

`bind:items` で変更後の配列を受け取ります。フォームのネイティブresetだけでは `items` は更新されないため、この例はresetを取り消して親から初期配列を設定します。

```svelte
<script lang="ts">
  import {
    ResourceList,
    type ResourceListChangeDetail,
    type ResourceListItem,
  } from '@sharelib-jp/digital-agency-components-svelte-implements';

  function initialItems(): ResourceListItem[] {
    return [
      {
        id: 'include-guide',
        type: 'checkbox',
        title: '利用ガイド',
        name: 'documents',
        value: 'guide',
        checked: false,
        supportText: '基本的な使い方を収録しています。',
      },
      {
        id: 'include-faq',
        type: 'checkbox',
        title: 'よくある質問',
        name: 'documents',
        value: 'faq',
        checked: false,
      },
      {
        id: 'include-archive',
        type: 'checkbox',
        title: '過去の資料',
        name: 'documents',
        value: 'archive',
        disabled: true,
      },
    ];
  }

  let items: ResourceListItem[] = initialItems();
  let selectedCount = 0;
  let message = '';
  $: selectedCount = items.filter((item) => item.type === 'checkbox' && item.checked).length;

  function handleChange(event: CustomEvent<ResourceListChangeDetail>) {
    message = `${event.detail.item.title}：${event.detail.checked ? '選択' : '解除'}`;
  }

  function resetSelection(event: Event) {
    event.preventDefault();
    items = initialItems();
    message = '選択をクリアしました。';
  }
</script>

<form on:reset={resetSelection}>
  <fieldset>
    <legend>対象資料を選択</legend>
    <ResourceList
      bind:items
      style="frame"
      interaction="whole"
      on:change={handleChange}
    />
  </fieldset>
  <button type="reset">選択をクリア</button>
</form>
<p>選択数：{selectedCount}</p>
<p aria-live="polite">{message}</p>
```

### 同じname・formのradioを同期してフォーム送信する

同一コンポーネント内で `name` と `form` が一致するradioは、1項目を選ぶと他の項目の `checked` が `false` に更新されます。例のネイティブsubmitは取り消し、フォームデータの確認だけを行います。

```svelte
<script lang="ts">
  import {
    ResourceList,
    type ResourceListChangeDetail,
    type ResourceListItem,
  } from '@sharelib-jp/digital-agency-components-svelte-implements';

  let items: ResourceListItem[] = [
    {
      id: 'delivery-online',
      type: 'radio',
      title: 'オンラインで受け取る',
      name: 'delivery',
      form: 'delivery-form',
      value: 'online',
      checked: true,
      required: true,
      describedBy: 'delivery-help',
    },
    {
      id: 'delivery-counter',
      type: 'radio',
      title: '窓口で受け取る',
      name: 'delivery',
      form: 'delivery-form',
      value: 'counter',
      required: true,
      describedBy: 'delivery-help',
    },
  ];
  let lastChange = '';
  let submittedValue = '';

  function handleChange(event: CustomEvent<ResourceListChangeDetail>) {
    lastChange = `${event.detail.item.title}を選びました。`;
  }

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    submittedValue = String(new FormData(form).get('delivery') ?? '');
  }
</script>

<form id="delivery-form" on:submit={handleSubmit}>
  <fieldset>
    <legend>受け取り方法</legend>
    <p id="delivery-help">いずれか1つを選択してください。</p>
    <ResourceList bind:items interaction="whole" on:change={handleChange} />
  </fieldset>
  <button type="submit">選択を確認</button>
</form>
<p aria-live="polite">{lastChange}</p>
<p>送信値：{submittedValue}</p>
```

### スロットで装飾アイコンと独立したダウンロードリンクを配置する

`icon` は本文内、`action` は本文の外側に配置されます。本文全体をリンクにしても、アクションのリンクがその内側に入らない構造です。例のPDFは利用側で用意してください。

```svelte
<script lang="ts">
  import {
    ResourceList,
    type ResourceListInteraction,
    type ResourceListItem,
    type ResourceListStyle,
  } from '@sharelib-jp/digital-agency-components-svelte-implements';

  const style: ResourceListStyle = 'frame';
  const interaction: ResourceListInteraction = 'whole';
  const items: ResourceListItem[] = [
    {
      id: 'application-guide',
      type: 'link',
      title: '申請ガイド',
      href: '/documents/application-guide.pdf',
      subLabel: 'PDF',
    },
    {
      id: 'application-form',
      type: 'link',
      title: '申請書',
      href: '/documents/application-form.pdf',
      subLabel: 'PDF',
      interaction: 'inline',
      square: true,
    },
  ];
</script>

<ResourceList {items} {style} {interaction} headingLevel="h3" aria-label="申請用資料">
  <svelte:fragment slot="icon" let:item let:index>
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
      data-resource={item.id}
      data-position={index}
    >
      <path d="M6 3h8l4 4v14H6V3Z M14 3v5h4 M9 12h6 M9 16h6" />
    </svg>
  </svelte:fragment>
  <svelte:fragment slot="action" let:item let:index>
    {#if item.type === 'link'}
      <a href={item.href} download aria-label={`${index + 1}件目：${item.title}をダウンロード`}>
        保存
      </a>
    {/if}
  </svelte:fragment>
</ResourceList>
```

## 型・bind・イベント・スロット

### 公開型と項目の制約

パッケージルートから名前付きで `import type` できる型は、次の6つです。

| 型                         | 定義・用途                                                                 |
| -------------------------- | -------------------------------------------------------------------------- |
| `ResourceListStyle`        | `'list' \| 'frame'`。外観。                                                |
| `ResourceListInteraction`  | `'inline' \| 'whole'`。本文の操作範囲。                                    |
| `ResourceListItem`         | 共通フィールドと、`type` に応じたフィールドを組み合わせた判別可能なunion。 |
| `ResourceListAction`       | 組み込みアクションの設定。                                                 |
| `ResourceListChangeDetail` | 入力の変更通知。                                                           |
| `ResourceListActionDetail` | 組み込みアクションの通知。                                                 |

実装内部の `ResourceListItemBase` と `ResourceListControl` は公開exportではありません。型が必要な場合は `ResourceListItem` を使い、`item.type` で分岐してください。

#### 全項目に共通のデータフィールド

| フィールド    | 型                        | 必須   | 省略時・動作                                                                                                                 |
| ------------- | ------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `id`          | `string`                  | はい   | 描画キー。checkbox／radioでは入力IDと `label` の関連付けにも使う。通常項目・リンクの本文要素へID属性を設定するわけではない。 |
| `title`       | `string`                  | はい   | タイトル。通常／リンクでは指定した見出し、入力では `p` 内の `label` に表示。                                                 |
| `label`       | `string`                  | いいえ | タイトルの上に表示する補助ラベル。空または未指定なら非表示。                                                                 |
| `supportText` | `string`                  | いいえ | タイトルの下の説明。空または未指定なら非表示。改行はCSSの `white-space: pre-line` で反映。                                   |
| `subLabel`    | `string`                  | いいえ | 本文の末尾側に表示する補足情報。空または未指定なら非表示。                                                                   |
| `icon`        | `boolean`                 | いいえ | `true` で既定の装飾アイコンを表示。`icon` スロットがある場合はこの値に関係なくアイコン領域を描画。                           |
| `style`       | `ResourceListStyle`       | いいえ | 未指定なら共通の `style` prop。                                                                                              |
| `interaction` | `ResourceListInteraction` | いいえ | 未指定なら共通の `interaction` prop。通常項目は指定しても操作可能にはならない。                                              |
| `square`      | `boolean`                 | いいえ | 未指定なら共通の `square` prop。`true` で角丸なし。                                                                          |
| `action`      | `ResourceListAction`      | いいえ | 組み込みアクションボタンの設定。未指定ならボタンなし。`action` スロットがあればそちらを使用。                                |

文字列はテキストとして表示します。HTML文字列を描画するAPIや、タイトル／説明を置換するスロットはありません。

#### typeごとのデータフィールド

| フィールド | 対象     | 型                               | 必須   | 説明                                                                                      |
| ---------- | -------- | -------------------------------- | ------ | ----------------------------------------------------------------------------------------- |
| `type`     | 通常項目 | `'plain'`                        | いいえ | 未指定でも通常項目。リンクや入力は描画しない。                                            |
| `type`     | リンク   | `'link'`                         | はい   | リンク用の判別値。                                                                        |
| `href`     | リンク   | `string`                         | はい   | リンク先。                                                                                |
| `target`   | リンク   | `HTMLAnchorAttributes['target']` | いいえ | ネイティブのリンク属性。`HTMLAnchorAttributes` は `svelte/elements` の型。                |
| `rel`      | リンク   | `string`                         | いいえ | ネイティブのリンク属性。`target === '_blank'` なら指定値へ `noopener noreferrer` を追加。 |
| `type`     | checkbox | `'checkbox'`                     | はい   | checkbox用の判別値。                                                                      |
| `name`     | checkbox | `string`                         | いいえ | 送信フィールド名。未指定だとネイティブフォームデータに含まれない。                        |
| `type`     | radio    | `'radio'`                        | はい   | radio用の判別値。                                                                         |
| `name`     | radio    | `string`                         | はい   | ネイティブグループと内部状態同期に使う名前。                                              |

通常項目にはリンク用／入力用のフィールド、リンクには入力用のフィールドを定義していません。トップレベルの `disabled` propもありません。無効状態は入力項目の `disabled`、またはアクションの `disabled` で指定します。

#### checkbox・radio共通の全データフィールド

| フィールド    | 型        | 必須   | 省略時・動作                                                                                                                  |
| ------------- | --------- | ------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `checked`     | `boolean` | いいえ | 入力では `false`。操作時に項目の値が更新される。                                                                              |
| `disabled`    | `boolean` | いいえ | 入力では `false`。ネイティブの `disabled`。                                                                                   |
| `required`    | `boolean` | いいえ | 入力では `false`。ネイティブの必須指定。                                                                                      |
| `value`       | `string`  | いいえ | 未指定なら `item.id`。ネイティブの送信値。                                                                                    |
| `form`        | `string`  | いいえ | ネイティブの `form` 属性。関連付けるフォームのID。未指定なら通常のフォーム所有関係。radioの内部同期ではこの指定値も比較する。 |
| `invalid`     | `boolean` | いいえ | 未指定ならエラー指定なし。checkboxは `aria-invalid="true"`、radioは `data-invalid` を設定する。                               |
| `describedBy` | `string`  | いいえ | 入力の `aria-describedby`。説明／エラーメッセージのIDを指定。                                                                 |

`readonly`、checkboxの `indeterminate`、入力ごとの任意属性を渡すフィールドはありません。

#### ResourceListActionの全フィールド

| フィールド | 型                     | 必須   | 省略時・動作                                                          |
| ---------- | ---------------------- | ------ | --------------------------------------------------------------------- |
| `label`    | `string`               | はい   | アイコンだけのボタンの `aria-label`。                                 |
| `icon`     | `'menu' \| 'download'` | いいえ | `'download'` ならダウンロードの図柄、それ以外／未指定なら三点の図柄。 |
| `disabled` | `boolean`              | いいえ | アクション自身を無効にする。                                          |

`interaction="whole"` の無効なcheckbox／radioでは、組み込みアクションも無効になります。`inline` の場合は入力が無効でも、アクション自身の `disabled` がなければ使用できます。`icon: 'download'` を指定してもダウンロード処理は追加されません。

### bindとネイティブ属性／イベント

- `bind:items` で入力操作後の配列を受け取れます。ハンドラーは `items.map(...)` で新しい配列を作り、変更対象の項目も新しいオブジェクトにします。入力ごとの `bind:checked` propはありません。
- 通常のSvelteの `export let` によるbindです。表示設定のpropsもbindの対象にできますが、入力操作で内部更新するpropは `items` です。
- `$$restProps` は外側の `ul` に転送されます。`aria-label`・`id`・`data-*` などを外側のリストへ付けられます。内部のリンクや入力へは転送しません。
- 外側の `class` と `role` は内部指定が優先されます。追加クラスには `class` でなく `Class` を使ってください。`role` は `list`、行間のカスタムプロパティは `gap` によって設定されます。
- ネイティブ `click`・`input`・`change`・`reset` のイベント転送はありません。`on:change` は下記のカスタムイベントです。内部DOMやフォーカス操作の公開APIもありません。

### イベント

どちらも**cancelableではなく**、DOMをbubbleしません。`event.preventDefault()` による状態の巻き戻しはできません。

| イベント | detail                     | タイミング                                                            |
| -------- | -------------------------- | --------------------------------------------------------------------- |
| `change` | `ResourceListChangeDetail` | 有効なcheckbox／radioのネイティブchangeを受け、`items` 更新後に通知。 |
| `action` | `ResourceListActionDetail` | 組み込みアクションボタンのclick時。                                   |

`ResourceListChangeDetail` の全フィールドは次のとおりです。

| フィールド      | 型                   | 内容                                         |
| --------------- | -------------------- | -------------------------------------------- |
| `item`          | `ResourceListItem`   | 更新後の変更対象項目。                       |
| `index`         | `number`             | 変更対象の0始まりの配列位置。                |
| `checked`       | `boolean`            | 元の入力から読み取った変更後のチェック状態。 |
| `items`         | `ResourceListItem[]` | 同期処理後の配列。                           |
| `originalEvent` | `Event`              | 元のネイティブchangeイベント。               |

`ResourceListActionDetail` の全フィールドは次のとおりです。

| フィールド      | 型                 | 内容                          |
| --------------- | ------------------ | ----------------------------- |
| `item`          | `ResourceListItem` | アクションを押した項目。      |
| `index`         | `number`           | 対象項目の0始まりの配列位置。 |
| `originalEvent` | `MouseEvent`       | 元のclickイベント。           |

リンクの選択や通常項目のクリックは、これらのカスタムイベントを発火しません。アクションの実処理は利用側で実装します。

### radio同期の範囲

- radioがチェックされたとき、**同一の `ResourceList` の `items` 内**にあるradioで、`name` と `form` の指定値がともに厳密一致する項目の `checked` を `false` にします。チェックされた項目を含む更新後の配列を `change` で1回通知します。
- `form` 未指定同士は一致しますが、未指定と明示したフォームIDは、実際のフォーム所有者が同じでも内部比較では一致しません。1グループ内の指定方法を揃えてください。
- 別の `ResourceList` や、外部のradioのデータは同期しません。ブラウザーが同じネイティブグループの別入力を解除しても、別コンポーネントの配列状態を更新する仕組みはありません。
- 初期データや親からの再代入で複数のradioを `checked: true` にした場合に、配列を自動補正する処理もありません。初期選択とコンポーネントをまたぐグループ状態は親で管理してください。

### スロットと安全な構造

| 名前     | slot props                                | 内容・配置                                                            |
| -------- | ----------------------------------------- | --------------------------------------------------------------------- |
| `icon`   | `item: ResourceListItem`、`index: number` | 各項目の本文内の装飾アイコン。外側の `span` は `aria-hidden="true"`。 |
| `action` | `item: ResourceListItem`、`index: number` | 各項目の本文の外側にあるアクション領域。                              |

デフォルトスロットはありません。スロットを指定すると全項目で対応領域が描画され、スロット未指定時の既定アイコン／アクションに代わります。必要なら `item` や `index` で表示を分岐してください。

- `icon` は装飾専用です。リンクやボタン、フォーム入力を入れないでください。`whole` のリンクではアンカー内に入り、入力の全体操作でも操作領域に重なります。重要な情報や操作は `title` などの可視テキスト、または `action` へ置きます。
- リンクの `inline` ではタイトルだけがアンカー、`whole` では本文がアンカーです。組み込みアクションと `action` スロットは本文と兄弟なので、リンク／ボタンをアンカーやlabelの中へ入れずに配置できます。
- 入力の `whole` はタイトルのlabelの疑似要素で本文全体へ操作領域を広げます。アクション領域はこの本文の外側です。
- `action` スロット内の操作は `action` イベントを自動発火しません。イベント処理、ラベル、無効状態、リンクの `rel` などは利用側で設定してください。組み込みボタンの無効状態もスロットには自動適用されません。

## 注意点

- 項目の `id` は一意にしてください。checkbox／radioではページ内で一意の入力IDとして使うため、複数のリスト間でも衝突させないでください。親が安定したIDを渡すことでSSR時のlabelの対応も保てます。
- checkboxの `invalid` はARIA状態とエラー色を設定しますが、radioの `invalid` は `data-invalid` によるエラー色だけで、`aria-invalid` は設定しません。両者を同じARIA APIとして扱わないでください。`invalid` 自体はネイティブ制約検証やエラーメッセージを追加しません。
- `describedBy` には実在する説明要素のIDを指定してください。radioグループのラベルやエラー説明が必要な場合は、利用側で `fieldset`／`legend` と説明文を配置します。
- `ResourceList` は `form` を生成しません。ネイティブ送信では、有効でチェックされた、`name` を持つ入力が対象です。checkboxの `required` はその入力自体の必須指定で、「この一覧から1つ以上」という検証を実装するものではありません。
- 入力の `checked` はネイティブchangeを受けて配列へ反映する実装です。フォームのネイティブresetにはchangeが伴わず、配列を更新するresetハンドラーもありません。親の状態も戻す必要があれば、使用例のようにresetを取り消して `items` を再設定してください。
- `disabled` は入力と組み込みアクションの所定の動作に限られます。通常項目やリンクを無効にするデータフィールド、全体を読み取り専用にするAPIはありません。
- `headingLevel` は通常／リンク項目だけに使われます。入力項目を見出しに変更するAPIではありません。ページの見出し階層に合わせて設定してください。
- メニュー表示、ダウンロード、選択件数制限、ページ送り、データ取得は実装されていません。アクションの図柄や `action` イベントだけで実処理が行われるわけではありません。
