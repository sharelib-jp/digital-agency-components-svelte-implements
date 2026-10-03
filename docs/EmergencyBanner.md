# 緊急時バナー（EmergencyBanner）

災害やサービスの緊急停止など、優先して伝える必要のある情報を表示します。見出し、掲載時刻、本文、詳細へのリンクをまとめた `<article>` です。通知種別や閉じる機能を持つ `NotificationBanner` とはAPIが異なります。

導入と共通CSSの設定は[共通の準備](./README.md#共通の準備)を参照してください。

## 基本的な使い方

`timestamp` は画面上の時刻表記、`datetime` は `<time>` の機械可読な日時です。リンク先は利用アプリで用意してください。

```svelte
<script lang="ts">
  import { EmergencyBanner } from '@sharelib-jp/digital-agency-components-svelte-implements';
</script>

<EmergencyBanner
  id="emergency-weather-basic"
  heading="大雨に伴う窓口の臨時休止について"
  timestamp="2026年10月3日 午前9時 更新"
  datetime="2026-10-03T09:00:00+09:00"
  message="本日の窓口業務を休止しています。来庁を予定している方は、最新の情報をご確認ください。"
  href="/emergency/office-closure"
  linkLabel="窓口の休止状況を確認する"
  target="_blank"
/>
```

`target="_blank"` の既定リンクには `rel="noopener noreferrer"` と「新規タブで開きます」というアクセシブルなラベル付きアイコンが追加されます。

## Props

すべて任意です。

| Prop        | 型                    | 必須   | デフォルト         | 説明                                                                               |
| ----------- | --------------------- | ------ | ------------------ | ---------------------------------------------------------------------------------- |
| `id`        | `string \| undefined` | いいえ | `undefined`        | ルートの `<article>` のID。                                                        |
| `Class`     | `string`              | いいえ | `''`               | ルートに追加するクラス。大文字の `C` です。                                        |
| `heading`   | `string`              | いいえ | `'緊急のお知らせ'` | 内部の `<h2>` のテキスト。heading slotが優先されます。                             |
| `message`   | `string`              | いいえ | `''`               | 本文。デフォルトslotがなければ `<p>` 内に表示します。                              |
| `timestamp` | `string`              | いいえ | `''`               | 表示用の日時。空文字の場合は `<time>` を表示しません。                             |
| `datetime`  | `string \| undefined` | いいえ | `undefined`        | `<time>` の `datetime` 属性。表示用文字列の変換は行いません。                      |
| `href`      | `string \| undefined` | いいえ | `undefined`        | 既定の詳細リンク。空または未指定で、actions slotもなければ操作領域を表示しません。 |
| `linkLabel` | `string`              | いいえ | `'詳細を確認する'` | 既定リンクのテキスト。                                                             |
| `target`    | `'_self' \| '_blank'` | いいえ | `'_self'`          | 既定リンクの表示先。`'_self'` の場合は `target` 属性を付けません。                 |

見た目は1種類です。`type` / `style` / `size` の切り替えpropはありません。橙色の6px枠で表示され、既定の詳細リンクは赤いボタン状の表示です。48rem以上では余白、文字サイズ、リンク配置が変わります。

## 使用例

### heading・本文・actionsの差し替え

長い本文や複数の案内はslotに渡せます。actions slotで既定リンクを置き換えると、`href` / `linkLabel` / `target` によるリンク生成は使われなくなります。操作が必要な箇所にはネイティブの `<button>` を使います。

```svelte
<script lang="ts">
  import { EmergencyBanner } from '@sharelib-jp/digital-agency-components-svelte-implements';

  let showContact = false;
</script>

<EmergencyBanner
  id="emergency-maintenance-slots"
  timestamp="2026年10月3日 午後1時 更新"
  datetime="2026-10-03T13:00:00+09:00"
>
  <span slot="heading">オンライン申請の緊急メンテナンス</span>

  <p>現在、オンライン申請を利用できません。</p>
  <ul>
    <li>入力途中の内容は、復旧後に再確認してください。</li>
    <li>期限が本日の申請は、担当窓口にご相談ください。</li>
  </ul>

  <button
    slot="actions"
    type="button"
    aria-controls="emergency-maintenance-contact"
    aria-expanded={showContact}
    on:click={() => (showContact = !showContact)}
  >
    {showContact ? '問い合わせ案内を隠す' : '問い合わせ案内を表示する'}
  </button>
</EmergencyBanner>

<div id="emergency-maintenance-contact" hidden={!showContact}>
  <p>申請に関する問い合わせは、各手続きの担当窓口で受け付けています。</p>
  <a href="/contact">担当窓口一覧を確認する</a>
</div>
```

## slots

| Slot       | slot props | 挿入先・フォールバック                                        |
| ---------- | ---------- | ------------------------------------------------------------- |
| `heading`  | なし       | 内部の `<h2>` の中。未指定時は `heading`。                    |
| デフォルト | なし       | 本文領域の `<div>` の中。未指定時は `<p>{message}</p>`。      |
| `actions`  | なし       | 操作領域の `<div>` の中。未指定時は `href` による既定リンク。 |

本文領域はデフォルトslotまたは空でない `message` がある場合、操作領域はactions slotまたは空でない `href` がある場合だけ表示します。heading slotは見出し自体ではなく、その中身を渡してください。時刻を差し替えるslotはありません。

## 注意点

- ルートは `<article>` で、`role="alert"` や `aria-live` は自動設定されません。緊急時バナーという名称だけでライブ通知が発生するわけではありません。動的な更新を読み上げる必要があれば、利用側の通知領域を設計してください。
- `$$restProps` をルートに展開していません。`role` / `aria-*` などの未宣言属性をコンポーネントに渡してもルートには転送されません。
- `open`、閉じるボタン、`close` イベント、状態を更新するbind APIはありません。表示の切り替えが必要な場合は利用側で条件付き描画を管理します。DOMイベントもコンポーネントから転送していません。
- 見出しは常に `<h2>` です。heading slotに別の見出し要素を入れず、ページ全体の見出し構造に注意してください。
- `datetime` だけを指定しても時刻は表示されません。`timestamp` と組み合わせ、表示文字列と機械可読な日時を一致させてください。
- actions slotのリンク・ボタンには、既定リンク専用のスタイルや新規タブの案内は自動適用されません。カスタム操作の見た目、ラベル、`target` / `rel` は利用側で設定します。
- 既存の `Button` は `on:click` を転送しません。このドキュメントの操作例のように、イベントハンドラーが必要な操作にはネイティブの `<button>` を使ってください。
