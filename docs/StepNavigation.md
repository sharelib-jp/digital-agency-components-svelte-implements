# ステップナビゲーション（StepNavigation）

複数の手順の位置・状態を表示する、`nav` と順序付きリスト `ol` のコンポーネントです。HTML 版の横／縦、通常／小サイズ、番号のみ、各状態のアイコン・説明・接続線と、任意のリンク／ボタンを移植しています。手順の入力フォームや検証・ルーティングは行いません。

## 基本例：すべてのステップを表示

各例は独立した Svelte コンポーネントとして利用できます。共通 CSS はアプリケーション全体で一度読み込みます。

```svelte
<script lang="ts">
  import StepNavigation, {
    type StepNavigationStep,
  } from '@sharelib-jp/digital-agency-components-svelte-implements/components/StepNavigation.svelte';
  import '@sharelib-jp/digital-agency-components-svelte-implements/global.css';

  const steps: StepNavigationStep[] = [
    { id: 'input', label: '入力', description: '申請者の情報を入力します', status: 'completed' },
    { id: 'confirm', label: '確認', description: '入力内容を確認します', status: 'editing' },
    { id: 'finish', label: '完了', description: '申請を受け付けます' },
  ];
</script>

<StepNavigation {steps} currentId="confirm" label="申請の手順" />
```

通常の項目は非操作の `span` です。`action: true` なら `button type="button"`、`href` があればリンクになります。状態だけで操作可能にはしません。

## ボタン操作・bind・取り消し

```svelte
<script lang="ts">
  import StepNavigation, {
    type StepNavigationStep,
    type StepNavigationSelectDetail,
  } from '@sharelib-jp/digital-agency-components-svelte-implements/components/StepNavigation.svelte';
  import '@sharelib-jp/digital-agency-components-svelte-implements/global.css';

  let currentId: string | null = 'input';
  let allowConfirm = false;
  let disabled = false;
  let message = '';
  const steps: StepNavigationStep[] = [
    { id: 'input', label: '入力', action: true },
    { id: 'confirm', label: '確認', action: true },
    { id: 'finish', label: '完了', disabled: true, action: true },
  ];

  function handleSelect(event: CustomEvent<StepNavigationSelectDetail>) {
    if (event.detail.id === 'confirm' && !allowConfirm) {
      event.preventDefault();
      message = '入力内容を確認してから進んでください。';
    } else {
      message = `${event.detail.step.label}を表示します。`;
    }
  }
</script>

<label><input type="checkbox" bind:checked={allowConfirm} />確認画面への移動を許可</label>
<label><input type="checkbox" bind:checked={disabled} />手順操作を無効にする</label>
<StepNavigation {steps} bind:currentId {disabled} on:select={handleSelect} />
<p>表示対象：{currentId}</p>
<p aria-live="polite">{message}</p>
```

イベントが受け入れられたボタン操作だけが `currentId` を更新します。フォーム内でも submit は起こしません。現在ステップ変更による `status` の自動完了化はありません。

## リンクと現在ステップだけの表示

```svelte
<script lang="ts">
  import StepNavigation, {
    type StepNavigationStep,
    type StepNavigationVariant,
    type StepNavigationOrientation,
    type StepNavigationSize,
    type StepNavigationStatus,
  } from '@sharelib-jp/digital-agency-components-svelte-implements/components/StepNavigation.svelte';
  import '@sharelib-jp/digital-agency-components-svelte-implements/global.css';

  const variant: StepNavigationVariant = 'single';
  const orientation: StepNavigationOrientation = 'vertical';
  const size: StepNavigationSize = 'small';
  const status: StepNavigationStatus = 'error';
  const steps: StepNavigationStep[] = [
    { id: 'input', label: '入力', status: 'completed', href: '/application/input' },
    { id: 'confirm', label: '確認', status, description: '住所を修正してください', href: '/application/confirm' },
    { id: 'finish', label: '完了' },
  ];
</script>

<StepNavigation
  {steps} {variant} {orientation} {size}
  currentId="confirm"
  label="申請の手順"
  summary="全3ステップ中、確認画面の住所にエラーがあります"
/>
```

