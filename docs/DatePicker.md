# 日付ピッカー（DatePicker）

年・月・日のテキスト入力と、キーボード操作できるカレンダーを組み合わせた日付入力です。デジタル庁の HTML 作例の統合型・分割型のマークアップ、BEM クラス、サイズ、フォーカス・強制カラーのスタイルを Svelte 5 の legacy コンポーネントとして移植しています。ネイティブの `type="date"` や Custom Elements の登録には依存しません。

## 基本的な使い方

パッケージのデザイントークンをアプリケーションで一度読み込みます。SSR と hydration で一致する、ページ内で一意の `id` が必須です。

```svelte
<script lang="ts">
    import DatePicker from '@sharelib-jp/digital-agency-components-svelte-implements/components/DatePicker.svelte';
    import '@sharelib-jp/digital-agency-components-svelte-implements/global.css';

    let birthday = '2000-02-29';
    let calendarOpen = false;
</script>

<form method="post">
    <DatePicker
        id="birthday"
        name="birthday"
        label="生年月日"
        supportText="西暦で入力してください。例：2000年02月29日"
        minDate="1900-01-01"
        maxDate="2026-12-31"
        required
        bind:value={birthday}
        bind:open={calendarOpen}
    />
    <button type="submit">送信</button>
    <button type="reset">元に戻す</button>
</form>
<p>入力値：{birthday || '未入力または不正な日付'}</p>
```

## Props

| 名前          | 型                    | 既定値           | 説明                                                                                                                                 |
| ------------- | --------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `id`          | `string`              | 必須             | `fieldset` の ID。空文字列はエラー。内部 ID は `-year`、`-month`、`-day`、`-calendar`、`-support-text`、`-error-text` を付加します。 |
| `name`        | `string \| undefined` | `undefined`      | hidden input に設定する送信名。年・月・日の入力には送信名を付けません。                                                              |
| `form`        | `string \| undefined` | `undefined`      | 外部フォームの ID。未指定時は祖先のフォームに関連付けます。                                                                          |
| `type`        | `DatePickerType`      | `'consolidated'` | `'consolidated'`（統合型）または `'separated'`（分割型）。                                                                           |
| `size`        | `DatePickerSize`      | `'md'`           | `'sm'`／`'md'`／`'lg'`。入力・開閉ボタンの高さは 40／48／56 px 相当です。                                                            |
| `value`       | `string`              | `''`             | `YYYY-MM-DD` または空文字列。`bind:value` に対応します。                                                                             |
| `open`        | `boolean`             | `false`          | カレンダーの開閉状態。`bind:open` に対応します。                                                                                     |
| `calendar`    | `boolean`             | `true`           | カレンダーを利用するか。`false` の場合は年・月・日の入力のみ表示します。                                                             |
| `minDate`     | `string`              | `''`             | 選択・入力できる最小日（その日を含む）。未指定時は `0001-01-01`。                                                                    |
| `maxDate`     | `string`              | `''`             | 選択・入力できる最大日（その日を含む）。未指定時は `9999-12-31`。                                                                    |
| `label`       | `string`              | `'日付'`         | `legend` に表示するグループラベル。目的を説明する空でない値を指定してください。                                                      |
| `required`    | `boolean`             | `false`          | 年・月・日の入力すべてを必須とし、ラベルに「※必須」を表示します。                                                                    |
| `readonly`    | `boolean`             | `false`          | 編集・カレンダー操作を禁止します。値はフォーム送信されます。ラベルに「編集不可」を表示します。                                       |
| `disabled`    | `boolean`             | `false`          | 入力とカレンダー操作を無効にします。値はフォーム送信されません。                                                                     |
| `supportText` | `string \| null`      | `null`           | ラベルの下に表示する補助文。各入力の `aria-describedby` に関連付けます。                                                             |
| `errorText`   | `string \| null`      | `null`           | 呼び出し元のエラー文。内部の検証メッセージより優先して表示します。表示・ARIA 用であり、それ自体は native validity を変更しません。   |
| `Class`       | `string`              | `''`             | ルートの追加 CSS クラス。予約語との衝突を避け、大文字で始まります。                                                                  |

