# 要件サマリー — セールカレンダー比較ナビ

最終更新: 2026-05-29

実装担当（Codex）が迷わず着手できるよう、要件を整理する。実装の進め方は
[implementation-plan.md](./implementation-plan.md)、技術構成は [architecture.md](./architecture.md)、
検収項目は [acceptance-checklist.md](./acceptance-checklist.md) を参照する。

---

## サービス概要

- **名称**: セールカレンダー比較ナビ
- **目的**: Amazon・楽天のセール予定を起点に、「欲しい商品URL」「希望価格」「実質価格メモ」を
  保存し、セール前に買い時を思い出せるようにするWebアプリ。
- **対象ユーザー**: セール時にまとめ買いしたいが、いつ何を買うか忘れがちな個人。
- **初期対象EC**: Amazon、楽天（将来拡張前提）。
- **コアバリュー**:
  1. セール予定をカレンダーで俯瞰できる。
  2. 欲しいものをセール（イベント）に紐づけて事前登録できる。
  3. セール前に通知され、希望価格・実質価格メモで買い時を判断できる。
- **マネタイズ**: 楽天アフィリエイトリンク変換、記事内・一覧の広告枠（v1.2以降）。

### 重要方針（厳守）

- 価格・商品画像の**無断スクレイピングは禁止**。外部サイトの価格自動取得は行わない
  （価格はユーザーの手入力、または将来の公式API経由のみ）。
- **v1〜v1.2 の商品画像はプレースホルダーのみ**（`public/images/placeholders/` の自作画像）。
  外部の商品画像を取得・表示しない。
- 外部サイト価格を「最安値」と**保証・断定しない**（「最安保証」などの表現禁止）。
- Amazon / 楽天などの**公式サービスと誤認されるロゴ・表現を使わない**。
- ECは固定enumにせず **merchantId / merchants マスタ** で管理し、将来のEC追加に備える。

---

## フェーズ別スコープ

| フェーズ | テーマ | 主な内容 |
| --- | --- | --- |
| **v1 MVP** | カレンダー＋欲しいもの登録の基盤 | カレンダー表示、ECフィルター、商品URL・希望価格保存、状態UI共通化、ローカルフォールバック、merchants マスタ |
| **v1.1** | 価格メモ・楽天アフィリエイト | 実質価格メモ、詳細入力折りたたみ、楽天アフィリエイトリンク変換 |
| **v1.2** | SEO・広告・通知・シェア・履歴 | OGP、広告枠、通知設定、シェア、購入履歴 |
| **v2** | 楽天API・買い時スコア初期版 | 楽天公式APIによる正規データ取得、買い時スコアの初期ロジック |
| **v2.5+** | EC追加・提携フィード準備 | 新規 merchant 追加、提携フィード/正規データ連携の準備 |

> スコープ境界の原則: 「外部から価格・画像を自動取得する機能」は v2 で公式API許諾範囲に限り解禁。
> それ以前は手入力とプレースホルダーのみ。

---

## 画面一覧

| # | 画面 | 主目的 | 主な状態UI |
| --- | --- | --- | --- |
| 1 | トップ | サービス説明・直近セール・主要導線 | Skeleton / Empty / Error |
| 2 | カレンダー | 月次でセール予定を俯瞰、ECフィルター | Skeleton / Empty / Error / Retry |
| 3 | セール詳細 | 特定セールの情報・紐づく欲しいもの | Skeleton / Empty / Error |
| 4 | 欲しいもの登録 | URL・希望価格・実質価格メモ入力（詳細折りたたみ） | Error（バリデーション）/ Toast |
| 5 | 欲しいもの一覧 | 登録済みアイテムの確認・編集・削除 | Skeleton / Empty / Error / Toast |
| 6 | 履歴 | 購入履歴の記録・振り返り | Skeleton / Empty / Error |
| 7 | 記事 | セール攻略などのSEO記事（OGP対応） | Skeleton / Empty |
| 8 | 通知設定 | セール前通知のリードタイム・ON/OFF | Error / Toast |
| 9 | 復旧 | データのエクスポート/インポート・移行 | Error / Toast |

UI再現の参照画像は [ui-reference/README.md](./ui-reference/README.md) の7点（アプリ公開アセットではない）。

---

## データモデル

ECは **enum禁止**。`merchantId`（文字列ID）で参照し、実体は `merchants` マスタで一元管理する。

### Merchant（ECマスタ）
| フィールド | 型 | 説明 |
| --- | --- | --- |
| `merchantId` | string (PK) | 例: `amazon`, `rakuten`（slug兼用可） |
| `name` | string | 表示名（公式ロゴは使わない） |
| `colorToken` | string | カレンダー色分け用トークン |
| `placeholderKey` | string | プレースホルダー画像キー |
| `affiliate` | object \| null | アフィリエイト設定（v1.1で楽天のみ利用） |
| `isActive` | boolean | 表示対象か |
| `sortOrder` | number | 並び順 |

