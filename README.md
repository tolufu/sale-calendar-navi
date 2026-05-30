# セールカレンダー比較ナビ

Amazon・楽天のセール予定を起点に、欲しい商品URL、希望価格、実質価格メモを保存するWebアプリです。

## 必要環境

- WSL2 Ubuntu-24.04 または同等の Linux 環境
- Node.js 22 系を推奨（確認済み: `v22.22.3`）
- npm 10 系を推奨（確認済み: `10.9.8`）

Windows 側の `/mnt/c/...` や `/mnt/d/...` ではなく、Linux 側のワークスペースで作業します。

## ローカル起動

依存関係をインストールし、環境変数ファイルを作成して開発サーバーを起動します。

```bash
npm install
cp .env.example .env.local
npm run dev
```

起動後は `http://localhost:3000/` を開きます。主な確認URL:

- `http://localhost:3000/calendar`
- `http://localhost:3000/calendar/amazon`
- `http://localhost:3000/wishlist/new`
- `http://localhost:3000/settings/notifications`

## 環境変数

`.env.local` は Git 管理対象外です。Firebaseキー、楽天APIキー、公開連絡先の実値は `.env.local` または Vercel の Environment Variables に設定し、コミットしません。

```bash
cp .env.example .env.local
```

### Firebase

Firebase Web SDK の設定値をすべて設定すると、Firebase Anonymous Auth を使います。未設定または一部未設定の場合は、ブラウザでローカル匿名IDを作成し、localStorage リポジトリへフォールバックします。

現時点の Firestore リポジトリは localStorage 互換スタブです。Firebase値を設定しても、欲しいもの等の永続化先は localStorage のままです。Firestore 永続化を有効にする前に `firestore.rules` を要件に合わせて更新し、Firebase側へデプロイしてください。

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### 楽天API・公開設定

楽天商品検索APIのキーはサーバー側 Route Handler だけで使います。`RAKUTEN_APPLICATION_ID` と `RAKUTEN_AFFILIATE_ID` に `NEXT_PUBLIC_` を付けないでください。

```bash
RAKUTEN_APPLICATION_ID=
RAKUTEN_AFFILIATE_ID=
NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID=
NEXT_PUBLIC_RAKUTEN_AFFILIATE_SCID=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_CONTACT_EMAIL=
```

公開時は `NEXT_PUBLIC_SITE_URL` と `NEXT_PUBLIC_CONTACT_EMAIL` を設定してください。
`NEXT_PUBLIC_CONTACT_EMAIL` はお問い合わせページのメール送信導線に使う公開連絡先です。

予約済み機能フラグは、対象機能をレビューするまで空欄のままにします。特に共有機能をデフォルトONにしません。

```bash
ENABLE_ASP_FEED=
ENABLE_CSV_IMPORT=
NEXT_PUBLIC_ENABLE_PUBLIC_SHARE=
```

## 確認コマンド

```bash
npm run lint
npm run test
npm run build
```

必要に応じて Playwright のE2Eも実行します。

```bash
npm run test:e2e
```

## Vercel デプロイ

1. Vercel でリポジトリを接続し、Framework Preset を Next.js にする。
2. Node.js は 22 系を選ぶ。
3. Preview / Production ごとに必要な Environment Variables を設定する。秘密値をリポジトリへ追加しない。
4. Production の `NEXT_PUBLIC_SITE_URL` は公開URLにする。OGP、canonical、`sitemap.xml`、`robots.txt` の基準URLに使われる。
5. `NEXT_PUBLIC_CONTACT_EMAIL` に公開してよい問い合わせ先を設定する。
6. Firebaseを使う場合は Anonymous Authentication を有効化し、許可ドメインを確認する。Firestore永続化は現状未接続のため、有効化前に rules と実装を別途レビューする。
7. デプロイ後に [リリースチェックリスト](./docs/release-checklist.md) と [手動リリース手順](./docs/manual-release-steps.md) を確認する。

## v1.1 価格メモ

欲しいもの登録では、通常項目として商品URL、商品名、希望価格、現在の実質価格メモ、自由メモを保存できます。「詳細入力を開く」から、商品価格、送料、クーポン値引き、付与ポイント、ポイント換算率を手入力すると、画面上で実質価格を計算します。

実質価格の計算式は次の通りです。

```text
商品価格 + 送料 - クーポン値引き - 付与ポイント × ポイント換算率
```

商品価格が未入力の場合は「未計算」と表示します。空欄の送料、クーポン値引き、付与ポイントは0扱い、ポイント換算率は未入力時に1として扱います。価格やポイントはユーザーの手入力値で、外部サイトから自動取得しません。

## 楽天アフィリエイト変換

楽天URLを登録した場合のみ、元URLを `originalUrl`、変換後URLを `affiliateUrl` として分けて保存します。v1.1ではダミーの `scid=af_link_dummy` を付与する実装で、将来は環境変数や設定ファイルの値に差し替えられる構造です。楽天以外のURLは変換しません。

## 参考リンク

詳細入力から価格比較メモ、公式、その他の参考URLを複数保存できます。参考リンクは開くためのURL保存だけを行い、価格、在庫、画像、レビューの取得や転載は行いません。

## v2 楽天商品補完

欲しいもの登録画面では、楽天URLまたはキーワードから楽天商品候補を検索できます。楽天APIキーはブラウザへ出さず、`/api/products/rakuten/search` のサーバー側ルートでのみ利用します。

- `RAKUTEN_APPLICATION_ID`: 楽天商品検索APIのアプリID
- `RAKUTEN_AFFILIATE_ID`: 任意。設定時は楽天APIレスポンスの `affiliateUrl` を候補として保存

`RAKUTEN_APPLICATION_ID` が未設定の場合、画面は壊れず、モック候補または手入力のまま保存できます。モック候補では価格・画像を補完しません。

## 買い時スコア

欲しいもの一覧では、希望価格、候補の実質価格、関連セール、前回候補、確認日から0〜100点の目安を表示します。データが足りない場合は「データ不足」と表示し、「必ず安い」などの断定はしません。

## 画像方針

v1〜v1.2 の商品画像は `public/images/placeholders/` に置いた自作プレースホルダーのみを使います。v2以降では、楽天公式APIから返された画像URLに限り `imageSource = "rakuten_api"` として保存し、出典を明記して表示できます。API未設定時や画像がない候補ではプレースホルダー表示のままです。ユーザー任意の画像URL入力、スクレイピング、外部商品画像の無断取得・転載は行いません。

## 禁止事項

- 外部ECの価格・在庫・画像・レビューのスクレイピング
- 公式サービスと誤認されるロゴや表現
- 「最安値」「最安保証」などの断定・保証表現
- Firebaseキー等の秘密情報のコミット
