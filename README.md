# セールカレンダー比較ナビ

Amazon・楽天のセール予定を起点に、欲しい商品URL、希望価格、実質価格メモを保存するWebアプリです。

## 開発

```bash
npm install
npm run dev
```

Firebase 環境変数が未設定でも、匿名ローカルIDと localStorage リポジトリで画面確認できます。

ローカル確認URL:

- `http://localhost:3000/`
- `http://localhost:3000/calendar`
- `http://localhost:3000/calendar/amazon`
- `http://localhost:3000/wishlist/new`

## 環境変数

`.env.example` をコピーして `.env.local` を作成してください。秘密情報はコミットしません。

Firebaseを使う場合は次の公開設定を `.env.local` に置きます。未設定時は自動でlocalStorageへフォールバックします。

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID=
RAKUTEN_APPLICATION_ID=
RAKUTEN_AFFILIATE_ID=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_CONTACT_EMAIL=
```

公開時は `NEXT_PUBLIC_SITE_URL` と `NEXT_PUBLIC_CONTACT_EMAIL` を設定してください。
`NEXT_PUBLIC_CONTACT_EMAIL` はお問い合わせページのメール送信導線に使う公開連絡先です。

## 確認コマンド

```bash
npm run lint
npm run test
npm run build
```

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
