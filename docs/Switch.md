# スイッチ（Switch）

設定のオン・オフ、または2つのモードの切り替えに使います。`type="on-off"`はnative checkbox、`type="mode"`は2つのbuttonで実装されており、フォーム送信・検証の扱いが異なります。

導入とアプリrootで一度だけ設定する共通CSSについては、[共通の準備](./README.md#共通の準備)を参照してください。

## 基本的な使い方

```svelte
<script lang="ts">
  import { Switch } from '@sharelib-jp/digital-agency-components-svelte-implements';

  let notifications = false;
</script>

<Switch
  id="switch-notifications"
  name="notifications"
  value="enabled"
  label="通知を受け取る"
  supportText="オンにすると新しいお知らせを通知します。"
  bind:checked={notifications}
/>
<p>通知：{notifications ? 'オン' : 'オフ'}</p>
```

## Props

`id`のみ必須です。型は現在のSvelte実装の`export let`に対応しています。

| Prop          | 型                    | 必須   | 既定値      | 説明                                                                                      |
| ------------- | --------------------- | ------ | ----------- | ----------------------------------------------------------------------------------------- |
| `id`          | `string`              | はい   | なし        | on-offではinput、modeでは左buttonのID。右buttonは`${id}-right`になります。                |
| `type`        | `'on-off' \| 'mode'`  | いいえ | `'on-off'`  | オン・オフまたは2モードの表示・実装を選びます。                                           |
| `name`        | `string \| undefined` | いいえ | `undefined` | on-offのinputの送信名。modeでは使われません。                                             |
| `value`       | `string`              | いいえ | `'on'`      | on-offがオンの場合の送信値。modeでは使われません。                                        |
| `checked`     | `boolean`             | いいえ | `false`     | on-offのオン状態。modeでは`false`が左、`true`が右の有効状態。`bind:checked`対応。         |
| `label`       | `string`              | いいえ | `''`        | on-offのlabel、modeのlegendとして表示する項目名。                                         |
| `leftLabel`   | `string`              | いいえ | `'モード1'` | modeの左buttonの文言。on-offでは使われません。                                            |
| `rightLabel`  | `string`              | いいえ | `'モード2'` | modeの右buttonの文言。on-offでは使われません。                                            |
| `disabled`    | `boolean`             | いいえ | `false`     | on-offのinputまたはmodeの両buttonをnativeに無効化します。                                 |
| `required`    | `boolean`             | いいえ | `false`     | 必須の表示。on-offではnative必須制約、modeでは各buttonの`aria-required`になります。       |
| `supportText` | `string \| null`      | いいえ | `null`      | コントロールの前に表示する補足文。空文字列では表示しません。                              |
| `errorText`   | `string \| null`      | いいえ | `null`      | コントロールの後に表示するエラー文。非空なら操作要素の`aria-invalid="true"`にもなります。 |
| `Class`       | `string`              | いいえ | `''`        | 外側の`fieldset.dads-form-control-label`に追加するクラス。大文字の`C`です。               |

## 状態別・組合せ使用例

### modeの送信値とresetを親で管理する

modeには送信対象のinputがありません。以下は親がhidden inputを用意し、フォームreset時の状態復元も行う例です。

```svelte
<script lang="ts">
  import { Switch } from '@sharelib-jp/digital-agency-components-svelte-implements';

  const initialMapView = false;
  let mapView = initialMapView;
  let submittedView = '未確認';

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    submittedView = String(new FormData(form).get('view'));
  }

  function resetView() {
    mapView = initialMapView;
    submittedView = '未確認';
  }
</script>

<form id="switch-view-form" on:submit={handleSubmit} on:reset={resetView}>
  <Switch
    id="switch-view"
    type="mode"
    label="表示形式"
    leftLabel="一覧"
    rightLabel="地図"
    supportText="2つの表示形式を切り替えられます。"
    bind:checked={mapView}
  />
  <input type="hidden" name="view" value={mapView ? 'map' : 'list'} />
  <button type="submit">送信値を確認</button>
  <button type="reset">初期状態に戻す</button>
</form>
<p>フォームデータの値：{submittedView}</p>
```

### on-offの必須・エラーと無効状態

エラー判定は親で行います。`required`はon-offのnative checkboxにも反映されますが、以下の確認ボタンはフォーム送信ではなく表示の確認用です。

```svelte
<script lang="ts">
  import { Switch } from '@sharelib-jp/digital-agency-components-svelte-implements';

  let importantNotifications = false;
  let attempted = false;
  $: errorText = attempted && !importantNotifications ? '重要な通知をオンにしてください。' : null;
</script>

<Switch
  id="switch-important"
  label="重要な通知"
  name="importantNotifications"
  value="enabled"
  required
  supportText="この設定は利用に必要です。"
  errorText={errorText}
  bind:checked={importantNotifications}
/>
<Switch
  id="switch-emergency"
  label="緊急速報"
  checked
  disabled
  supportText="管理者が設定するため変更できません。"
/>
<button type="button" on:click={() => attempted = true}>設定を確認</button>
```

## bind・イベント・native属性

### 状態とイベント

- `bind:checked`で親と状態を同期します。modeでは左右の`aria-checked`が常に反対になり、`checked=false`が左、`checked=true`が右を表します。
- modeのクリック処理は、押された側を代入するのではなく`checked = !checked`で状態を反転します。どちらのbuttonの操作でも反転し、現在有効な側をキーボード等で操作した場合も同様です。radioグループとしての矢印キー処理はありません。
- 転送されるイベントは両typeとも`on:input`、`on:change`、`on:focus`、`on:blur`です。独自の`CustomEvent`や`detail`はありません。内部で使う`click`はコンポーネントイベントとして明示的に転送していません。
- on-offはinputのDOMイベントを転送します。modeは反転後に両buttonのARIA状態を更新し、操作されたbuttonからbubblingする`Event('input')`、続いて`Event('change')`を生成して転送します。modeのイベントの操作要素はbuttonなので、inputの`.checked`を前提にせず`bind:checked`を使ってください。
- 親から`checked`を変更しただけでは`input`・`change`を生成しません。slotはありません。

### native属性の転送先

- `$$restProps`はon-offでは**内部の`input[type="checkbox"][role="switch"]`**に、modeでは**左右両方の`button[type="button"][role="switch"]`**に同じ内容で適用されます。外側のfieldsetや補足文には適用されません。
- `form`、`aria-label`、`aria-labelledby`、`aria-describedby`、`aria-disabled`、`data-*`、`style`などを渡せます。modeで`aria-label`等を渡すと両buttonが同じ名前になり得るため、左右を区別する文言は通常`leftLabel`・`rightLabel`で指定してください。
- `id`、`type`、`role`、`class`、`disabled`および状態は実装側の指定が優先されます。on-offの`name`・`value`・`required`、modeの`aria-checked`・`aria-required`も実装側が指定します。内部クラスを`class`で追加することはできません。外側には`Class`を使います。
- `aria-describedby`は渡した値に、表示中の`${id}-support-text`と`${id}-error-text`を追加します。非空の`errorText`があると`aria-invalid`は`'true'`になり、それ以外は渡した値を使います。

## 注意点・アクセシビリティ

- `id`と派生IDの`${id}-right`、`${id}-support-text`、`${id}-error-text`をページ内で一意にしてください。
- on-offで`label`を省略するなら、外部labelや`aria-label`、`aria-labelledby`で名前を付けてください。modeの`label`はグループのlegend、`leftLabel`・`rightLabel`は各buttonの名前です。左右の名前を空にしないでください。
- `label`がある場合は「※必須」または「※任意」を表示します。サイズpropはなく、ラベル周りはmd相当で固定されています。
- **on-offの送信・検証：** `name`があり、無効でなく、オンになっているinputだけが`name=value`として送信されます。オフなら値は送信されません。`required`ならオフはnativeの必須制約違反です。
- **modeの送信・検証：** `name`・`value`を渡しても送信値は生成されません。`required`は表示と`aria-required`のみで、nativeの必須検証や未選択状態はありません。送信値や独自の検証が必要なら親で実装してください。hidden inputを併用してmodeを無効化する場合、送信から除外したいならhidden inputにも`disabled`を設定します。
- **modeのreset：** buttonにはnativeの選択状態resetがなく、コンポーネント独自のreset処理もありません。例のように親で`checked`を戻してください。resetの取り消しを扱うアプリでは、取り消された操作で状態を戻さない処理も親の責任です。
- `errorText`はエラー文とARIAの状態を設定するだけで、`setCustomValidity()`や自動検証は行いません。スイッチ本体をエラー色にするCSSは実装されていません。
- `disabled`はnativeに操作・フォーカスを無効化します。`aria-disabled="true"`はフォーカスを残し、両typeのクリックハンドラーで状態変更を止めますが、nativeの`disabled`ではないためon-offのフォーム送信・必須検証からは除外されません。
- フォーカス表示とforced-colors時の配色をカスタマイズで消さないでください。
