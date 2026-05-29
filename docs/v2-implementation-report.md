# v2 実装レポート

作成日: 2026-05-30

## 実装内容

- 楽天商品検索のProviderインターフェースと楽天API adapterを追加。
- `/api/products/rakuten/search` を追加し、楽天APIキーをブラウザへ出さずに候補検索できるようにした。
- APIキー未設定時はモック候補を返し、手入力のまま続けられるUIにした。
- 欲しいもの登録画面に楽天商品補完UIを追加。
- 楽天API候補から商品名、URL、価格候補、affiliateUrl、許可された画像URLを反映できるようにした。
- `imageSource = "rakuten_api"` と画像URLを候補に保存できるようにした。
- 買い時スコア初期版 `calculateBuyTimingScore` を追加し、欲しいものカードに控えめな表示を追加。
- Amazon連携はProviderインターフェースとTODOドキュメントに留めた。

## 画像・価格方針

- 楽天APIから返された画像URLのみ `rakuten_api` として保存・表示する。
- API未設定時、画像なし候補、手入力候補はプレースホルダーを使う。
- 価格はAPI候補の補完値またはユーザー入力値として扱い、買い時スコアも断定表現を避ける。
- スクレイピング、無断画像取得、最安保証表現は実装していない。

## 環境変数

`.env.example` に次を追加。

```bash
RAKUTEN_APPLICATION_ID=
RAKUTEN_AFFILIATE_ID=
```

`RAKUTEN_APPLICATION_ID` 未設定時はモック候補を返す。

## テスト観点

- 楽天API adapterのモック挙動。
- 楽天APIレスポンスからのaffiliateUrl、imageSource保存。
- 買い時スコア計算。
- データ不足時の控えめな表示。
