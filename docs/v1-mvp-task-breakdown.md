# v1 MVP タスク分解 — セールカレンダー比較ナビ

最終更新: 2026-05-29
担当: Claude（設計・レビュー） / 実装: Codex

このドキュメントは v1 MVP に**範囲を絞った**実装タスク分解書。
全体方針は [requirements-summary.md](./requirements-summary.md) / [architecture.md](./architecture.md)、
検収は [acceptance-checklist.md](./acceptance-checklist.md)、Codexへの注意は
[v1-codex-prompt-notes.md](./v1-codex-prompt-notes.md) を参照する。

> **重要な前提**: 初期構築コミット（`62d88a1`）で v1 の大半と v1.1 の一部が既に実装済み。
> 本書は「ゼロから作る計画」ではなく、**現状を起点に v1 を確定（done）させるための差分タスク**を中心にまとめる。
> 現状把握の結果は §1、残タスクは §7 に集約する。

---

## 1. 現状実装サマリ（2026-05-29 時点）

`npm run lint` / `npm run test` / `npm run build` はいずれも成功（lint:0 warn / test:4 pass / build:11 routes）。

| 領域 | 状態 | 備考 |
| --- | --- | --- |
| ルーティング・共通レイアウト | ✅ 実装済 | `SiteHeader` / `SiteFooter`、全9ルート存在 |
| 状態UI共通化 | ✅ 実装済 | `Skeleton`/`EmptyState`/`ErrorState`/`RetryButton`/`Toast` |
| merchants マスタ | ✅ 実装済 | `src/data/merchants.ts`（amazon/rakuten）、enum不使用 |
| リポジトリ抽象＋ローカル実装 | ✅ 実装済 | `types.ts` interface群、`local-storage.ts` 全CRUD |
| Firestore実装 | ⚠️ スタブ | `firestore.ts` は local をそのまま返す（差し替え可能な形） |
| Firebase匿名Auth | ✅ 経路あり | 未設定時はローカル匿名uidで代替（実機未検証） |
| カレンダー（月送り/グリッド/フィルター） | ✅ 実装済 | `SaleCalendar.tsx`、初期月が **2026-06 固定**（要確認） |
| 同日複数セール（2件+「+n」/ボトムシート） | ⚠️ ほぼ実装 | 上位n抽出がインライン・未テスト、a11y要改善 |
| セール詳細 | ✅ 実装済 | 紐づく欲しいものへの導線あり |
| 欲しいもの登録フォーム | ✅ 実装済 | URLバリデーション/詳細折りたたみ(=v1.1先行)あり |
| 欲しいもの一覧 | ⚠️ 編集なし | 表示・削除はあるが**編集UIが未実装**（AC-005未充足） |
| 履歴 / 記事 / 通知 / 復旧 | 🟡 土台のみ | v1.2想定。土台は存在（履歴/記事/通知は簡易動作、復旧は説明文のみ） |
| 単体テスト | ⚠️ 限定的 | `affiliate` / `calendar(sort)` のみ。状態UI・フォームのテストなし |
| プレースホルダー画像 | ✅ 自作SVG3点 | 外部画像不使用 |

> **v1.1機能の先行混入に注意**: `actualPriceMemo`・詳細折りたたみ・楽天AF変換は本来 v1.1 だが既に実装済み。
> v1 の検収では「壊さない・断定表現を入れない」を確認しつつ、正式な仕上げ（AC-007〜009）は v1.1 で行う。

---

## 2. 実装するページとルート（v1スコープ）

| ルート | ファイル | 種別 | v1での役割 | 対応AC |
| --- | --- | --- | --- | --- |
| `/` | `app/page.tsx` | RSC | トップ：サービス説明・主要導線・直近セール | AC-001 |
| `/calendar` | `app/calendar/page.tsx` → `SaleCalendar` | Client | 月次カレンダー・ECフィルター・複数セール表示 | AC-001,002,021 |
| `/sales/[id]` | `app/sales/[id]/page.tsx` → `SaleDetail` | Client | セール詳細・紐づく欲しいもの・登録導線 | AC-001 |
| `/wishlist/new` | `app/wishlist/new/page.tsx` → `WishlistForm` | Client | 欲しいもの登録（URL/希望価格/タイトル/EC/対象セール） | AC-003,004 |
| `/wishlist` | `app/wishlist/page.tsx` → `WishlistList` | Client | 一覧・**編集**・削除 | AC-005,006 |
| `/wishlist/[id]/edit` | （**新規**）`app/wishlist/[id]/edit/page.tsx` | Client | 編集フォーム（登録フォーム再利用） | AC-005 |
| `/history` | `app/history/page.tsx` | Client | 履歴の土台（v1.2で完成） | — |
| `/articles`,`/articles/[slug]` | `app/articles/*` | RSC | 記事の土台（v1.2で本格化） | — |
| `/settings/notifications` | `app/settings/notifications/page.tsx` | Client | 通知設定の土台（v1.2で完成） | — |
| `/recovery` | `app/recovery/page.tsx` | RSC | 復旧の土台（v1.2で完成） | — |

