# ファイルアップロード／ドロップエリア（FileUpload）

ローカルファイルの選択・一覧表示・解除・クライアント側検証を行うSvelte 5 legacyコンポーネントです。**コンポーネントは通信・アップロード・保存を行いません。** 実際の送信処理とサーバー側検証は利用側の責任です。

HTML版のドロップエリア、BEMクラス、件数／合計サイズ、既存ファイル、ファイルごとのエラー表示を移植しています。グローバルなデザイントークンCSSも読み込んでください。

## 基本的な使い方

以下は選択状態を表示するだけの、独立した例です。SSRとhydrationで一致する、一意で安定した `id` を必ず指定します。

```svelte
<script lang="ts">
  import FileUpload from '@sharelib-jp/digital-agency-components-svelte-implements/components/FileUpload.svelte';
  import '@sharelib-jp/digital-agency-components-svelte-implements/global.css';

  let files: File[] = [];
</script>

<FileUpload
  id="application-attachments"
  name="attachments"
  label="申請書の添付資料"
  supportText="PDFを5個まで。各5MBまで、合計10MBまで。"
  accept=".pdf"
  maxFiles={5}
  maxFileSize="5MB"
  maxTotalSize="10MB"
  bind:files
/>
<p>新たに選択したファイル：{files.length}個</p>
```

`multiple={true}` では、再度の選択は追記です。同じファイルも重複して追加できます。解除後に同じファイルを選び直すこともできます。ファイル名やサイズが同じでも別の選択として扱います。

## Props

`id` だけが必須です。`FileUploadExistingFile`、`FileUploadMessages` などの型はこのコンポーネントのモジュールから `import type` できます。`export let` によるlegacy bindに対応します。

