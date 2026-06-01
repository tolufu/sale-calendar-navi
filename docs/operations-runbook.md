# 運用手順書（セール情報・記事の更新）

最終更新: 2026-06-01

本番運用での **セール情報** と **記事** の更新方法、公開反映フロー、守るべきポリシーをまとめる。
環境変数・初回セットアップは `docs/owner-setup-todo.md`、リリース全体は `docs/manual-release-steps.md` を参照。

---

## 0. 前提・データの置き場所

- セール情報・記事・マーチャントは **コードにベタ書き（TypeScript 配列）** で管理し、ビルド時に同梱される。
  外部DBやCMSではない。更新＝ファイル編集＋再デプロイ。
  - セール: `src/data/sales.ts`（`saleEvents: SaleEvent[]`）
  - 記事: `src/data/articles.ts`（`articles: Article[]`）
  - EC（マーチャント）: `src/data/merchants.ts`（`merchants: Merchant[]`）
- 型定義は `src/lib/repositories/types.ts`。
- 作業環境は WSL2 Linux 側 `~/dev/workspaces/personal/sale-calendar-navi`。`/mnt/c` `/mnt/d` では作業しない。

> スクレイピング禁止。外部ECの価格・在庫・画像・レビューを自動取得しない。価格は手入力のみ。
> 「最安値」等の断定・保証表現を使わない。公式サービスと誤認される表現・ロゴを使わない。

---

## 1. セール情報の更新（`src/data/sales.ts`）

> **データの出自**: 現行の大型・季節セールは `docs/sale-schedule-input.csv`（各行に根拠URLを記録）を一括取り込みして生成した。
> `sales.ts` の `sourceUrl` は「公式サイトで確認」ボタン用に各ECの公式トップに統一し、CSV側の根拠URLは provenance として保持している。
> 以後の更新は **`sales.ts` を直接編集**する（本章の手順）。新しい大型セールを追加したら、出典の記録として CSV にも 1 行追記しておくと後追いしやすい。

### 1.1 フィールド

| フィールド | 必須 | 内容 |
| --- | --- | --- |
| `id` | ✓ | 一意のID。命名規則: `<merchantId>-<セール種別>-<YYYY-MM>`（例: `rakuten-super-sale-2026-09`）。同月複数なら末尾に `-01` 等。 |
| `merchantId` | ✓ | `merchants.ts` の `merchantId`（`rakuten` / `amazon` / `yahoo-shopping`）。enum ではなくマスタ参照。 |
| `title` | ✓ | 表示名。公式名称をそのまま騙らない範囲で（例:「楽天スーパーSALE メモ」）。 |
| `saleType` | ✓ | 種別ラベル（例:「大型セール」「ポイント施策」「季節セール」）。 |
| `startAt` / `endAt` | ✓ | ISO8601・**JST明記**（`+09:00`）。例: `2026-09-04T20:00:00+09:00`。 |
| `description` | ✓ | 概要。メモ用途であることが伝わる文。 |
| `sourceUrl` | ✓ | 公式トップ等の確認先URL（`null` 可）。 |
| `strategyMemo` | 任意 | 攻略メモ。詳細画面で「。」「改行」区切りの箇条書きになる。 |
| `relatedSaleEventIds` | 任意 | 関連セールの `id` 配列。 |
| `confidence` | 任意 | **`"confirmed"`（確定/開催実績あり）か `"estimated"`（予測）。省略時は confirmed 扱い。** |
| `confidenceNote` | 任意 | 予測根拠の補足（例: `"過去の開催月の傾向から推定"`）。 |

### 1.2 予測日程の付け方（重要）

公式未発表の将来日程は **必ず `confidence: "estimated"` を付ける**。画面上は次のように自動表示される。

- カレンダー月表示: イベントチップが **破線枠＋「◇」** になり、グリッド下に凡例が出る。
- カレンダーのリスト表示・日別モーダル: **「予測」バッジ**。
- セール詳細ページ: **「予測日程」バッジ＋注意書き**（`confidenceNote` があれば追記）。