任意の HTML 属性の転送、スロット、公開インスタンスメソッドはありません。表示状態・入力値の操作には props と bindings を使用します。

## 値と検証

- 年は半角数字4桁（`0001`〜`9999`）、月・日は半角数字1〜2桁です。有効な日付は `YYYY-MM-DD` に正規化して `value` に反映します。カレンダーから選択した場合は表示欄の月・日も2桁になります。
- 未完成・不正・範囲外の入力は表示欄に残し、`value` を `''` にします。`2023-02-29`、`2024-02-30`、`2024-04-31` を翌月の日付に繰り上げることはありません。グレゴリオ暦のうるう年（2000年はうるう年、1900年は平年）を検証します。
- 未完成・不正・範囲外の入力がある場合は、内部エラー文と `aria-invalid` を設定し、可視入力の `setCustomValidity()` でネイティブのフォーム送信を防ぎます。必須の空欄もネイティブの検証で防ぎます。任意の全空欄は有効です。
- `minDate`／`maxDate` は厳密な `YYYY-MM-DD` を指定します。不正な境界値や `minDate > maxDate` は設定エラーとして扱い、選択・送信を許可しません。
- HTML 作例にある「今日の前後1年」という暗黙の制限はありません。業務上の範囲は `minDate`／`maxDate` で明示してください。
- 年の選択肢は、範囲の幅が500年以内なら全範囲を表示し、それより広い場合は表示年の前後100年以内を表示します。年や月を移動すると選択肢も更新され、入力欄から範囲内の任意の年を指定できます。年の表示には元の作例同様に和暦を併記します。
- 親が `value` を変更すると入力欄と開いているカレンダーを同期します。親から不正な日付を設定しても補正・繰り上げはしません。範囲変更時は選択済みの値を勝手に変更せず検証エラーとし、カレンダーのフォーカス日を新しい範囲内に調整します。
- `Date` はローカル年月日で構築します。`new Date('YYYY-MM-DD')` や `toISOString()` による UTC 日付のずれを避けています。日時・タイムゾーン付き文字列は入力値として使用しません。

## イベント・公開型

イベントは Svelte の `createEventDispatcher` によるコンポーネントイベントです（DOM を bubble するイベントではありません）。

| イベント        | `event.detail`                          | タイミング                                                 |
| --------------- | --------------------------------------- | ---------------------------------------------------------- |
| `input`         | `DatePickerChangeDetail`                | ユーザーの入力、カレンダーの日付選択・削除・今日の選択。   |
| `change`        | `DatePickerChangeDetail`                | テキスト入力の native `change`、またはカレンダーでの確定。 |
| `date-selected` | `{ value: string; date: Date \| null }` | カレンダーによる選択。削除は空文字列と `null`。            |
| `open`          | `undefined`                             | マウント後にカレンダーが開いたとき。                       |
| `close`         | `undefined`                             | カレンダーが閉じたとき。                                   |
| `reset`         | `undefined`                             | キャンセルされていないフォームリセットを反映したとき。     |

公開型は `DatePickerType`、`DatePickerSize`、`DatePickerChangeDetail`、`DatePickerEvents` です。コンポーネントのモジュールから型を import できます。

```ts
interface DatePickerChangeDetail {
  value: string;
  date: Date | null; // 有効な日付の場合はローカル日付。無効・空欄は null。
  valid: boolean; // 任意の全空欄は true、必須の空欄は false。
  source: "input" | "calendar";
}
```

親による props 更新やフォームリセットでは `input`／`change` は発火しません。

## 分割型と入力の検証

この例は単独で利用できます。