| Prop                 | 型                              | 既定値                                                           | 説明                                                                                                 |
| -------------------- | ------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `id`                 | `string`                        | 必須                                                             | 送信用ネイティブfile入力のID。派生IDにも使用。                                                       |
| `name`               | `string \| undefined`           | `undefined`                                                      | 新規ファイルのフォームフィールド名。未指定ならFormDataに含まれません。                               |
| `form`               | `string \| undefined`           | `undefined`                                                      | 外部フォームのID。新規入力と既存IDのhidden入力に設定。変更後のリセットも関連付け先のフォームに従う。 |
| `label`              | `string`                        | `'参照する画像・ドキュメント'`                                   | FormControlLabelによるラベル。空なら外部ラベル／`aria-label`を用意してください。                     |
| `supportText`        | `string \| null`                | `null`                                                           | 説明文。入力・選択ボタンから参照。HTML文字列ではありません。                                         |
| `required`           | `boolean`                       | `false`                                                          | ネイティブfile入力を必須にする。**既存メタデータだけでは満たせません。新規Fileが必要です。**         |
| `disabled`           | `boolean`                       | `false`                                                          | 選択・解除・拡張・dropを無効化。新規入力と既存IDを送信対象から除外。                                 |
| `readonly`           | `boolean`                       | `false`                                                          | 選択・解除・拡張UIを表示せず、dropも受け付けない。値はフォームに残ります。                           |
| `multiple`           | `boolean`                       | `true`                                                           | 複数選択。falseでは選択ごとに新規／既存の一覧全体を置き換え、最大1個の検証を適用。                   |
| `accept`             | `string`                        | `''`                                                             | 拡張子、MIME、MIMEワイルドカードをカンマ区切りで指定。例 `.pdf,image/*`。                            |
| `files`              | `File[]`                        | `[]`                                                             | 新規ローカルファイル。`bind:files`推奨。無効なファイルも一覧と配列に残ります。                       |
| `existingFiles`      | `FileUploadExistingFile[]`      | `[]`                                                             | サーバー等に保存済みのファイルのメタデータ。`bind:existingFiles`対応。                               |
| `existingFilesName`  | `string \| undefined`           | `undefined`                                                      | 既存IDのhidden入力名。省略時は`name + '-existing'`。nameも未指定ならhidden入力なし。                 |
| `maxFiles`           | `number \| undefined`           | `undefined`                                                      | 新規＋既存の最大件数。非負整数。省略時は複数モードに上限なし。                                       |
| `maxFileSize`        | `number \| string \| undefined` | `undefined`                                                      | 新規ファイル1個のサイズ上限。数値はバイト。                                                          |
| `maxTotalSize`       | `number \| string \| undefined` | `undefined`                                                      | 新規＋既存の合計サイズ上限。数値はバイト。                                                           |
| `droppable`          | `boolean`                       | `true`                                                           | ドロップエリアとローカルdropを有効にする。falseではボタン型レイアウト。                              |
| `dropAreaExpandable` | `boolean`                       | `true`                                                           | ウィンドウ全体へのdropを許可するチェックボックスを表示。                                             |
| `expandedDropArea`   | `boolean`                       | `false`                                                          | ウィンドウ全体へのdrop受付。bind対応。同時に有効なのは1インスタンスのみ。                            |
| `buttonLabel`        | `string`                        | `'ファイルを選択'`                                               | 選択ボタン文言。                                                                                     |
| `dropText`           | `string`                        | `'または、このエリア内にドラッグ＆ドロップ'`                     | ドロップエリアの説明。                                                                               |
| `expandLabel`        | `string`                        | `'ドラッグ＆ドロップの範囲をこのブラウザウィンドウ全体に広げる'` | 拡張チェックボックスのラベル。                                                                       |
| `overlayText`        | `string`                        | `'このエリア内にファイルをドラッグ＆ドロップ'`                   | 拡張時の全画面オーバーレイ文言。                                                                     |
| `emptyText`          | `string`                        | `'ファイルが選択されていません'`                                 | 空の一覧の文言。                                                                                     |
| `removeLabel`        | `string`                        | `'解除'`                                                         | 解除ボタン文言。ファイル名もaccessible nameに含む。                                                  |
| `errorText`          | `string \| null`                | `null`                                                           | 外部エラー。表示し、空でなければネイティブcustom validityにも反映。                                  |
| `customValidity`     | `string`                        | `''`                                                             | 利用側の制約検証メッセージ。空でなければ無効。エラー一覧にも表示。                                   |
| `messages`           | `Partial<FileUploadMessages>`   | `{}`                                                             | 下記メッセージの上書き。空文字は既定値に戻ります。                                                   |
| `Class`              | `string`                        | `''`                                                             | 外側のフォームラベルラッパーに追加するCSSクラス。                                                    |

### サイズ・検証のルール

- サイズ文字列は `B`、`KB`、`MB`、`GB`（大文字小文字不問）と小数に対応します。単位なしはバイト。**HTML版と同じ1024進数**で、`1KB = 1024B`、`5MB = 5,242,880B`です。数値propsはバイト数です。表示は原則小数1桁、正確なバイト数も併記します。
- 上限と等しい値は有効です。`0`は「制限なし」ではなく、0件／0バイトの制限です。サイズの未指定／空文字は上限なし。
- 負数、NaN、Infinity、不正な単位／文字列、非整数のmaxFiles、不正な既存サイズや空／重複IDは設定エラーとして表示し、通常のフォーム送信を阻止します。
- `accept`は新規ファイルだけを検証します。拡張子は大文字小文字不問、MIMEは`File.type`と比較します。空のトークンは無視します。MIMEが空ならMIME指定には一致しません。内容の解析や拡張子からのMIME推測は行いません。
- **HTML版と同じく、既存ファイルはaccept／1個のサイズ上限の対象外**です。件数と合計サイズには含みます。既存ファイルはサーバーで検証済みであることを想定します。
- 不正な選択を黙って成功扱いせず、そのまま一覧に残し、全体および該当ファイルにエラーを表示します。制限変更／親の配列変更／解除で再検証します。
- 単一モードに複数ファイルをdropした場合、HTML版の先頭だけを残す動作とは異なり、すべてを表示して件数エラーにします。親から複数のファイルを設定しても黙って切り捨てません。

