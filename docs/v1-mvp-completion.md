# v1 MVP 完了内容と未実装範囲

最終更新: 2026-05-29

## 完了内容

- `/`, `/calendar`, `/calendar/[merchantSlug]`, `/sales/[id]`, `/wishlist`, `/wishlist/new`, `/history`, `/articles`, `/articles/[slug]`, `/settings/notifications`, `/recovery` の画面土台を実装。
- Amazon / 楽天を `merchants` マスタで管理し、ECは `merchantId` 参照に統一。
- セールモックに大型セール、通常セール、同日3件以上のケースを追加。
- カレンダーに月表示、リスト表示、ECフィルター、スマホ向け `+n` 表示、当日一覧モーダルを実装。
- セール詳細に開催状態、概要、攻略メモ、公式リンク、関連セール、広告枠、X共有の土台を実装。
- 欲しいもの登録に商品URL、EC自動判定、Amazon ASIN抽出、希望価格、実質価格メモ、詳細入力折りたたみ、localStorage保存を実装。
- 欲しいもの一覧にプレースホルダー画像、登録日、EC、希望価格、実質価格メモ、編集、削除、削除履歴保存を実装。
- 履歴にセール閲覧、記事/削除済み商品を扱える共通型、タブ、個別削除、全削除、最大30件制限を実装。
- 記事一覧・記事詳細のレイアウト土台、目次、早見表、本文広告、サイドバー、スマホ固定共有バーを実装。
- `Skeleton`, `EmptyState`, `ErrorState`, `RetryButton`, `Toast`, `AdPlaceholder` を共通UIとして利用。
- merchant判定、ASIN抽出、セール開催状態、実質価格計算土台、履歴30件制限の単体テストを追加。

## 未実装・次フェーズ

- Firestoreの本実装とセキュリティルールは未接続。現状はFirebase設定があってもlocalStorage互換リポジトリを返す。
- 楽天アフィリエイト変換は環境変数がある場合のみ簡易変換。規約確認後にv1.1で本実装する。
- OGPのページ別最適化、広告配信、通知送信、復旧コードのハッシュ保存・検証はv1.2以降。
- UI参照画像そのものは公開アセットとして使わず、`public/images/placeholders/` の自作プレースホルダーのみを表示。