### SaleEvent（セールイベント）
| フィールド | 型 | 説明 |
| --- | --- | --- |
| `id` | string (PK) | |
| `merchantId` | string (FK) | merchants 参照 |
| `title` | string | 例: 楽天スーパーSALE |
| `saleType` | string | 種別ラベル（enumではなく文字列） |
| `startAt` / `endAt` | timestamp | 開催期間 |
| `description` | string | 概要（手入力・公式転載しない要約） |
| `sourceUrl` | string \| null | 参考URL（誤認を避けた表記） |

### WishItem（欲しいもの）
| フィールド | 型 | 説明 |
| --- | --- | --- |
| `id` | string (PK) | |
| `userId` | string (FK) | 匿名Authのuid |
| `title` | string | 商品名（手入力） |
| `productUrl` | string | 商品URL（保存・必要に応じてAF変換） |
| `merchantId` | string (FK) | 紐づくEC |
| `desiredPrice` | number \| null | 希望価格 |
| `actualPriceMemo` | string \| null | 実質価格メモ（ポイント還元等の自由記述, v1.1） |
| `targetSaleEventId` | string \| null | 紐づくセールイベント |
| `placeholderKey` | string | 表示するプレースホルダー画像（外部画像は使わない） |
| `note` | string \| null | 補足メモ |
| `createdAt` / `updatedAt` | timestamp | |

### PurchaseHistory（履歴, v1.2）
| フィールド | 型 | 説明 |
| --- | --- | --- |
| `id` | string (PK) | |
| `userId` | string (FK) | |
| `wishItemId` | string \| null | 元の欲しいもの |
| `merchantId` | string (FK) | |
| `title` | string | |
| `purchasedPrice` | number \| null | 実際の購入額 |
| `purchasedAt` | timestamp | |
| `saleEventId` | string \| null | 購入時のセール |
| `memo` | string \| null | |

### NotificationSetting（通知設定, v1.2）
| フィールド | 型 | 説明 |
| --- | --- | --- |
| `userId` | string (PK) | |
| `enabled` | boolean | 通知ON/OFF |
| `leadDays` | number | セール何日前に通知するか |
| `perMerchant` | map \| null | EC別ON/OFF（任意） |

### Article（記事, v1.2）
| フィールド | 型 | 説明 |
| --- | --- | --- |
| `slug` | string (PK) | URL slug |
| `title` | string | |
| `body` | string (MDX/Markdown) | |
| `ogImage` | string | OGP画像（自作） |
| `tags` | string[] | |
| `publishedAt` | timestamp | |

> リポジトリ/フォールバックの抽象化方針は [architecture.md](./architecture.md) を参照。

---

## 禁止事項・リスク

- **スクレイピング全般禁止**: 外部ECの価格・在庫・画像・レビューの自動取得をしない。
- **外部商品画像の使用禁止**（v1〜v1.2）: 表示は自作プレースホルダーのみ。
- **「最安値」「最安保証」などの断定/保証表現禁止**: あくまで「ユーザーが入力した希望価格・メモ」。
- **公式サービスとの誤認禁止**: 公式ロゴ・公式を装う文言・公式ドメイン風表記を使わない。
- **秘密情報のコミット禁止**: Firebase等のキーは `.env.local` 等に置き、リポジトリに含めない。
- **破壊的操作禁止**: `rm -rf` / `git reset --hard` / 既存ファイルの無断全面上書きをしない。
- **アフィリエイトの規約遵守**: 楽天AF変換は各プログラム規約の範囲で行い、不正な改変はしない。
- **法務リスク**: 価格情報はユーザー自己責任の手入力である旨を明記（免責表示）。

---

## 受け入れ基準（核）

詳細チェックは [acceptance-checklist.md](./acceptance-checklist.md)（AC-001〜AC-021）に対応。

- カレンダーで月次のセール予定が表示される。
- ECフィルター（merchantId単位）で絞り込める。
- 商品URL・希望価格を保存できる。
- 実質価格メモを入力できる。詳細入力は折りたたみで提供する。
- 楽天の商品URLをアフィリエイトリンクに変換できる。
- 通知設定（リードタイム/ON-OFF）を保存できる。
- 購入履歴を記録・確認できる。
- 記事ページにOGPが設定される。
- 広告枠が所定位置に表示される（誤認しない表記）。
- Skeleton / EmptyState / ErrorState / RetryButton / Toast が共通化されている。
- PC/スマホ両対応。スマホで同日複数セールは「2件まで縦スタック、3件以上は上位2件+『+n』バッジ、
  タップで当日一覧ボトムシート」。
- Firebase環境変数が無くても localStorage フォールバックでローカル開発できる。
