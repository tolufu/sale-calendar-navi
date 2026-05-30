# 手動リリース手順

## 1. ローカル確認

```bash
cp .env.example .env.local
npm install
npm run lint
npm run test
npm run build
npm audit --omit=dev
```

`.env.local` はコミットしない。Firebase未設定の状態で起動し、欲しいもの登録、一覧、編集、削除、通知設定保存が localStorage で動くことを確認する。

2026-05-30 時点では、Next.js が内包する `postcss` に由来する moderate 警告が本番依存に2件ある。`npm audit fix --force` は破壊的な Next.js 変更を提案するため自動適用せず、Next.js の更新可否を別途レビューしてリリース判断する。

## 2. Vercel プロジェクト設定

1. Vercel でリポジトリを接続し、Framework Preset を Next.js にする。
2. Node.js を 22 系に設定する。
3. Production と Preview の Environment Variables を分けて設定する。
4. Production に `NEXT_PUBLIC_SITE_URL` と `NEXT_PUBLIC_CONTACT_EMAIL` を設定する。
5. 楽天APIを使う場合だけ、サーバー側変数 `RAKUTEN_APPLICATION_ID` と `RAKUTEN_AFFILIATE_ID` を設定する。
6. 予約済み機能フラグは、機能レビューが終わるまで空欄にする。`NEXT_PUBLIC_ENABLE_PUBLIC_SHARE` をデフォルトONにしない。

## 3. Firebase を使う場合

1. Firebase Console で Web App を作成する。
2. Authentication の Anonymous provider を有効化する。
3. Authentication の許可ドメインに Vercel の本番ドメインを追加する。
4. Firebase Web SDK の公開設定値を Vercel の `NEXT_PUBLIC_FIREBASE_*` に設定する。
5. 現時点の Firestore リポジトリは localStorage 互換スタブであることを確認する。
6. Firestore永続化を実装するまでは `firestore.rules` の deny-all を維持する。
7. Firestore永続化を将来有効化する場合は、ユーザー単位の rules をレビューしてから `firebase deploy --only firestore:rules` を実行する。

## 4. Preview 確認

1. Vercel Preview をデプロイする。
2. `/terms`、`/privacy`、`/operator`、`/contact` を確認する。
3. `/sitemap.xml` と `/robots.txt` のURLが設定した `NEXT_PUBLIC_SITE_URL` を使っていることを確認する。
4. トップ、記事詳細、OGPに自作プレースホルダーが使われていることを確認する。
5. 楽天公式API画像を表示する場合は、画像出典が表示されることを確認する。
6. 通知画面は設定保存だけであり、実メールを送信しないことを確認する。
7. 広告枠、アフィリエイト表記、非公式サービスの説明を確認する。

## 5. Production 反映

1. [リリースチェックリスト](./release-checklist.md) を埋める。
2. Production の環境変数に本番用の値が設定され、リポジトリには含まれていないことを確認する。
3. Production をデプロイする。
4. 公開URLで `/`、`/calendar`、`/wishlist/new`、`/articles`、法的ページ、`/sitemap.xml`、`/robots.txt` を確認する。
5. 問い合わせボタンから、設定した公開連絡先への `mailto:` が開くことを確認する。

## UI参照画像

`docs/ui-reference/` の7画像はレビュー専用であり、公開アセットではない。要件定義書とあわせてUIレビューに使い、`public/` へコピーしない。実在の商品画像や企業ロゴ画像も追加しない。