> v1で**新規追加が必要なのは編集ルート（`/wishlist/[id]/edit`）のみ**。他は実装済み or 土台で足りる。

---

## 3. 必要コンポーネント

### 3.1 共通UI（`components/ui/`）— 実装済み・再利用

`Skeleton` / `EmptyState` / `ErrorState` / `RetryButton` / `Toast` / `Badge` / `Button` / `Card` /
`PageHeader` / `AdPlaceholder`。取得系の4状態（loading/empty/error/success）を必ず通す方針を維持する。

### 3.2 レイアウト（`components/layout/`）— 実装済み

`SiteHeader`（ナビ）/ `SiteFooter`。レスポンシブ済み。

### 3.3 機能コンポーネント（`features/`）

| コンポーネント | 状態 | v1での残作業 |
| --- | --- | --- |
| `sales/SaleCalendar` | ✅ | 上位n抽出のユーティリティ化＋テスト、初期月の方針確定、色のマスタ駆動化 |
| `sales/SaleDetail` | ✅ | 変更なし（確認のみ） |
| `wishlist/WishlistForm` | ✅ | **編集モード対応**（初期値プリフィル＋update呼び出し） |
| `wishlist/WishlistList` | ⚠️ | **編集導線の追加**、削除確認（任意） |
| `history/*` `articles/*` `notifications/*` | 🟡 | v1では土台のまま据え置き |

### 3.4 v1で切り出すべき（推奨リファクタ）

- `features/sales/DaySalesBottomSheet`：ボトムシートを分離し、Esc/フォーカストラップ等のa11yを集約。
- `lib/utils/calendar.ts` に `pickTopSales(events, limit)` を追加して上位n抽出をテスト可能にする。

---

## 4. 必要な型定義（`lib/repositories/types.ts`）

既存の型で v1 は充足している。追加・変更は不要だが、**将来拡張性**の観点で以下を確認する。

- `Merchant`：`colorToken` を持つ（→ §6.1 でUIに反映させる）。`affiliate` は `{provider, enabled} | null`。
- `SaleEvent`：`saleType` は string（enum禁止を遵守）。
- `WishItem` / `WishItemInput`：`actualPriceMemo`・`targetSaleEventId`・`note` を既に保持し拡張可能。
- v1.2向けの `PurchaseHistory` / `NotificationSetting` / `Article` も定義済み（前倒しでOK、UI完成は後フェーズ）。

> 型の追加・破壊的変更を行う場合は Claude レビューを挟む（リポジトリ実装・モックと同時改修が必要なため）。

---

## 5. モックデータ（`src/data/`）

| ファイル | 内容 | v1での扱い |
| --- | --- | --- |
| `merchants.ts` | amazon / rakuten マスタ | そのまま。EC追加は将来マスタ追記のみ |
| `sales.ts` | 2026-06 の4イベント（同日複数=6/5に2件） | 複数セール表示の動作確認用。日付固定に依存しない検証を推奨 |
| `articles.ts` | 記事1件 | v1.2まで土台 |

検証時の注意：`sales.ts` は **2026-06 に固定**されており、カレンダーの初期月も `new Date(2026,5,1)` 固定。
「現在月」を初期表示にすると開発用シードが見えなくなる。**開発時の見え方の方針（固定月 or 現在月）を確定し、コメントで明示**する。

---

## 6. localStorage / Firestore リポジトリの利用方針

### 6.1 切替方針（実装済み・維持）

- `getRepositories()` が `getFirebaseClient()` の有無で実装を切替（`repositories/index.ts`）。
- Firebase env が揃わなければ **localStorage 実装**にフォールバック（AC-015）。
- 認証も同様に `getAnonymousUserId()` が Firebase匿名Auth or ローカル匿名uid を返す（AC-014）。
- **UIは実装を意識しない**（`getRepositories()` 越しにのみアクセス）。この境界を崩さない。

### 6.2 v1での留意

- `firestore.ts` は現状スタブ（local を返す）。**v1の完了条件は「ローカルで全CRUDが動く」こと**であり、
  Firestore本実装は v1 必須ではない（v2で公式API連携時に本格化）。ただし**スタブである旨をコードコメントで明示**する。
- 色分けは現在 `SaleCalendar.merchantClass()` が amazon/rakuten をハードコード。
  **`merchant.colorToken` 駆動に寄せ、マスタ追加だけで色が付く**構造へ（enum禁止の精神を徹底）。

---

## 7. v1 を done にするための残タスク（差分）

優先度順。各タスクは「Codex実装 → Claude確認」で回す。

- [ ] **T-01（必須/AC-005）** 欲しいもの**編集**機能。`/wishlist/[id]/edit` ルート追加、
      `WishlistForm` を新規/編集兼用化（初期値プリフィル＋`update`）、一覧に編集導線。
- [ ] **T-02（必須/AC-021）** 上位n抽出を `pickTopSales(events, limit=2)` として `calendar.ts` に切り出し、単体テスト追加。
      `SaleCalendar` をこのユーティリティ経由に変更。