`single` は配列内の現在ステップを1つ表示し、元の番号・先頭／末尾位置を維持します。任意の状態を単独表示したい場合は、1要素の `steps` に `number`・`first`・`last` を指定できます。リンク先のページはアプリケーション側で用意してください。

## Props

すべて省略可能です。既定の `steps=[]` では空の順序付きリストになります。

| Prop           | 型                          | 既定値         | 説明                                                                                          |
| -------------- | --------------------------- | -------------- | --------------------------------------------------------------------------------------------- |
| `steps`        | `StepNavigationStep[]`      | `[]`           | 表示順のステップ。`id` は一意にする。                                                         |
| `variant`      | `StepNavigationVariant`     | `'full'`       | `'full'`：すべて表示、`'single'`：現在の1項目を表示。                                         |
| `orientation`  | `StepNavigationOrientation` | `'horizontal'` | `'horizontal'`・`'vertical'`。横方向は必要に応じてスクロール。                                |
| `size`         | `StepNavigationSize`        | `'normal'`     | `'normal'`・`'small'`。番号の高さは 44／32 を rem 換算。                                      |
| `currentId`    | `string \| null`            | `null`         | 現在の ID。ボタンの受け入れられた操作で更新、`bind:currentId` 可能。                          |
| `disabled`     | `boolean`                   | `false`        | すべてのリンク／ボタン操作を無効にする。                                                      |
| `label`        | `string`                    | `'ステップ'`   | `nav` の `aria-label`。用途に応じた名前を付ける。                                             |
| `stepLabel`    | `string`                    | `'ステップ'`   | 各番号の前に置く視覚的に非表示の文言。                                                        |
| `summary`      | `string \| undefined`       | `undefined`    | 視覚的に非表示の進捗説明。省略時は「全Nステップ中、Rステップ目まで到達済み」。空文字で省略。  |
| `numberOnly`   | `boolean`                   | `false`        | タイトルと説明を省略。番号・状態の文言やアイコンは残る。                                      |
| `stepWidth`    | `number`                    | `320`          | 横方向の項目幅。単位なしの値を `calc(値 / 16 * 1rem)` へ変換。非負の有限数以外は既定値。      |
| `stepMinWidth` | `number`                    | `160`          | 横方向の項目最小幅。補正規則は `stepWidth` と同じ。                                           |
| `id`           | `string \| undefined`       | `undefined`    | ルート `nav` の DOM ID。                                                                      |
| `Class`        | `string`                    | `''`           | ルートの `dads-step-navigation` に追加するクラス。HTML 属性と衝突しないよう先頭大文字を使用。 |

### StepNavigationStep

| フィールド    | 型                     | 既定・意味                                                                    |
| ------------- | ---------------------- | ----------------------------------------------------------------------------- |
| `id`          | `string`               | 必須。配列内で一意の識別子。                                                  |
| `label`       | `string`               | 任意。ステップタイトル。空なら省略。                                          |
| `description` | `string`               | 任意。手順の詳細説明。ヘッダーの後の `p` に表示。空なら省略。                 |
| `status`      | `StepNavigationStatus` | 任意。未指定の場合、現在項目だけ `'reached'`、ほかは `'default'`。            |
| `statusLabel` | `string`               | 任意。状態の文言を上書き。空文字で文言を省略。                                |
| `current`     | `boolean`              | 任意。`currentId === null` のときの初期現在位置。複数ある場合は最初だけ使用。 |
| `disabled`    | `boolean`              | 任意。項目の操作を無効にする。現在位置や状態は変更しない。                    |
| `href`        | `string`               | 任意。指定するとリンク。`action` より優先。                                   |
| `action`      | `boolean`              | 任意。`true` ならボタン。`href` がなく `false`／省略なら非操作の span。       |
| `number`      | `number`               | 任意。表示番号。省略時は元の配列の位置 + 1。                                  |
| `first`       | `boolean`              | 任意。先頭側接続線を隠すか。省略時は配列の先頭なら隠す。                      |
| `last`        | `boolean`              | 任意。末尾側接続線を隠すか。省略時は配列の末尾なら隠す。                      |

### 状態

