# 通知バナー（NotificationBanner）

処理の成功・エラー・警告・情報を伝えるバナーです。種別ごとのアイコンと配色、閉じるボタン、本文や操作のslotに対応しています。表示状態は `bind:open` で利用側と共有できます。

導入と共通CSSの設定は[共通の準備](./README.md#共通の準備)を参照してください。

## 基本的な使い方

初期状態は表示です。閉じるボタンを押すと `open` が `false` になり、バナー全体がDOMから取り除かれます。

```svelte
<script lang="ts">
  import { NotificationBanner } from '@sharelib-jp/digital-agency-components-svelte-implements';

  let open = true;
  let closeCount = 0;
</script>

<NotificationBanner
  id="notification-save-basic"
  type="success"
  heading="保存しました"
  message="入力内容を保存しました。続けて次の項目を入力できます。"
  bind:open
  on:close={() => (closeCount += 1)}
/>

<button type="button" disabled={open} on:click={() => (open = true)}>
  通知を再表示する
</button>
<p>通知を閉じた回数：{closeCount}</p>
```

## Props

すべて任意です。

| Prop          | 型                                                          | 必須   | デフォルト                  | 説明                                                                                      |
| ------------- | ----------------------------------------------------------- | ------ | --------------------------- | ----------------------------------------------------------------------------------------- |
| `id`          | `string \| undefined`                                       | いいえ | `undefined`                 | ルートの `<div>` のID。                                                                   |
| `Class`       | `string`                                                    | いいえ | `''`                        | ルートに追加するクラス。大文字の `C` です。                                               |
| `type`        | `'success' \| 'error' \| 'warning' \| 'info-1' \| 'info-2'` | いいえ | `'info-1'`                  | アイコン、配色、既定roleを選びます。                                                      |
| `style`       | `'standard' \| 'color-chip'`                                | いいえ | `'standard'`                | 通常の囲み枠・左側にカラーチップがある表示の選択。CSS文字列ではありません。               |
| `open`        | `boolean`                                                   | いいえ | `true`                      | 表示状態。`bind:open` に対応します。                                                      |
| `dismissible` | `boolean`                                                   | いいえ | `true`                      | 組み込みの閉じるボタンを表示するか。slotの `close()` は無効化しません。                   |
| `closeButton` | `'standard' \| 'mobile-compact'`                            | いいえ | `'standard'`                | 組み込みの閉じるボタンの見た目。`dismissible={true}` の場合に使用します。                 |
| `closeLabel`  | `string`                                                    | いいえ | `'閉じる'`                  | 両形式の閉じるボタンの `aria-label`。通常形式では表示テキストにもなります。               |
| `heading`     | `string`                                                    | いいえ | `'お知らせ'`                | 内部の `<h2>` の見出しテキスト。heading slotが優先されます。                              |
| `message`     | `string`                                                    | いいえ | `''`                        | 本文。デフォルトslotがなければ空でない場合に `<p>` で表示します。                         |
| `timestamp`   | `string`                                                    | いいえ | `''`                        | 表示用の日時。空の場合は時刻を表示しません。                                              |
| `datetime`    | `string \| undefined`                                       | いいえ | `undefined`                 | 時刻の `<time>` の `datetime` 属性。                                                      |
| `role`        | `'status' \| 'alert' \| undefined`                          | いいえ | `undefined`（種別から決定） | 未指定時は下表のroleを設定します。明示すると種別にかかわらず上書きします。                |
| `ariaLive`    | `'off' \| 'polite' \| 'assertive' \| undefined`             | いいえ | `undefined`                 | ルートの `aria-live` 属性。未指定なら属性は付けず、roleの暗黙のライブ通知特性を使います。 |

`NotificationType` は内部の型名で、パッケージルートからは公開されていません。

### 種別とrole

| `type`      | 用途・配色     | アイコンの読み上げラベル | 既定の `role` |
| ----------- | -------------- | ------------------------ | ------------- |
| `'success'` | 成功・緑系     | 成功                     | `status`      |
| `'error'`   | エラー・赤系   | エラー                   | `alert`       |
| `'warning'` | 警告・黄系     | 警告                     | `alert`       |
| `'info-1'`  | 情報・青系     | インフォメーション       | `status`      |
| `'info-2'`  | 情報・グレー系 | インフォメーション       | `status`      |

`standard` は角丸の囲み枠、`color-chip` は左側のカラーチップ付きの枠です。`closeButton="mobile-compact"` は44×44相当のSVGによるコンパクトな閉じる表示を選ぶ指定で、画面幅による自動切り替えではありません。SVG内の「閉じる」の図形は固定で、`closeLabel` はアクセシブルな名前を変更します。

## 使用例

### カラーチップ・コンパクトな閉じるボタン・roleの選択

急いで割り込んで読み上げる必要がない警告は、`role="status"` を明示して通知方法を選べます。修正が必要なエラーは、閉じるボタンを表示しない例にしています。

```svelte
<script lang="ts">
  import { NotificationBanner } from '@sharelib-jp/digital-agency-components-svelte-implements';
</script>

<NotificationBanner
  id="notification-deadline-warning"
  type="warning"
  style="color-chip"
  closeButton="mobile-compact"
  closeLabel="期限の案内を閉じる"
  role="status"
  ariaLive="polite"
  heading="申請期限が近づいています"
  message="今週中に必要な書類を確認してください。"
  timestamp="2026年10月3日 更新"
  datetime="2026-10-03"
/>

<NotificationBanner
  id="notification-validation-error"
  type="error"
  dismissible={false}
  heading="入力内容を確認してください"
  message="必須項目に未入力があります。該当する項目を入力してから、もう一度送信してください。"
/>
```

### heading・本文・actionsのslotとclose()

`dismissible={false}` でもactions slotの `close()` は利用できます。ネイティブのボタンに `dads-button` と `data-size` / `data-type` を指定すると、操作領域のボタンCSSが適用されます。

```svelte
<script lang="ts">
  import { NotificationBanner } from '@sharelib-jp/digital-agency-components-svelte-implements';

  let open = true;
  let acknowledged = false;
</script>

<NotificationBanner
  id="notification-service-slots"
  type="info-2"
  dismissible={false}
  bind:open
>
  <span slot="heading">サービス利用のご案内</span>

  <p>申請を始める前に、次の点をご確認ください。</p>
  <ul>
    <li>入力内容は送信前に確認できます。</li>
    <li>受付結果は登録したメールアドレスに届きます。</li>
  </ul>

  <svelte:fragment slot="actions" let:close>
    <button
      type="button"
      class="dads-button"
      data-size="md"
      data-type="outline"
      on:click={() => {
        acknowledged = true;
        close();
      }}
    >
      確認して閉じる
    </button>
  </svelte:fragment>
</NotificationBanner>

<p aria-live="polite">{acknowledged ? '案内を確認済みです。' : '案内は未確認です。'}</p>
<button type="button" disabled={open} on:click={() => (open = true)}>
  案内を再表示する
</button>
```

## slots

| Slot       | slot props          | 挿入先・フォールバック                                                                               |
| ---------- | ------------------- | ---------------------------------------------------------------------------------------------------- |
| `heading`  | なし                | アイコンに続く見出しテキスト領域の `<span>` 内。未指定時は `heading`。                               |
| デフォルト | なし                | 本文領域の中。未指定時は空でない `message` を `<p>` で表示します。時刻はslotより前に別途表示します。 |
| `actions`  | `close: () => void` | 操作領域。slotがある場合だけ領域を表示し、既定の操作はありません。                                   |

`close()` は表示中なら `open = false` にして `close` イベントを発火します。既に閉じていれば何もしません。戻り値や理由を受け取る引数はありません。

本文領域は `timestamp`、`message`、デフォルトslotのいずれかがある場合に表示されます。heading slotは `<h2>` 自体を置き換えるものではありません。

## bind

| bind        | 型        | 説明                                                                                                    |
| ----------- | --------- | ------------------------------------------------------------------------------------------------------- |
| `bind:open` | `boolean` | 組み込みボタンやslotの `close()` による状態変更を親に反映します。親から `true` にすると再表示できます。 |

`open={false}` または親からの代入で非表示にしても、`close` イベントは発火しません。親も状態を追跡する場合は `open` の単方向指定だけでなく `bind:open` を使います。

## events

| イベント | 型                       | 発生タイミング                                                                                                                | 抑止                                                      |
| -------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `close`  | `CustomEvent<undefined>` | 組み込みの閉じるボタンまたはactions slotの `close()` が、表示中のバナーを閉じたとき。`open` を `false` にした後に発火します。 | 不可。`preventDefault()` では閉じる動作を取り消せません。 |

開いたときのイベントや、内部のDOMイベントの転送はありません。

## 注意点

- roleは種別から決まりますが、伝える内容の緊急度を判断するのは利用側です。`status` は通常polite、`alert` は通常assertiveのライブ通知特性を持ちます。`ariaLive` で明示的に上書きする場合はroleとの組み合わせを確認してください。
- ライブ通知の読み上げは、追加・更新のタイミングやブラウザーと支援技術に依存します。初期表示されるだけで必ず読み上げられるとは限りません。実際の利用環境で確認してください。
- エラー内容は本文でも具体的に伝えてください。種別アイコンと色だけに頼らず、必要なら入力欄側にもエラーの関連付けを行います。
- `dismissible={false}` は組み込みボタンを隠すだけです。slotの `close()` や親からの `open = false` を防ぐロックではありません。
- 見出しは常に `<h2>` です。heading slotに見出し要素を重ねず、内容のある見出しテキストを渡してください。
- `timestamp` が空なら、`datetime` だけを指定しても時刻は表示されません。表示日時と機械可読な日時は利用側で一致させます。
- `$$restProps` を展開していません。`aria-live` という属性名ではなく公開propの `ariaLive` を使い、追加クラスは `Class` を使います。その他の未宣言属性はルートに転送されません。
- actions slotのボタンCSSは `data-type="solid-fill"` / `"outline"` / `"text"` と `data-size="lg"` / `"md"` / `"sm"` / `"xs"` に対応します。既存の `Button` は `on:click` を転送しないため、操作例にはネイティブの `<button>` を使っています。
- 閉じるときのフォーカス移動や、閉じた状態の永続保存は実装されていません。必要な場合は利用側で管理してください。