## 既存ファイルとフォームデータ

独立した例です。submitを止めてFormDataの内容を確認するだけで、通信しません。

```svelte
<script lang="ts">
  import FileUpload, {
    type FileUploadExistingFile,
  } from '@sharelib-jp/digital-agency-components-svelte-implements/components/FileUpload.svelte';
  import '@sharelib-jp/digital-agency-components-svelte-implements/global.css';

  let files: File[] = [];
  let existingFiles: FileUploadExistingFile[] = [
    { id: 'stored-document-123', name: '保存済み申請書.pdf', size: 1048576 },
  ];
  let checked = '';

  function inspect(event: SubmitEvent) {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    checked = `新規${files.length}個、既存ID：${data.getAll('retained').join(', ')}`;
    // fetch等の通信処理は利用側が必要に応じて実装します。
  }
</script>

<form method="post" enctype="multipart/form-data" on:submit={inspect}>
  <FileUpload
    id="supporting-documents"
    name="documents"
    existingFilesName="retained"
    label="添付資料"
    accept=".pdf"
    maxFiles={5}
    maxTotalSize="10MB"
    bind:files
    bind:existingFiles
  />
  <button type="submit">選択内容を確認</button>
  <button type="reset">初期状態に戻す</button>
</form>
<p aria-live="polite">{checked}</p>
```

`FileUploadExistingFile` のフィールドはすべて必須です。

| フィールド | 型       | 内容                                                        |
| ---------- | -------- | ----------------------------------------------------------- |
| `id`       | `string` | 非空かつリスト内で一意のサーバー識別ID。hidden入力のvalue。 |
| `name`     | `string` | 表示用のファイル名。HTMLとして解釈しません。                |
| `size`     | `number` | 非負で有限のバイト数。                                      |

新規ファイルは**1個の送信用 `input[type=file]` の `files` に一覧全体を同期**します。追加・解除・親からの更新後、Svelteの `tick()` を待てば、`new FormData(form)`にも反映されます。内部には値を毎回クリアする名前なしのchooserもありますが、送信対象にはなりません。既存ファイルはバイナリではなくhidden入力のIDだけです。

ネイティブフォームの通常の制約検証は維持します。`required` とコンポーネントの `setCustomValidity()` が送信を阻止します。`form.submit()`、`novalidate`、`new FormData()` 自体は検証を実行しないため、利用側が検証を迂回すれば無効なファイルも取得／送信できてしまいます。手動処理では `form.reportValidity()` や `form.checkValidity()` を使ってください。未選択の名前付きfile入力は、HTML仕様どおりFormDataに空のFile（name `''`、size `0`）を含む場合があります。

## イベント・公開型

すべて `createEventDispatcher` によるコンポーネントイベントです。DOMにはbubbleしません。`on:change` はネイティブchangeの転送ではありません。

| イベント         | detail                       | cancelable     | タイミング                                                                     |
| ---------------- | ---------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `change`         | `FileUploadChangeDetail`     | いいえ         | 選択、drop、解除、reset後のDOM／入力同期後。                                   |
| `validation`     | `FileUploadValidationDetail` | いいえ         | マウント後、検証状態の変更時、またはネイティブinvalid時。                      |
| `remove`         | `FileUploadRemoveDetail`     | はい           | ユーザーによる解除前。`preventDefault()`で解除を中止。                         |
| `reset`          | `{ originalEvent: Event }`   | はい           | 所属フォームのreset時、値を戻す前。`preventDefault()`でネイティブresetも中止。 |
| `focus` / `blur` | ネイティブEvent              | ネイティブ仕様 | 送信用file入力のイベント転送。選択ボタンのfocusイベントではありません。        |

`FileUploadValidationDetail`:

| フィールド      | 型                      | 内容                                                                          |
| --------------- | ----------------------- | ----------------------------------------------------------------------------- |
| `valid`         | `boolean`               | 送信用ネイティブ入力の検証結果。disabled等で検証対象外ならtrue。              |
| `errors`        | `string[]`              | 集約／外部／同期／表示済みrequiredのエラー。disabledでも保持。                |
| `fileErrors`    | `FileUploadFileError[]` | すべての新規ファイルの結果（有効なファイルもerrorsが空の項目を含む）。        |
| `totalSize`     | `number`                | 既存＋新規のバイト数。                                                        |
| `count`         | `number`                | 既存＋新規の件数。                                                            |
| `nativeMessage` | `string`                | ネイティブ入力のvalidationMessage。表示前のrequiredや外部直接設定も確認可能。 |

`FileUploadFileError` は `{ file: File; index: number; errors: string[] }`。indexは `files` 配列内の位置です。

`FileUploadChangeDetail` は上記すべてに `{ files: File[]; existingFiles: FileUploadExistingFile[]; reason: 'select' | 'drop' | 'remove' | 'reset'; originalEvent: Event }` を追加します。配列とエラーはスナップショットで、Fileオブジェクト自体は共有します。

`FileUploadRemoveDetail` は `{ file: File | FileUploadExistingFile; isExisting: boolean; index: number; originalEvent: MouseEvent }`。indexはそれぞれの配列内の位置です。

親からのprops／bind配列の変更では `change` を発火しません。検証結果が変わる場合は `validation` が発火します。`files`、`existingFiles`、`expandedDropArea`以外に専用bind APIや公開メソッドはありません。スロットはありません。

### メッセージの変更とイベント利用例

```svelte
<script lang="ts">
  import FileUpload, {
    type FileUploadMessages,
    type FileUploadValidationDetail,
  } from '@sharelib-jp/digital-agency-components-svelte-implements/components/FileUpload.svelte';
  import '@sharelib-jp/digital-agency-components-svelte-implements/global.css';

  let files: File[] = [];
  let valid = true;
  const messages: Partial<FileUploadMessages> = {
    maxFiles: '{max}個まで選択できます。現在{current}個です。',
    invalidType: 'PDF形式のファイルを選択してください。',
    selectedFiles: '{count}個を選択（合計{sizeFormatted}、{sizeBytes}バイト）',
  };
  function validate(event: CustomEvent<FileUploadValidationDetail>) {
    valid = event.detail.valid;
  }
</script>

<FileUpload id="custom-documents" label="参考資料" accept=".pdf" maxFiles={3}
  {messages} bind:files on:validation={validate} />
<p>検証結果：{valid ? '有効' : '修正が必要'}</p>
```

`FileUploadMessages` の全キーと既定値:

| キー                | 既定値                                                                                   | テンプレート変数                                   |
| ------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `maxFiles`          | 選択できるファイル数が上限を超過しています。                                             | `{max}`, `{current}`（件数）                       |
| `maxTotalSize`      | 選択できるファイルサイズの合計が上限を超過しています。                                   | `{max}`, `{current}`（サイズ表示＋正確なバイト数） |
| `invalidType`       | 許可されていないファイル形式です。                                                       | なし                                               |
| `maxFileSize`       | ファイルサイズが上限を超過しています。                                                   | `{max}`, `{current}`（サイズ表示＋正確なバイト数） |
| `hasFileErrors`     | 選択したファイルにエラーがあります。該当ファイルをチェックしてください。                 | なし                                               |
| `invalidConstraint` | ファイルの制限値または既存ファイルの情報が不正です。                                     | なし                                               |
| `synchronization`   | ファイルをフォーム入力に反映できません。このブラウザーではファイル選択を利用できません。 | なし                                               |
| `required`          | ファイルを選択してください。                                                             | なし                                               |
| `dropAvailable`     | ここにドロップできます。                                                                 | なし                                               |
| `dropUnavailable`   | ドロップエリア外。                                                                       | なし                                               |
| `selectedFiles`     | 選択中：{count}個、{sizeFormatted}（{sizeBytes}バイト）                                  | `{count}`, `{sizeFormatted}`, `{sizeBytes}`        |
| `removed`           | {name}の選択を解除しました。                                                             | `{name}`                                           |

