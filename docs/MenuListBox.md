# メニューリストボックス（MenuListBox）

開閉ボタンから、操作またはリンクのメニューを表示します。HTML版の `sm`／`md`、テキスト／アウトライン／塗りつぶし、通常／太字のボタンと、矩形の[MenuList](./MenuList.md)を使ったポップアップを移植しています。

導入と共通CSSの設定は[共通の準備](./README.md#共通の準備)を参照してください。

## 基本的な使い方

SSRとクライアントで同じ値になる、一意で空でない `id` を必ず指定します。

```svelte
<script lang="ts">
  import { MenuListBox, type MenuListBoxItem } from '@sharelib-jp/digital-agency-components-svelte-implements';

  const items: MenuListBoxItem[] = [
    { id: 'edit', label: '編集' },
    { id: 'duplicate', label: '複製' },
    { id: 'documents', label: '資料', href: '/documents' },
    { id: 'archive', label: '準備中', disabled: true },
  ];
  let selectedId: string | null = null;
  let open = false;
</script>

<MenuListBox id="document-actions" label="資料の操作" {items} bind:selectedId bind:open />
<p>選択：{selectedId ?? 'なし'}／{open ? '開いています' : '閉じています'}</p>
```

通常の選択では `selectedId` を更新して閉じ、開閉ボタンにフォーカスを戻します。リンクはブラウザーのネイティブ遷移を維持します。`label` は選択結果に自動置換されません。

## Props

| Prop          | 型                                 | 必須   | 既定値        | 説明                                                                          |
| ------------- | ---------------------------------- | ------ | ------------- | ----------------------------------------------------------------------------- |
| `id`          | `string`                           | はい   | なし          | ルートID。`${id}-opener` と `${id}-menu` のARIA関連付けに使う。               |
| `items`       | `MenuListBoxItem[]`                | いいえ | `[]`          | 平坦なメニュー項目。子項目は扱わない。                                        |
| `label`       | `string`                           | いいえ | `'メニュー'`  | 開閉ボタンの表示文言。label slotが優先。                                      |
| `open`        | `boolean`                          | いいえ | `false`       | 開閉状態。`bind:open` に対応。                                                |
| `selectedId`  | `string \| null`                   | いいえ | `null`        | 現在項目。`bind:selectedId` に対応。`null` なら各項目の `current` を使用。    |
| `disabled`    | `boolean`                          | いいえ | `false`       | 開閉ボタンと全項目を無効化し、メニューを閉じる。                              |
| `size`        | `'sm' \| 'md'`                     | いいえ | `'sm'`        | 開閉ボタンのサイズ。項目は常に `regular`。                                    |
| `Style`       | `'text' \| 'outlined' \| 'filled'` | いいえ | `'text'`      | 開閉ボタンの `data-style`。CSS属性 `style` との衝突を避けるため大文字の `S`。 |
| `fontWeight`  | `'normal' \| 'bold'`               | いいえ | `'normal'`    | 開閉ボタンの `data-text-weight`。                                             |
| `iconPath`    | `string \| undefined`              | いいえ | `undefined`   | 開閉ボタンの前方装飾SVGの `path`。未指定なら表示しない。                      |
| `iconViewBox` | `string`                           | いいえ | `'0 0 24 24'` | 開閉ボタンの前方SVGの `viewBox`。CSS表示サイズ20×20。                         |
| `Class`       | `string`                           | いいえ | `''`          | ルートに追加するクラス。大文字の `C`。                                        |

追加属性は `$$restProps` からルートの `div` に転送します。`id` と `class` はpropsが優先されます。`style` はルートのCSS指定です。開閉ボタンや個々の項目への任意属性転送、ネイティブイベント転送はありません。

## バリエーションとlabel slot

以下は独立した例です。label slotにはボタン内で使える非インタラクティブな内容を指定してください。

```svelte
<script lang="ts">
  import { MenuListBox, type MenuListBoxItem } from '@sharelib-jp/digital-agency-components-svelte-implements';

  const items: MenuListBoxItem[] = [
    { id: 'profile', label: 'プロフィール', href: '/profile' },
    { id: 'help', label: 'ヘルプ', href: 'https://example.com/help', target: '_blank' },
    { id: 'logout', label: 'ログアウト' },
  ];
  let open = false;
</script>

<MenuListBox
  id="account-actions"
  {items}
  bind:open
  size="md"
  Style="outlined"
  fontWeight="bold"
  iconPath="M12 2a4 4 0 1 0 0 8a4 4 0 0 0 0-8M4 22v-4a8 8 0 0 1 16 0v4Z"
>
  <span slot="label">アカウント操作</span>
</MenuListBox>
```

開閉矢印は常に表示され、展開時に回転します。`Style="filled"` は薄い灰色の背景、`Style="text"` は枠なしです。

## 公開型と項目

`MenuListBoxItem`・`MenuListBoxSelectDetail` はパッケージルートから `import type` できます。

`MenuListBoxItem` は `MenuListLinkItem` を継承します。全フィールドとアイコンの既定値は[MenuListの型と項目フィールド](./MenuList.md#型と項目フィールド)を参照してください。`id` と `label` が必須で、`href`、`target`、`rel`、`current`、`disabled`、`iconPath`／`iconViewBox`、`tailIconPath`／`tailIconViewBox`／`tailIconLabel`、`endIconPath`／`endIconViewBox` は任意です。`children?: never` により子項目は指定できません。

`selectedId` は現在項目の装飾だけを表し、フォーカス先とは独立しています。現在リンクは `aria-current="page"`、現在操作は `aria-current="true"` です。メニュー項目は `menuitemcheckbox` や `menuitemradio` ではありません。

## 選択イベントの取消

```svelte
<script lang="ts">
  import { MenuListBox, type MenuListBoxSelectDetail } from '@sharelib-jp/digital-agency-components-svelte-implements';

  const items = [
    { id: 'edit', label: '編集' },
    { id: 'report', label: 'レポート', href: '/report' },
  ];
  let allowReport = false;
  let open = false;
  let selectedId: string | null = null;
  let message = '';

  function select(event: CustomEvent<MenuListBoxSelectDetail>) {
    if (event.detail.id === 'report' && !allowReport) {
      event.preventDefault();
      message = 'レポートの選択を許可してください。';
      return;
    }
    message = `${event.detail.item.label}を選択しました。`;
  }
</script>

<label><input type="checkbox" bind:checked={allowReport} />レポートを許可する</label>
<MenuListBox id="report-actions" {items} bind:open bind:selectedId on:select={select} />
<p aria-live="polite">{message}</p>
```

| イベント | detail                    | cancelable | 説明                                                    |
| -------- | ------------------------- | ---------- | ------------------------------------------------------- |
| `select` | `MenuListBoxSelectDetail` | はい       | 有効な項目の通常click時、選択・開閉状態の変更前に発火。 |

`MenuListBoxSelectDetail` の全フィールド：

| フィールド      | 型                | 内容                                                            |
| --------------- | ----------------- | --------------------------------------------------------------- |
| `id`            | `string`          | 選択対象のID。                                                  |
| `item`          | `MenuListBoxItem` | 元の項目オブジェクト。                                          |
| `parentId`      | `string \| null`  | このコンポーネントでは常に `null`。MenuListとの共通フィールド。 |
| `originalEvent` | `MouseEvent`      | 元のclickイベント。Enter／Spaceによるネイティブ起動でもclick。  |
| `index`         | `number`          | `items` 全体での0始まりの位置。無効項目も数える。               |

- `event.preventDefault()` は `selectedId` の更新、閉じる処理、フォーカス復帰、リンクの既定遷移をすべて止めます。
- `originalEvent.preventDefault()` だけなら遷移を止めますが、選択ID更新・閉じる処理は続きます。
- 無効項目や既に取り消されたclickでは発火しません。左ボタン以外、Meta／Ctrl／Shift／Alt付きclickは状態を変えず、リンクのネイティブ操作を維持します。
- HTML Custom Element版の `menuitemselect` ではなく、Svelteの `select` イベントです。DOM要素ではなく項目データを通知し、DOMをbubbleしません。
- 開閉の専用イベントはありません。変更は `bind:open` で受け取ってください。

## bind・キーボード・フォーカス

| 操作場所           | キー／操作          | 動作                                                     |
| ------------------ | ------------------- | -------------------------------------------------------- |
| 開閉ボタン         | click・Enter・Space | 開閉。開くと有効項目の先頭へ移動。                       |
| 開閉ボタン         | 下／上              | 開き、有効項目の先頭／末尾へ移動。                       |
| メニュー内         | 下／上              | 無効項目を飛ばし、有効項目間を循環。                     |
| メニュー内         | Home／End           | 有効項目の先頭／末尾へ移動。                             |
| メニュー内         | Enter               | ネイティブのリンク／ボタンを起動。                       |
| メニュー内のボタン | Space               | ボタンを起動。リンクのSpaceはネイティブ動作のまま。      |
| 展開中             | Escape              | 閉じ、開閉ボタンへフォーカス復帰。                       |
| メニュー内         | Tab／Shift+Tab      | ネイティブの移動を許可し、閉じる。フォーカスは奪わない。 |

- `bind:open` は内部開閉・外側へのpointerdown／click／focusin・選択・無効化に追従します。外側の操作で閉じた場合は外側のフォーカスを維持します。
- `open` の直接代入やSSR初期値による展開は、フォーカスを自動で移動しません。ポップアップ内にフォーカスがある状態で `open=false` にすると、有効な開閉ボタンへ戻します。
- 展開中は有効な項目のうち1つだけ `tabindex="0"` となり、残りは `-1`。閉じると全項目が `-1` です。
- 空の配列や全項目無効でも開けますが、フォーカスは開閉ボタンに残ります。全体の `disabled` は `open=false` に補正します。
- マウント時のみdocumentのリスナーを登録し、アンマウント時に解除します。Tab用の遅延処理も破棄します。

## スロットと制約

- `label` 名前付きslotのみ。slot props、デフォルトslot、公開メソッドはありません。
- 項目IDはメニュー内で一意にしてください。ルートIDおよび派生する `-opener`／`-menu` IDが他の要素と衝突しないようにします。
- 表示名は非空の `label` またはlabel slotで伝えてください。slot内に別のボタン・リンク・入力を置かないでください。
- 現在地はURLから自動判定しません。`selectedId=null` では複数の `current` フラグを許容し、存在しない選択IDも自動補正しません。
- 無効リンクは `href` が外れ、`aria-disabled="true"` と `tabindex="-1"` が付きます。無効ボタンはネイティブ `disabled` です。
- ARIAのmenu buttonであり、フォーム入力のselect／listboxではありません。フォーム送信、階層サブメニュー、文字入力による検索、画面端の位置補正、ポータル、ルーター連携は提供しません。
- ポップアップは親直下に絶対配置され、長いリストは内部スクロールします。祖先の `overflow` による切り取りや他要素との重なりは利用側で調整してください。
- 動きは矢印の状態切替のみでアニメーションはありません。共通トークンのフォーカスリングとforced-colorsの無効色に対応しています。
