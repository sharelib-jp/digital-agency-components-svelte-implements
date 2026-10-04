# コンポーネントドキュメント

現在実装している25コンポーネントを、コンポーネントごとの Markdown ファイルにまとめています。各ファイルには使用例、props の型・既定値、バインド・イベント・スロット、実装上の注意点を記載しています。

## 一覧

| コンポーネント       | 用途                                             | ドキュメント                                          |
| -------------------- | ------------------------------------------------ | ----------------------------------------------------- |
| `Button`             | 操作を表すボタン                                 | [ボタン](./Button.md)                                 |
| `Card`               | props・子要素で内容を渡すシンプルなカード | [カード](./Card.md)                                   |
| `Link`               | ページ・文書へのリンク                           | [リンク](./Link.md)                                   |
| `Image`              | 枠線・キャプション・リンク付き画像               | [画像](./Image.md)                                    |
| `Heading`            | 見出し階層、サイズ、ショルダー、チップ、下線     | [見出し](./Heading.md)                                |
| `Divider`            | 主題の区切り・装飾線                             | [ディバイダー](./Divider.md)                          |
| `FormControlLabel`   | 入力欄のラベルと必須・任意・補助文               | [フォームコントロールラベル](./FormControlLabel.md)   |
| `InputText`          | 1行テキスト入力                                  | [インプットテキスト](./InputText.md)                  |
| `Textarea`           | 複数行入力と文字数カウンター                     | [テキストエリア](./Textarea.md)                       |
| `Checkbox`           | 複数選択、同意、中間状態                         | [チェックボックス](./Checkbox.md)                     |
| `RadioButton`        | 選択肢からの単一選択                             | [ラジオボタン](./RadioButton.md)                      |
| `Switch`             | オン・オフ、2つのモードの切り替え                | [スイッチ](./Switch.md)                               |
| `SearchBox`          | キーワード・対象選択・詳細条件付き検索           | [検索ボックス](./SearchBox.md)                        |
| `HorizontalMenu`     | 水平メニューとサブメニュー                       | [水平メニュー](./HorizontalMenu.md)                   |
| `PageNavigation`     | 前後のページへの移動                             | [ページナビゲーション](./PageNavigation.md)           |
| `ResourceList`       | リンク・チェックボックス・ラジオ付きのリスト     | [リソースリスト](./ResourceList.md)                   |
| `EmergencyBanner`    | 緊急のお知らせと詳細へのリンク                   | [緊急時バナー](./EmergencyBanner.md)                  |
| `NotificationBanner` | 種別付き通知、閉じられる通知                     | [ノティフィケーションバナー](./NotificationBanner.md) |
| `ModalDialog`        | モーダル表示、確認操作、スクロール構成           | [モーダルダイアログ](./ModalDialog.md)                |
| `MenuList`           | リンク・操作・階層付きメニュー                   | [メニューリスト](./MenuList.md)                       |
| `MenuListBox`        | 開閉可能なメニューポップアップ                   | [メニューリストボックス](./MenuListBox.md)            |
| `ProgressIndicator`  | 確定・不確定進捗、処理中の通知                   | [プログレスインジケーター](./ProgressIndicator.md)    |
| `FileUpload`         | ファイル選択・ドロップ・検証・解除               | [ファイルアップロード](./FileUpload.md)               |
| `StepNavigation`     | 手順の現在位置と進行状態                         | [ステップナビゲーション](./StepNavigation.md)         |
| `DatePicker`         | 年月日入力とカレンダーによる日付選択             | [日付ピッカー](./DatePicker.md)                       |

## 共通の準備

### パッケージをインストールする

配布先は **GitHub Packages の npm レジストリのみ**です。追加された6コンポーネントは次回リリースに含まれるため、公開済みの `0.0.1` では利用できません。リリースまではこのリポジトリの最新ソースをビルドして利用してください。認証とインストールの手順は[リポジトリの README](../README.md#インストール利用)を参照してください。

```sh
pnpm add @sharelib-jp/digital-agency-components-svelte-implements@0.0.1
```

### 共通 CSS を読み込む

アプリのエントリーポイントや SvelteKit のレイアウトなど、共通の場所で一度読み込みます。コンポーネントごとのコード例では、この読み込みを省略しています。

```ts
import "@sharelib-jp/digital-agency-components-svelte-implements/global.css";
```

この CSS はデザイントークンとユーティリティを提供します。各コンポーネントの CSS はコンポーネント内に含まれます。ただし `FormControlLabel` は専用の CSS を持たず、組み合わせ先や利用アプリ側のスタイルを使用します。

アプリで既に同じデザイントークンを提供している場合は、その CSS を使えます。テーマの上書きは共通 CSS の読み込み後に指定してください。

### コンポーネントを import する

全コンポーネントはパッケージのルートから名前付きで import できます。

```ts
import {
  Checkbox,
  ModalDialog,
} from "@sharelib-jp/digital-agency-components-svelte-implements";
import type { ResourceListItem } from "@sharelib-jp/digital-agency-components-svelte-implements";
```

個別のファイルを指定することもできます。

```ts
import Checkbox from "@sharelib-jp/digital-agency-components-svelte-implements/components/Checkbox.svelte";
```

## コード例の読み方

- 対応環境は Svelte 5 です。実装に合わせて、例では `let`・`bind:`・`on:` を使う legacy 記法を使用しています。
- 各 `svelte` コードブロックは、必要な import と状態変数を含む個別の使用例です。共通 CSS の設定後、利用する Svelte コンポーネントに配置できます。
- `For`・`Class` のように先頭が大文字の props は、その大文字・小文字を保持してください。HTML と名前が衝突する箇所のための API です。
- すべてのコンポーネントが、任意の HTML 属性やイベントを内部要素へ転送するわけではありません。各ファイルの API と注意点を確認してください。
- フォームコントロールとモーダルの ID は、SSR と hydration で同じ値になるよう、ページ内で一意の値を明示します。
- 画像の例に使用する URL やリンク先は、利用アプリで用意してください。パッケージにサンプル画像やアプリ用の遷移先は含まれません。
- バリデーション、エラー文、入力グループの見出し、アクションの内容は、利用するアプリの責任で適切に設定してください。

## 実装との対応

ドキュメントの内容は現在の [`src/lib/components`](../src/lib/components/) と [`src/lib/index.ts`](../src/lib/index.ts) の公開 API に基づきます。HTML 版の機能がすべて同じ props として使えるという意味ではありません。

移植元とライセンスについては[リポジトリの README](../README.md#ライセンス)と[著作権・許諾表示](../THIRD_PARTY_NOTICES.md)を参照してください。