- [ ] **T-03（推奨/AC-002）** カレンダーのEC色を `merchant.colorToken` 駆動へ（ハードコード排除）。
- [ ] **T-04（推奨/AC-016〜019）** 状態UIの**コンポーネントテスト**（`EmptyState`/`ErrorState`+Retry/`Toast`）と
      `WishlistForm` のURLバリデーションテストを追加。
- [ ] **T-05（推奨/AC-021）** ボトムシートの a11y（Escで閉じる・フォーカストラップ・`role="dialog"`/`aria-modal`）。
- [ ] **T-06（要確認）** カレンダー初期月とシード日付の方針を確定し、コメントで明示。
- [ ] **T-07（軽微）** `firestore.ts` がスタブである旨のコメント追記。削除確認ダイアログ（任意）。
- [ ] **T-08（確認）** v1.1先行実装（`actualPriceMemo`/折りたたみ/AF変換）が**断定表現・公式誤認・外部取得**を
      含まないことをレビューで確認（コピー文言チェック）。
- [ ] **T-09（完了条件）** `npm run lint` / `npm run test` / `npm run build` 通過を再確認。

---

## 8. テスト観点

### 8.1 単体（必須）

- `pickTopSales`：0/1/2/3件以上で「表示2件・残りカウント」が正しい（T-02）。
- `sortSalesForDisplay`：startAt昇順→merchant sortOrder（既存）。
- `convertRakutenAffiliateUrl`：楽天URLのみ変換・ID無しは非変換・非楽天は非変換（既存）。
- `buildCalendarDays`：42セル・月内外フラグ・日別イベント割当。
- `formatPrice`：null/0/数値の表示（断定表現を含まないこと）。

### 8.2 コンポーネント（推奨）

- `EmptyState`：title/description/action が描画される。
- `ErrorState` + `RetryButton`：`onRetry` が発火する。
- `WishlistForm`：不正URLでエラー表示・保存されない／正常時に `create`（編集時は `update`）が呼ばれる。
- `WishlistList`：loading/empty/error/success の4状態と削除・編集導線。

### 8.3 手動確認（受け入れ）

- env未設定でCRUD一巡（登録→一覧→編集→削除）。
- スマホ幅で同日複数セール（6/5）が「2件+『+n』」、タップでボトムシート全件。
- PC/スマホで主要画面が崩れない。
- 禁止事項：外部画像/価格自動取得なし、「最安」等の断定表現なし、公式誤認表現なし、秘密情報の非コミット。

---

## 9. v1 受け入れ基準（このフェーズで満たすAC）

| AC | 内容 | 現状 |
| --- | --- | --- |
| AC-001 | カレンダー月次表示・月送り | ✅（初期月方針のみ確定要） |
| AC-002 | ECフィルター（merchantId・複数選択） | ✅（色のマスタ駆動化は推奨） |
| AC-003 | 商品URL保存 | ✅ |
| AC-004 | 希望価格保存 | ✅ |
| AC-005 | 一覧で確認・**編集**・削除 | ⚠️ 編集が未実装 → **T-01** |
| AC-006 | 画像は自作プレースホルダーのみ | ✅ |
| AC-014 | Firebase匿名Authで匿名ログイン | ✅ 経路あり（設定時の実機検証は任意） |
| AC-015 | 未設定でlocalStorageフォールバック | ✅ |
| AC-016〜019 | Skeleton/Empty/Error+Retry/Toast | ✅（テスト追加は推奨 T-04） |
| AC-020 | PC/スマホ両対応 | ✅ |
| AC-021 | 同日複数セール表示ルール | ⚠️ 抽出のユーティリティ化＋テスト → **T-02** |

> v1.1以降のAC-007〜013は本フェーズの**必須ではない**（先行実装分は壊さない範囲で維持）。

---

## 10. v1 で「やらないこと」（除外スコープ）

以下は v1 では**実装しない**。データモデル・抽象だけ拡張可能にしておく。

- **楽天API連携**（公式API取得） … v2。スクレイピングは全フェーズ禁止。
- **商品画像の自動取得・表示** … v1〜v1.2はプレースホルダーのみ。
- **外部価格スクレイピング/転載** … 全フェーズ禁止。価格は手入力のみ。
- **実メール送信・プッシュ配信** … v1.2で「設定の保存とスケジュール設計」まで、配信は後続。
- **買い時スコア本実装** … v2。v1では「希望価格・実質価格メモ」を保存するのみ（断定表現を出さない）。
- **OGP/広告枠/シェア/購入履歴の本格実装** … v1.2（v1は土台のみ）。
- **Firestore本実装の完成** … v1はローカル動作で充足（スタブ維持可）。

---

## 11. 完了条件（v1）

1. AC-001〜006・014〜021 を満たす（特に T-01 編集、T-02 複数セール抽出テスト）。
2. `npm run lint` / `npm run test` / `npm run build` が通る。
3. 禁止事項（スクレイピング/外部画像/断定表現/公式誤認/秘密情報コミット）に違反しない。
4. Firebase未設定でローカル（localStorage）に登録→一覧→編集→削除が一巡する。
</content>
</invoke>
