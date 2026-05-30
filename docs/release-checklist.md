# リリースチェックリスト

公開前に Preview 環境で確認し、Production 反映時にも環境変数と公開URLを再確認する。

## 自動チェック

- [ ] `npm run lint` が成功する。
- [ ] `npm run test` が成功する。
- [ ] `npm run build` が成功する。
- [ ] 必要に応じて `npm run test:e2e` を実行する。
- [ ] `npm audit --omit=dev` を確認し、既知の moderate 警告を含めてリリース可否を判断する。
- [ ] `.env.local`、本番キー、秘密情報がコミットされていない。

## Vercel・環境変数

- [ ] Vercel の Node.js を 22 系に設定する。
- [ ] Production の `NEXT_PUBLIC_SITE_URL` を公開URLに設定する。
- [ ] `NEXT_PUBLIC_CONTACT_EMAIL` に公開してよい問い合わせ先を設定する。
- [ ] 楽天APIを使う場合、`RAKUTEN_APPLICATION_ID` と `RAKUTEN_AFFILIATE_ID` をサーバー側環境変数として設定する。
- [ ] `NEXT_PUBLIC_ENABLE_PUBLIC_SHARE` は空欄のまま、または明示的に無効とし、共有をデフォルトONにしない。

## 公開ページ・SEO

- [ ] `/terms`、`/privacy`、`/operator`、`/contact` を確認する。
- [ ] 広告枠に `Advertisement` が表示される。
- [ ] 広告・アフィリエイトリンクを含む場合がある旨を規約、運営者情報、問い合わせページで確認する。
- [ ] OGP画像が自作の `/images/placeholders/og-sale-calendar.svg` である。
- [ ] 記事詳細の title、description、OGP、canonical を確認する。
- [ ] `/sitemap.xml` のURLが本番ドメインである。
- [ ] `/robots.txt` の sitemap URL が本番ドメインである。

## Firebase・通知

- [ ] Firebaseを使わない場合、Firebase環境変数を空欄にして localStorage フォールバックを確認する。
- [ ] Firebaseを使う場合、Anonymous Authentication と許可ドメインを確認する。
- [ ] `firestore.rules` は deny-all の初期値である。Firestore永続化を接続するまでは緩和しない。
- [ ] Firestore永続化を接続する場合、ユーザー単位のアクセス制御をレビューし、rules をデプロイする。
- [ ] 通知画面は設定保存と通知候補表示のみで、実メールを送信しないことを確認する。

## データ・画像・表現

- [ ] 外部ECの価格、在庫、画像、レビューをスクレイピングしていない。
- [ ] 価格やポイント条件はユーザー入力メモとして扱っている。
- [ ] v1〜v1.2 の商品画像は自作プレースホルダーのみである。
- [ ] v2以降で楽天公式API画像を表示する場合、楽天API由来の出典表示がある。
- [ ] ユーザー任意の画像URL入力や外部商品画像の無断取得・転載がない。
- [ ] 実在の商品画像や企業ロゴ画像を公開アセットとして追加していない。
- [ ] 「最安値」「最安保証」等の断定・保証表現がない。
- [ ] Amazon、楽天その他ECの公式サービスと誤認される表現がない。

## UI参照画像

- [ ] `docs/ui-reference/` に `01_`〜`07_` の参照画像7点がある。
- [ ] `docs/ui-reference/` に `:Zone.Identifier` などの付帯ファイルがない。
- [ ] 参照画像を `public/` やアプリ画面へ直接流用していない。
- [ ] 参照画像を要件定義書とあわせてUIレビューに使用する。