```svelte
<script lang="ts">
    import DatePicker from '@sharelib-jp/digital-agency-components-svelte-implements/components/DatePicker.svelte';
    import type { DatePickerChangeDetail } from '@sharelib-jp/digital-agency-components-svelte-implements/components/DatePicker.svelte';
    import '@sharelib-jp/digital-agency-components-svelte-implements/global.css';

    let visitDate = '';
    let message = '';
    function report(event: CustomEvent<DatePickerChangeDetail>) {
        message = event.detail.valid ? '入力内容は有効です。' : '日付を確認してください。';
    }
</script>

<form>
    <DatePicker id="visit-date" name="visitDate" label="訪問希望日" type="separated"
        size="lg" minDate="2026-10-01" maxDate="2026-12-31" required
        supportText="2026年10月〜12月の間で指定してください。"
        bind:value={visitDate} on:input={report} />
    <p aria-live="polite">{message}</p>
    <button type="submit">申し込む</button>
</form>
```

## 読み取り専用・無効・カレンダーなし

```svelte
<script lang="ts">
    import DatePicker from '@sharelib-jp/digital-agency-components-svelte-implements/components/DatePicker.svelte';
    import '@sharelib-jp/digital-agency-components-svelte-implements/global.css';
</script>

<DatePicker id="confirmed-date" label="確定した日付" value="2026-10-03" readonly
    supportText="確定済みのため編集できません。" />
<DatePicker id="unavailable-date" label="利用できない日付入力" disabled />
<DatePicker id="manual-date" label="日付を直接入力" calendar={false} type="separated" />
```

## フォームとリセット

- `name` を指定すると、有効な ISO 日付を1個の hidden input で送信します。可視入力の年月日は別フィールドとして送信されません。`disabled` は送信対象から外れ、`readonly` は送信対象に残ります。
- native の制約検証には可視入力を使用します。プログラムで `FormData` を直接生成した場合は検証が自動で行われないため、必要に応じて `form.reportValidity()` を呼んでください。不正な日付は hidden input では空文字列となります。
- `form.reset()` と `type="reset"` は、マウント時の `value` を復元してカレンダーを閉じます。その後に親が `value` を変更しても、リセット先は変わりません。
- reset イベントが `preventDefault()` された場合は復元しません。フォームの reset リスナーと document の外側クリックリスナーは破棄時に解除します。
- SSR 中は DOM にアクセスせず、リスナーも登録しません。「今日」はクライアントのマウント時にローカル日付で取得します。SSR で `open` の場合は、初期値、境界値、2000年1月1日の順に表示基準日を決め、マウント後に入力・今日・範囲から更新します。

## キーボードとアクセシビリティ

- 全体の `fieldset`／`legend` と各入力の「年」「月」「日」ラベルで入力目的を伝えます。補助文・エラー文は各入力に関連付けます。
- 統合型の入力欄では、カーソルが先頭／末尾にあるときの左右矢印で隣の欄へ移動します。分割型では通常のテキスト編集の動作を保ちます。
- 入力欄の下矢印またはカレンダーボタンで開き、選択済み日付・入力年月・今日の順で範囲内の基準日へフォーカスします。
- カレンダーの日付ボタンは1個だけ `tabindex="0"` にします。左右矢印は前後1日、上下矢印は前後7日、Home／End は週の日曜／土曜、PageUp／PageDown は前後1か月、Shift + PageUp／PageDown は前後1年です。月・年の移動では29〜31日を移動先月の末日に調整します。
- Enter／Space またはクリックで確定します。Escape は値を変更せず閉じます。Tab／Shift + Tab はダイアログ内で循環し、日付の `tabindex="-1"` は循環対象に含めません。
- 範囲外と表示月以外の日付は無効です。月移動ボタンは `aria-disabled` により境界を示し、クリックしても範囲外へ移動しません。
- 選択・削除・Escape・外側クリック・親からの閉鎖でカレンダーを閉じ、利用可能な開閉ボタンへフォーカスを戻します。`disabled`／`readonly`／`calendar={false}` では `open` を `false` に戻します。
- 表示年月を live region、選択日を `aria-selected`、今日を `aria-current="date"` で伝えます。元の黄色と黒のフォーカス表示、forced-colors 対応を含みます。アニメーションは追加していません。

[コンポーネント一覧に戻る](./README.md)