HTML版の `data-error-*` ではなく `messages` を使います。英語化する場合はUI文言propsとmessagesの両方を設定します（バイトの表示接尾辞「バイト」は固定です）。

## リセット・アクセシビリティ・制約

- フォームのresetは、**新規ファイルを空にし、既存ファイルをマウント時のメタデータへ戻します**。初期 `files` を再選択する処理はありません。親の後からのexistingFiles変更はresetの既定値を変更しません。フォームのresetが取り消された場合は状態を変更しません。readonly／disabledでもネイティブresetには従います。単に全件クリアするなら親で `files = []; existingFiles = [];` としてください。
- requiredは新規ファイルを求めるネイティブ仕様です。既存資料で必須条件を満たすアプリでは、例として `required={existingFiles.length === 0}` のように業務条件を利用側で設定します。
- 選択ボタンはネイティブbuttonで、Enter／Spaceでchooserを開けます。ラベル、説明、選択サマリー、全体エラーを関連付けます。解除ボタンの名前に対象ファイル名を含めます。解除後は次の解除ボタン、最後なら前のボタン、空なら選択ボタンへフォーカスします。
- politeライブリージョンで選択サマリー／解除／drop可否を、assertiveでエラーを通知します。無効なフォーム送信時は表示済みの選択ボタンへフォーカスします（readonlyでは見えているラッパーへ移します）。送信用入力はdisplay:noneにせず、ネイティブ検証が機能するよう視覚的に隠します。
- ウィンドウ全体へのdropは明示的なチェック／bindによるopt-inです。別のFileUploadが有効になると以前のものを解除します。ファイル以外のドラッグは処理しません。disabled／readonly／droppable=falseになると解除します。drop終了／ウィンドウ退出／Escape／短い無操作でオーバーレイを消し、破棄時にdocumentリスナーとタイマーを解除します。HTML版と異なりオーバーレイはbodyへ移動せず、コンポーネント内のfixed要素です。祖先にtransformや包含・クリッピングがある場合は全画面表示にならないため、配置に注意してください。
- 残余属性（`aria-label`、`aria-labelledby`、`aria-describedby`、`data-*`等）は送信用入力へ転送します。外部aria-describedbyは内部説明と結合します。内部管理の `type`、`value`、`files`、`class`、`readonly` は転送せず、入力のBEMクラス／型を保持します。ラッパーのスタイルには `Class` を使ってください。`readonly`はfile入力にネイティブの読み取り専用属性がないためUI／イベントで制御します。
- `customValidity`の利用を推奨します。内部入力を `document.getElementById(id)` で取得し、直接 `setCustomValidity()` を設定しても、検証可能な状態ではコンポーネントの更新で消しません。直接設定した文言を消す責任は利用側にあります。DOMの直接変更そのものを監視しないため、直後にvalidationイベントが必要ならネイティブcheckValidity／reportValidityを実行してください。
- SSR時にFile／DataTransferを生成せず、DOM参照はマウント後だけです。File配列は通常SSRからシリアライズせず、existingFilesで初期情報を渡します。未hydration時にはネイティブfile入力を表示し、強化UIのボタンは無効です。JavaScriptなしでは一覧の更新や独自制限の検証は行われません。
- 強化版のフォーム同期にはブラウザーの `DataTransfer` と `input.files` の代入対応が必要です。同期できなければエラーとcustom validityを設定し、正常に送信できるとは表示しません。フォルダーの再帰読み込み、進捗、キャンセル可能なネットワーク処理、画像プレビュー、永続化は実装しません。
- サーバーではIDの所有権、ファイル内容、実際のサイズ／件数を必ず再検証してください。acceptやクライアント側の検証をセキュリティ境界にしないでください。