| `status`      | 表示                                               |
| ------------- | -------------------------------------------------- |
| `'default'`   | 未到達。通常の番号。                               |
| `'reached'`   | 到達済み。濃い背景の番号、非表示文言「到達済み」。 |
| `'completed'` | 完了。チェックアイコン、非表示文言「完了」。       |
| `'editing'`   | 編集アイコン、可視文言「編集中」。                 |
| `'error'`     | エラー色・警告アイコン、可視文言「エラー」。       |
| `'skipped'`   | 破線の番号枠、非表示文言「スキップされました」。   |

- `currentId` が非 `null` なら `current` より優先し、一致する項目だけ `aria-current="step"` を付けます。不明な ID なら現在項目はありません。`currentId` を自動補正しません。
- `single` で現在項目がない場合は先頭を表示しますが、現在とは指定しません。空の配列なら項目を描画しません。
- 既定の説明の R は、現在項目または `default` 以外の状態を持つ最も後ろの項目の配列位置です。業務上の到達状況と異なる場合、`summary` を指定してください。
- `status` は親が管理します。クリックしても完了・編集・エラー・無効状態を自動変更しません。

## 公開型・イベント

公開サブパスから以下の6型を名前付きで import できます。

- `StepNavigationVariant = 'full' | 'single'`
- `StepNavigationOrientation = 'horizontal' | 'vertical'`
- `StepNavigationSize = 'normal' | 'small'`
- `StepNavigationStatus = 'default' | 'reached' | 'completed' | 'editing' | 'error' | 'skipped'`
- `StepNavigationStep`：上記項目の型。
- `StepNavigationSelectDetail`：以下のイベント detail。

`on:select` は状態更新／ネイティブ遷移の前に発火する **cancelable** な `CustomEvent<StepNavigationSelectDetail>` です。DOM を bubble しません。

| detail          | 型                   | 意味                                                           |
| --------------- | -------------------- | -------------------------------------------------------------- |
| `id`            | `string`             | 選んだ項目の ID。                                              |
| `step`          | `StepNavigationStep` | 選んだ元の項目。                                               |
| `index`         | `number`             | 元の配列の 0 始まりの位置。                                    |
| `previousId`    | `string \| null`     | 操作前の有効な現在 ID。                                        |
| `originalEvent` | `MouseEvent`         | 元の click イベント。キーボードによるネイティブ click も含む。 |

- `event.preventDefault()` でボタンの `currentId` 更新とリンク遷移を取り消します。
- リンクでは受け入れられても `currentId` を変更しません。実際に表示したページに合わせ、親から現在位置を設定してください。
- 元の click が取り消し済み、左ボタン以外、Meta／Ctrl／Shift／Alt 付きの場合は `select` を発火せず、状態更新もしません。有効なリンクの修飾キー付きクリックはそのままブラウザーに任せます。
- 無効項目はイベントを発火しません。ボタンはネイティブ `disabled`、リンクは `href` を外し、どちらも `aria-disabled="true"`・`tabindex="-1"`。プログラムによる click も防止します。
- `originalEvent.preventDefault()` だけではカスタムイベントの取り消しになりません。ボタンの状態更新も止めるには CustomEvent 自体を取り消します。
- 親からの prop 変更では `select` は発火しません。スロット、`$$restProps`、ネイティブイベントの転送、リンクの `target`／`rel` API はありません。

## アクセシビリティ・注意点

- 順序のある手順なので `ol role="list"` を使用します。現在ステップは `li` 上の `aria-current="step"`、アイコンは `aria-hidden="true"` と状態の文言を組み合わせます。
- Tab／Shift+Tab は操作可能なリンクとボタンを移動し、リンクは Enter、ボタンは Enter／Space で選べます。タブ UI ではないため、矢印キーや roving tabindex は追加しません。
- フォーカス時は元実装と同じく番号に黒／黄色のフォーカスリングを表示します。強制カラーでアイコンと無効状態も識別可能にします。
- 横方向の接続線を含むレイアウトは元 CSS を維持しています。狭い画面で項目を折り返さず、横スクロールします。必要なら縦方向を指定してください。
- `numberOnly` でも「ステップ N」と状態は読み上げられます。手順名が不可欠な場面では通常表示を使ってください。
- `description` は単なる説明文で、開閉する `details` 要素ではありません。HTML を文字列として解釈せず、安全なテキストとして描画します。
- SSR で DOM やブラウザー API に依存しません。入力検証・画面表示・遷移制約は利用側で処理してください。
