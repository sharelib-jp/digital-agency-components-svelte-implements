# モーダルダイアログ（ModalDialog）

ネイティブの `<dialog>` を使い、確認や入力のためのモーダルを表示します。`bind:open` による制御、ネイティブdialogの開閉との同期、初期フォーカス、閉じるときのフォーカス復帰、本文や操作のslotに対応しています。

導入と共通CSSの設定は[共通の準備](./README.md#共通の準備)を参照してください。

## 基本的な使い方

一意の `id` が必須です。`open` を `true` にすると、マウント後に内部の `<dialog>` に対して `showModal()` を呼び出します。トリガーはネイティブの `<button>` を使います。

```svelte
<script lang="ts">
  import { ModalDialog } from '@sharelib-jp/digital-agency-components-svelte-implements';

  let open = false;
</script>

<button type="button" on:click={() => (open = true)}>
  申請前の確認を開く
</button>

<ModalDialog
  id="modal-confirm-basic"
  bind:open
  heading="申請前の確認"
  description="入力内容と添付書類を確認してください。"
  message="準備ができたら、このダイアログを閉じて申請に進んでください。"
  actionLabel="確認しました"
/>
```

既定の初期フォーカスは見出しです。ヘッダーの「閉じる」、既定アクションの「確認しました」、Escapeのいずれでも閉じられます。閉じると、開く前にフォーカスされていた要素がまだ接続されていればそこへフォーカスを戻します。

## Props

| Prop             | 型                    | 必須   | デフォルト      | 説明                                                                                     |
| ---------------- | --------------------- | ------ | --------------- | ---------------------------------------------------------------------------------------- |
| `id`             | `string`              | はい   | なし            | ルートの `<dialog>` のID。内部の見出し・説明のID生成にも使います。                       |
| `Class`          | `string`              | いいえ | `''`            | ルートに追加するクラス。大文字の `C` です。                                              |
| `open`           | `boolean`             | いいえ | `false`         | 開閉状態。`bind:open` に対応します。HTMLの `open` 属性を直接描画するpropではありません。 |
| `heading`        | `string`              | いいえ | `'タイトル'`    | 内部の `<h2>` の内容。heading slotが優先されます。                                       |
| `message`        | `string`              | いいえ | `''`            | 本文の文字列。デフォルトslotが優先されます。自動的に `<p>` では包みません。              |
| `description`    | `string \| null`      | いいえ | `null`          | 説明文。空でない値またはdescription slotがある場合に説明用の `<p>` を表示します。        |
| `describedBy`    | `string \| undefined` | いいえ | `undefined`     | `aria-describedby` に追加するID参照。複数なら空白区切り。内部の説明IDと併記します。      |
| `hasCloseButton` | `boolean`             | いいえ | `true`          | ヘッダーの閉じるボタンを表示します。Escapeや他の開閉APIは無効化しません。                |
| `closeLabel`     | `string`              | いいえ | `'閉じる'`      | ヘッダーの閉じるボタンの表示テキスト。                                                   |
| `hasActions`     | `boolean`             | いいえ | `true`          | 操作領域を表示します。`false` の場合はactions slotも描画しません。                       |
| `actionLabel`    | `string`              | いいえ | `'OK'`          | actions slot未指定時の既定ボタンのテキスト。                                             |
| `scroll`         | `'outer' \| 'inner'`  | いいえ | `'outer'`       | 外側のdialog領域または内側のコンテンツ領域をスクロールします。                           |
| `fixedHeader`    | `boolean`             | いいえ | `false`         | `scroll="inner"` 時にヘッダーをスクロール領域の外に置きます。                            |
| `fixedActions`   | `boolean`             | いいえ | `false`         | `scroll="inner"` 時に操作領域をスクロール領域の外に置きます。                            |
| `width`          | `string`              | いいえ | `'fit-content'` | パネル幅を指定するCSS値。内部の `--modal-dialog-width` に設定します。                    |
| `initialFocus`   | `HTMLElement \| null` | いいえ | `null`          | 開いたときのフォーカス先。内部に含まれる要素だけを採用し、それ以外は見出しを使います。   |

### スクロールのバリエーション

- `outer`：長いパネル全体を外側のdialog領域でスクロールします。`fixedHeader` / `fixedActions` の指定は適用されません。
- `inner`、固定なし：パネル内部全体をスクロールします。
- `inner`、いずれかの固定あり：専用のスクロール領域を生成します。`fixedHeader={true}` のヘッダーと、`fixedActions={true}` の操作領域はその外側に配置します。固定しないヘッダー・操作領域はスクロール領域内に入ります。
- `fixedActions` を指定しても、`hasActions={false}` なら操作領域は表示されません。

パネルには利用可能な幅に収まる最大幅と、画面幅に応じた最小幅があります。`width` を指定しても、表示領域の制約を超えてその値を保証するものではありません。

## 使用例

### 内側スクロール・固定ヘッダーと操作・初期フォーカス

本文とactions slotの両方から `close(returnValue)` を使えます。初期フォーカス先は `bind:this` で取得した内部のネイティブボタンです。

```svelte
<script lang="ts">
  import { ModalDialog } from '@sharelib-jp/digital-agency-components-svelte-implements';

  let open = false;
  let initialFocus: HTMLElement | null = null;
  let result = '未確認';

  const sections = [
    {
      title: '申請内容の確認',
      body: '送信する情報に誤りがないことを確認してください。入力内容は受付後の審査に使用します。',
    },
    {
      title: '添付書類の準備',
      body: '文字が読める画像やPDFを添付してください。必要なページがそろっていることを確認してください。',
    },
    {
      title: '連絡先の登録',
      body: '受付結果や追加確認の連絡は、登録したメールアドレスに送ります。受信できるアドレスを指定してください。',
    },
    {
      title: '提出期限',
      body: '手続きごとの提出期限を確認してください。期限を過ぎた申請の扱いは担当窓口にお問い合わせください。',
    },
    {
      title: '受付結果の確認',
      body: '申請後は受付番号を保管してください。受付番号を使って申請状況を確認できます。',
    },
    {
      title: '内容の修正',
      body: '提出後に修正が必要になった場合は、受付番号を添えて担当窓口に連絡してください。',
    },
  ];
</script>

<button type="button" on:click={() => (open = true)}>申請時の注意事項を読む</button>

<ModalDialog
  id="modal-terms-scroll"
  bind:open
  scroll="inner"
  fixedHeader
  fixedActions
  width="42rem"
  {initialFocus}
  let:close
  on:close={(event) => (result = event.detail.returnValue || '閉じました')}
>
  <span slot="heading">申請時の注意事項</span>
  <span slot="description">内容を確認し、同意する場合は「同意して閉じる」を選んでください。</span>

  <button
    type="button"
    bind:this={initialFocus}
    on:click={() => close('read-later')}
  >
    後で確認する
  </button>

  {#each sections as section}
    <h3>{section.title}</h3>
    <p>{section.body}</p>
  {/each}

  <svelte:fragment slot="actions" let:close={closeAction}>
    <button
      type="button"
      class="dads-button"
      data-size="lg"
      data-type="outline"
      on:click={() => closeAction('cancelled')}
    >
      同意せず閉じる
    </button>
    <button
      type="button"
      class="dads-button"
      data-size="lg"
      data-type="solid-fill"
      on:click={() => closeAction('agreed')}
    >
      同意して閉じる
    </button>
  </svelte:fragment>
</ModalDialog>

<p aria-live="polite">確認結果：{result}</p>
```

### 未保存の変更がある場合だけEscapeを抑止する

`cancel` の **CustomEvent自身**に `preventDefault()` を呼びます。`event.detail` のネイティブイベントは内部ですでに抑止されています。ヘッダーの閉じるボタンと操作領域を非表示にしたこの例でも、保存・破棄の明示的な終了手段を本文内に用意しています。

```svelte
<script lang="ts">
  import { ModalDialog } from '@sharelib-jp/digital-agency-components-svelte-implements';

  let open = false;
  let draft = '';
  let saved = '';
  let cancelNotice = '';
  let lastClose = 'まだ閉じていません';

  $: dirty = draft !== saved;

  function handleCancel(event: CustomEvent<Event>) {
    if (dirty) {
      event.preventDefault();
      cancelNotice = '未保存の変更があります。保存するか、変更を破棄してください。';
    }
  }
</script>

<button
  type="button"
  on:click={() => {
    cancelNotice = '';
    open = true;
  }}
>
  メモを編集する
</button>

<ModalDialog
  id="modal-draft-cancel"
  bind:open
  heading="メモの編集"
  description="変更がある場合、Escapeでは閉じません。保存または破棄を選んでください。"
  describedBy="modal-draft-save-status"
  hasCloseButton={false}
  hasActions={false}
  let:close
  on:cancel={handleCancel}
  on:close={(event) => {
    lastClose = `${event.detail.reason} / ${event.detail.returnValue || '戻り値なし'}`;
  }}
>
  <label for="modal-draft-text">メモ</label>
  <textarea id="modal-draft-text" bind:value={draft}></textarea>
  <p id="modal-draft-save-status">{dirty ? '未保存の変更あり' : '保存済みの内容です'}</p>
  <p role="status">{cancelNotice}</p>

  <button
    type="button"
    on:click={() => {
      draft = saved;
      close('discarded');
    }}
  >
    変更を破棄して閉じる
  </button>
  <button
    type="button"
    on:click={() => {
      saved = draft;
      close('saved');
    }}
  >
    保存して閉じる
  </button>
</ModalDialog>

<p>最後の終了結果：{lastClose}</p>
```

この例の保存先はコンポーネント内の状態だけです。サーバーへの保存は行いません。`cancel` の抑止はEscapeなどのネイティブcancel要求だけに効き、親からの `open = false` やslotの `close()` は抑止しません。

### ネイティブdialogによる開閉と状態の同期

ルートのIDから取得するのは `HTMLDialogElement` です。`showModal()` とフォームの `method="dialog"` による終了も、`bind:open` とコンポーネントイベントに反映されます。DOMへのアクセスはクリック時だけ行うため、SSR中には実行されません。

```svelte
<script lang="ts">
  import { ModalDialog } from '@sharelib-jp/digital-agency-components-svelte-implements';

  let open = false;
  let openCount = 0;
  let returnValue = '未確認';

  function showNativeDialog() {
    const dialog = document.getElementById('modal-native-lifecycle');
    if (dialog instanceof HTMLDialogElement && !dialog.open) {
      dialog.showModal();
    }
  }
</script>

<button type="button" on:click={showNativeDialog}>ネイティブAPIで確認を開く</button>

<ModalDialog
  id="modal-native-lifecycle"
  bind:open
  heading="受付方法の確認"
  description="内容を確認したら、フォームのボタンで閉じてください。"
  hasCloseButton={false}
  hasActions={false}
  on:open={() => (openCount += 1)}
  on:close={(event) => (returnValue = event.detail.returnValue || '戻り値なし')}
>
  <form method="dialog">
    <p>この手続きはオンラインで受け付けています。</p>
    <button type="submit" value="confirmed">確認しました</button>
  </form>
</ModalDialog>

<p>開閉状態：{open ? '開いています' : '閉じています'}</p>
<p>開いた回数：{openCount}、終了時の戻り値：{returnValue}</p>
```

## slots

| Slot          | slot props                              | 挿入先・フォールバック                                                          |
| ------------- | --------------------------------------- | ------------------------------------------------------------------------------- |
| `heading`     | なし                                    | `<h2 id="{id}-heading" tabindex="-1">` の中。未指定時は `heading`。             |
| `description` | なし                                    | `<p id="{id}-description">` の中。未指定時は `description`。                    |
| デフォルト    | `close: (returnValue?: string) => void` | 本文領域。説明文の後に配置します。未指定時は `message` をテキストで表示します。 |
| `actions`     | `close: (returnValue?: string) => void` | `hasActions={true}` の操作領域。未指定時は `actionLabel` の既定ボタン。         |

`close()` は `closeDialog('action', returnValue)` 相当の操作です。引数は既定で空文字で、終了時の `returnValue` として通知します。デフォルトslotではコンポーネントの `let:close`、名前付きactions slotではそのslotの `let:close` を使います。`close` はslot propであり、コンポーネントインスタンスの公開メソッドではありません。

見出しslotは `<h2>` の中身、説明slotは `<p>` の中身を渡します。見出し要素やブロック要素を重ねないでください。actions slotは `hasActions={false}` では描画されません。

## bind

| bind        | 型        | 説明                                                                           |
| ----------- | --------- | ------------------------------------------------------------------------------ |
| `bind:open` | `boolean` | 親から開閉し、内部ボタン・Escape・ネイティブdialogによる変更を親へ反映します。 |

初期値が `true` でも、SSRではHTMLの `open` 属性は付かず、マウント後に開きます。閉じてもslotのDOMや入力状態はそのまま残ります。再オープン時の入力値のリセットは利用側で行ってください。

## events

以下はネイティブイベントの単純な転送ではなく、コンポーネントが発火するCustomEventです。

| イベント | 型                                                                                                        | タイミング                                                                               | 抑止                                                                          |
| -------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `open`   | `CustomEvent<undefined>`                                                                                  | 開いた状態に遷移したとき。現在開いている場合は初期フォーカスを設定した後。               | 不可。                                                                        |
| `close`  | `CustomEvent<{ reason: 'button' \| 'action' \| 'cancel' \| 'binding' \| 'native'; returnValue: string }>` | 開いた状態から閉じた状態に遷移したとき。フォーカス復帰後に発火します。                   | 不可。                                                                        |
| `cancel` | `CustomEvent<Event>`                                                                                      | Escapeなどでネイティブdialogのcancelイベントが発生したとき。`detail` は元のDOMイベント。 | **可能**。CustomEventの `preventDefault()` でこの要求による終了を抑止します。 |

`CloseReason` は内部の型名で、パッケージルートからは公開されていません。

| `close.detail.reason` | 終了の契機                                                                                |
| --------------------- | ----------------------------------------------------------------------------------------- |
| `'button'`            | ヘッダーの閉じるボタン。                                                                  |
| `'action'`            | デフォルトまたはactions slotの `close()`、既定アクションボタン。                          |
| `'cancel'`            | 抑止されなかったネイティブcancel要求。                                                    |
| `'binding'`           | 親から `open` を `false` にした場合。                                                     |
| `'native'`            | ネイティブの `dialog.close()`、`method="dialog"` のフォーム、その他のネイティブ状態変化。 |

`returnValue` はslotの `close(value)`、ネイティブの `dialog.close(value)`、dialogフォームの送信ボタンなどが設定した文字列です。組み込みの閉じるボタン・既定アクション・通常のcancel・bindingでの終了は空文字です。開き直すと内部で `dialog.returnValue` を空文字に戻します。

### ネイティブライフサイクル

- `bind:open` で開くと `showModal()`、閉じると `close()` を呼び出します。背景を操作できなくするモーダル性とキーボードのフォーカス制御には、ブラウザー標準のdialog機能を使います。
- ネイティブの `beforetoggle` / `toggle` / `close` と `open` 属性のMutationObserverで状態を同期します。ネイティブAPIを直接使った場合のbind更新は、その同期を経て行われます。
- 同じタスク内での `close()` → `showModal()` も終了・開始の順に処理します。イベントハンドラーから開き直す場合も同期の対象です。
- 初期フォーカスは内部に含まれる `initialFocus`、なければ見出しです。指定先を実際にフォーカス可能な要素にしてください。標準の `autofocus` より、このコンポーネントの初期フォーカス設定が後に適用されます。
- 終了時は開く前のフォーカス先がまだDOMに接続されている場合に復帰します。アンマウント時もdialogを閉じてフォーカスを復帰し、監視とリスナーを解除しますが、そのクリーンアップ自体は `close` イベントを発火しません。

## 注意点

- `id` と、生成される `{id}-heading` / `{id}-description` を同じページ内で重複させないでください。SSRとhydrationで同じIDを使います。
- `aria-labelledby` は内部見出しを参照します。説明があればそのIDを `aria-describedby` に設定し、`describedBy` の追加参照を併記します。追加参照は実在する説明要素のIDにしてください。
- `hasCloseButton={false}` はEscapeを無効化せず、`hasActions={false}` もslotの `close()` や親からの閉じる操作を禁止しません。終了を抑止するときは、利用者が選べる別の終了手段を必ず用意してください。
- バックドロップのクリックで閉じる処理はありません。必要な挙動を実装済みだと想定しないでください。
- ネイティブAPIを使う場合も、モーダル表示には `showModal()` を使います。`show()` や `open` 属性だけによる表示は非モーダルで、このコンポーネントのモーダル表示と同等ではありません。
- 表示にはネイティブdialog対応ブラウザーが必要です。内部スクロールのCSSには `:has()` とコンテナクエリー単位も使うため、対象ブラウザーで確認してください。ポリフィルは同梱していません。
- `$$restProps` をルートに展開していません。未宣言のARIA属性やDOMイベントを渡しても転送されません。説明の追加参照には `describedBy`、追加クラスには `Class` を使います。
- actions slotのネイティブボタンには、`dads-button` と `data-type="solid-fill"` / `"outline"` / `"text"`、`data-size="lg"` / `"md"` / `"sm"` / `"xs"` の組み合わせで操作領域のCSSを適用できます。本文内やトリガーのボタンにはこの操作領域用CSSは適用されません。
- 既存の `Button` は `on:click` を転送しません。トリガーやカスタム操作は、このドキュメントのようにネイティブの `<button>` を使用してください。
