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
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 確認コマンド

```bash
npm run lint
npm run test
npm run build
```

## 画像方針

v1〜v1.2 の商品画像は `public/images/placeholders/` に置いた自作プレースホルダーのみを使います。外部ECの商品画像取得・保存・表示は行いません。

## 禁止事項

- 外部ECの価格・在庫・画像・レビューのスクレイピング
- 公式サービスと誤認されるロゴや表現
- 「最安値」「最安保証」などの断定・保証表現
- Firebaseキー等の秘密情報のコミット
