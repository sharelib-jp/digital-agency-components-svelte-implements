# digital-agency-components-svelte-implements

デジタル庁の [HTML/CSS/JavaScript コンポーネント](https://github.com/digital-go-jp/design-system-example-components-html)を Svelte 5 に移植した共有ライブラリです。

**配布先は GitHub Packages の npm レジストリのみです。npmjs.org には公開しません。**

## コンポーネント

Button、Checkbox、Divider、EmergencyBanner、FormControlLabel、Heading、HorizontalMenu、Image、InputText、Link、ModalDialog、NotificationBanner、PageNavigation、RadioButton、ResourceList、SearchBox、Switch、Textarea の18種類を提供します。

## インストール・利用

Node.js 22.12 以上が必要です。このリポジトリの開発・CIでは Node.js 24 と pnpm 12.8.1 を使用します。

利用するプロジェクトの `.npmrc` に次を設定します。実際のトークンはコミットしないでください。

```ini
@sharelib-jp:registry=https://npm.pkg.github.com
```

GitHub Packages は公開パッケージでも認証が必要です。ローカルでは GitHub の **personal access token (classic)** を作成し、最小限の **`read:packages`** を付与してください。利用者にパッケージの Read 権限も必要です。組織が SSO を要求する場合はトークンを組織に承認してください。fine-grained PAT では代替できません。

```sh
npm login --scope=@sharelib-jp --auth-type=legacy --registry=https://npm.pkg.github.com
```

Username には GitHub ユーザー名、Password には上記トークンを入力します。ログイン情報はユーザーの `~/.npmrc` に保存されます。ソースコード、プロジェクトの `.npmrc`、コマンド履歴にトークンを直接書かないでください。

```sh
pnpm add @sharelib-jp/digital-agency-components-svelte-implements@0.0.1
```

```svelte
<script lang="ts">
   import '@sharelib-jp/digital-agency-components-svelte-implements/global.css';
   import { Checkbox, ModalDialog, Textarea } from '@sharelib-jp/digital-agency-components-svelte-implements';

   let agreed = false;
   let message = '';
   let open = false;
</script>

<Checkbox id="agree" label="同意する" bind:checked={agreed} />
<Textarea id="message" label="お問い合わせ" counterMax={100} bind:value={message} />
<button type="button" on:click={() => open = true}>確認</button>
<ModalDialog id="confirmation" heading="確認" bind:open message="続けますか？" />
```

個別のコンポーネントも import できます。

```ts
import Checkbox from "@sharelib-jp/digital-agency-components-svelte-implements/components/Checkbox.svelte";
import type { ResourceListItem } from "@sharelib-jp/digital-agency-components-svelte-implements";
```

- HTML 属性名との衝突でそのまま定義できない props は `For`・`Class` のように先頭大文字を使用します。
- フォーム系・モーダルの `id` はページ内で一意にしてください。
- デザイントークンを既に定義しているアプリでは、その CSS を使用できます。パッケージの `global.css` を使う場合、アプリのテーマ上書きはその後に定義します。
- `dist` に前処理済み `.svelte`・JavaScript・型定義・CSSを配布します。テスト、ソース、認証情報は配布物に含めません。

## 開発と検証

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm test:components
pnpm test:components:browser
pnpm test:package
pnpm build
node --test tests/check-publish-registry.test.mjs scripts/package-version-published.test.mjs
```

`test:components` はコンパイル・SSRの152テスト、`test:components:browser` は Firefox の実操作テストです。ローカルに Firefox がない場合だけブラウザーテストを skip します。必要なら `FIREFOX_BIN` に実行ファイルを指定できます。CI は Firefox を明示インストールします。

既存の Button / InputText の未使用 CSS 警告12件は、移動に伴って変更していません。

## GitHub Actions による公開・更新

`.github/workflows/ci.yml` は次のように動作します。

1. main への push、PR、手動実行で型・SSR・Firefox・ビルド・公開ガードを検証。
2. 検証成功後、main の push / 手動実行に限り GitHub Packages を照会。
3. `package.json` のバージョンが未公開の場合だけ GitHub Packages に公開。既公開のバージョンは skip。
4. 実際にレジストリからダウンロードしたアーカイブと metadata を検証し、`github-package` Actions artifact に7日間保存。

**コードの変更だけでは新しいバージョンを公開しません。** 新しいリリースでは必ずバージョンを上げます。同一バージョンの上書きはしません。

```sh
npm version patch --no-git-tag-version
pnpm install --lockfile-only
git add package.json pnpm-lock.yaml
git commit -m "chore: bump package version"
git push origin main
```

初回は `0.0.1` の main push が公開対象です。GitHub の Actions タブから workflow を手動再実行することもできます。

### 公開側で必要な設定

- このリポジトリで GitHub Actions を有効にします。
- CI は GitHub が自動発行する **`GITHUB_TOKEN`** とジョブ限定の **`packages: write`** を使用します。公開用 PAT や npmjs.org 用トークンの登録は不要です。
- 組織のポリシーで Actions の package 作成・書き込みが禁止されている場合は、管理者に許可してもらってください。
- 初回作成されるパッケージの可視性は既定で private です。リポジトリの可視性とは別です。必要に応じて GitHub の Package settings で変更してください。

公開先は `.npmrc` の scope、`publishConfig.registry`、CI の `--registry`、`prepublishOnly` ガードで GitHub Packages に限定しています。手動公開が必要な場合も `pnpm publish:github` を使用してください。`--ignore-scripts` などでガードを無効にしないでください。

### `auth` の CI / Dependabot から読むための設定

パッケージ作成後、GitHub のパッケージページで **Package settings → Manage Actions access → Add repository** を開き、**`sharelib-jp/auth` を Read 権限で追加**してください。

- auth の CI は `packages: read` の `GITHUB_TOKEN` を使用できます。読み取り用 PAT を Actions secrets に追加する必要はありません。
- GitHub Packages に対する Dependabot もこの Read 許可を利用します。追加の Dependabot PAT secret は不要です。
- auth に用意する `.github/dependabot.yml` はこの共有パッケージの更新 PR を作成します。自動マージはせず、アプリの型チェック・ビルド後に確認してマージします。
- auth 側の設定は別途 commit / push した時点で有効になります。この移行作業では **auth を push しません**。

## ライセンス

本リポジトリは MIT ライセンスです。移植元の著作権・許諾表示は [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) に保持しています。

## 参考

- [Svelte のパッケージ化](https://svelte.dev/docs/kit/packaging)
- [GitHub Packages npm registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry)
- [Dependabot の GitHub Packages アクセス](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/configuring-access-to-private-registries-for-dependabot)