```ts
{
  id: "rakuten-super-sale-2026-09",
  merchantId: "rakuten",
  title: "楽天スーパーSALE メモ",
  saleType: "大型セール",
  startAt: "2026-09-04T20:00:00+09:00",
  endAt: "2026-09-11T01:59:00+09:00",
  description: "買い回りやポイント施策を確認するための予定です。",
  sourceUrl: "https://www.rakuten.co.jp/",
  strategyMemo: "買い回り条件、クーポン、ポイント上限を事前にメモします。",
  confidence: "estimated",
  confidenceNote: "過去の楽天スーパーSALE開催月（3/6/9/12月）の傾向から推定"
}
```

### 1.3 「予測 → 確定」への切り替え運用

公式が日程を発表したら：

1. 該当イベントの `startAt` / `endAt` を**発表どおりに修正**。
2. `confidence` を `"estimated"` → `"confirmed"`（または行を削除）に変更し、`confidenceNote` を削除。
3. 検証（1.5）→ デプロイ（4章）。

定期チェックの目安: 月初に翌々月までの `estimated` を見直す。

### 1.4 追加・編集の手順

1. `src/data/sales.ts` の `saleEvents` 配列に追記／編集する。
2. `id` の重複がないこと、`merchantId` が `merchants.ts` に存在することを確認。
3. 日時は **JST（+09:00）** で書く。
4. 関連セールを結ぶ場合は双方の `relatedSaleEventIds` を対応させる。

### 1.5 検証（コミット前に必須）

```bash
npx tsc --noEmit     # 型エラーがないこと
npm run lint         # ESLint クリーン
npm run test         # ユニットテスト
npm run build        # 本番ビルドが通ること
```

---

## 2. 記事の更新（`src/data/articles.ts`）

### 2.1 フィールド

| フィールド | 必須 | 内容 |
| --- | --- | --- |
| `slug` | ✓ | URL用。`/articles/<slug>`。半角英数とハイフン、一意。 |
| `title` / `description` | ✓ | 見出し・メタ説明（OGP/SEOに使用）。 |
| `body` | ✓ | 本文。段落は `\n\n` で区切る。 |
| `ogImage` | ✓ | OG画像パス（例: `/images/placeholders/og-sale-calendar.svg`）。自作プレースホルダーのみ。 |
| `tags` | ✓ | タグ配列。 |
| `publishedAt` | ✓ | ISO8601（JST）。一覧の並びと表示日付に使用。 |
| `relatedSlugs` | 任意 | 関連記事の `slug` 配列。 |

### 2.2 手順と注意

1. `articles` 配列に追記。`slug` 重複なし。
2. 画像は `public/images/placeholders/` の自作プレースホルダーのみ（外部画像URLの直貼り・スクレイピング画像は禁止）。
3. 断定・保証表現を避け、「購入前に各サイトで最新条件を確認」の趣旨を保つ。
4. 検証（1.5 と同じコマンド）→ デプロイ。

> サイトマップ（`src/app/sitemap.ts`）と一覧は配列から自動生成されるため、追加の登録作業は不要。

---

## 3. マーチャント（EC）の追加（`src/data/merchants.ts`）

- 新ECは enum ではなく `merchants` 配列に1件追加する（`merchantId` を一意に）。
- `supportsSaleCalendar` を `true` にすればカレンダーのフィルタ対象になる。
- アフィリエイト/API 連携の有無は `supports*` 系フラグと `integrationStatus` で表現。
- 公式サービスと誤認される名称・ロゴは使わない。

---

## 4. 公開反映フロー

1. 作業ブランチで 1.5 の検証を通す。
2. コミット（秘密情報を含めない。`.env.local` はコミットしない）。
3. PR を作成し、レビュー後に `main` へマージ。
4. Vercel が `main` を自動デプロイ（設定は `docs/manual-release-steps.md`）。
5. 本番URLでカレンダー表示・該当セール詳細・記事ページを目視確認。

---

## 5. 更新時チェックリスト

- [ ] `id` / `slug` が一意
- [ ] 日時は JST（`+09:00`）
- [ ] 将来日程に `confidence: "estimated"` を付けたか
- [ ] 公式発表済みの旧 `estimated` を `confirmed` に更新したか
- [ ] `tsc` / `lint` / `test` / `build` が通る
- [ ] 断定・保証表現、公式誤認表現、スクレイピング由来データがない
- [ ] 秘密情報をコミットしていない
