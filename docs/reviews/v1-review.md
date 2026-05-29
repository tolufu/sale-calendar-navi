# v1 MVP コードレビュー

- 対象コミット: `2a6972b feat: v1 MVPを実装`（ブランチ `main`）
- レビュー日: 2026-05-29
- レビュー担当: Claude（設計・レビュー）
- 実行環境: WSL2 Ubuntu-24.04 / Node v22.22.3 / npm 10.9.8

---

## 総合判定: NEEDS_FIX（致命的欠陥なし・軽微修正中心）

ロジック・データモデル・規約順守（スクレイピング無し／プレースホルダー画像のみ／断定表現無し／
Firebase未設定でも動作）は良好で、`npm run lint` / `npm run test` / `npm run build` はすべて成功します。
機能要件（ルート・フィルター・複数セール表示・URL保存/merchantId判定/ASIN抽出/希望価格/実質価格メモ/
編集/削除）も満たしています。

ただし以下の理由でリリース前に修正を推奨し、判定は NEEDS_FIX とします（いずれも限定的・軽微）。

1. **スマホ下部ナビが未実装**（参照画像7枚のUI要件との差分）。
2. **削除操作に確認ステップ・エラーハンドリングが無い**（破壊的操作の堅牢性）。
3. **バッジ色が merchant マスタの `colorToken` ではなくハードコード**（マスタ管理方針との不整合）。

---

## 実行結果

| コマンド | 結果 | 備考 |
| --- | --- | --- |
| `npm run lint` | ✅ 成功 | `No ESLint warnings or errors` |
| `npm run test` | ✅ 成功 | **6スイート / 9テスト 全パス**（vitest 2.1.9・vite 5.4.21 で整合） |
| `npm run build` | ✅ 成功 | 11ルート生成・型チェック通過（Next.js 15.5.18） |

---

## 良い点

- **必要ルートがすべて存在**（ビルドの Route 一覧で確認）。
  `/`, `/calendar`, `/calendar/[merchantSlug]`, `/sales/[id]`, `/wishlist`, `/wishlist/new`,
  `/history`, `/articles`, `/articles/[slug]`, `/recovery`（加えて `/settings/notifications`）。
- **EC は merchant マスタで管理**され enum 固定でない。
  `src/data/merchants.ts` ＋ `src/lib/repositories/types.ts` の `Merchant`
  （`merchantId` / `colorToken` / `affiliate` / `isActive` / `sortOrder`）。
- **フィルター（すべて／Amazon／楽天）が機能**。
  `SaleCalendar.tsx` の `activeMerchantIds` トグル＋「すべて」(`showAllMerchants`)。
- **スマホカレンダーの複数セール表示が要件どおり**。
  `SaleCalendar.tsx`：1セル最大2件（`visibleEvents`）→ 超過は `+n`（`hiddenCount`）→
  日付タップで当日一覧ボトムシート（`selectedDayEvents`、モバイルは `items-end` で下部シート表示）。
- **商品登録ロジックが要件を満たす**（`WishlistForm.tsx`）。
  URL保存、`detectMerchantIdFromUrl` による merchantId 自動判定、`extractAmazonAsin` による ASIN 抽出
  （入力時プレビュー）、希望価格、実質価格メモ、対象セール、補足メモ、URL妥当性・EC選択のバリデーション。
- **編集・削除が動作**（`WishlistList.tsx`）。
  編集は一覧内のインライン編集（`startEdit` / `saveEdit`、タイトル・希望価格・実質価格メモ）、
  削除は `remove` で localStorage 更新＋履歴（`deletedWish`）記録。
- **画像はプレースホルダーのみ・画像URL入力欄なし・外部画像取得なし**。
  `public/images/placeholders/*.svg` の自作SVGのみ。`WishlistForm.tsx:174` で
  「v1では外部サイトの商品画像を取得せず、画像URL入力欄も設けません。」と明記。
  `<img src="http...">` / `fetch` / `axios` / `cheerio` 等のスクレイピング処理は検出されず。
- **禁止表現なし**。`最安` / `最安保証` 等は不在。`公式サイトで確認`（SaleDetail）は EC 自身の公式サイト
  （`sourceUrl`）への導線であり、当サービスを公式と誤認させる表現ではない。
- **状態UIが共通化**。`src/components/ui/` の `Skeleton` / `EmptyState` / `ErrorState` /
  `RetryButton` / `Toast` を各画面で利用（loading→Skeleton、error→ErrorState、empty→EmptyState）。
- **Firebase未設定でも安全に動作**。`firebase/client.ts` の `isFirebaseConfigured`（全キー存在判定）→
  未設定なら `repositories/index.ts` が localStorage 実装へフォールバック。
  `local-storage.ts` は `typeof window === "undefined"` ガードあり（SSR安全）。
  匿名IDも Firebase なし時は `local-...` UUID を localStorage に発行（`firebase/auth.ts`）。
- **動的ルートのガードが適切**。`calendar/[merchantSlug]/page.tsx` は不正 slug で `notFound()`。
- **テストが整合**。`merchant` / `price` / `affiliate` / `date` / `calendar` / `history` の
  ユーティリティ単体テストが用意され、内容も実装と一致して全パス。

---

## 致命的な修正事項

なし（lint / test / build 成功、機能要件・規約順守を満たす）。

---

## 通常の修正事項

### N-1. スマホ下部ナビが未実装（UI要件との差分）

- 該当: `src/components/layout/SiteHeader.tsx`
- 現状は上部ヘッダー（`flex-wrap` のテキストナビ）のみで、参照画像が示す **スマホ下部固定ナビ
  （`md:hidden` + `fixed bottom-0`、ホーム／カレンダー／欲しいもの／履歴／記事のアイコン＋ラベル）が無い**。
- 影響: 画像レビュー観点「スマホ下部ナビが近いか」を満たさない。スマホでの回遊性が画像比で低い。
- 推奨: PC は現行ヘッダー、スマホは下部固定ナビを追加。`SaleCalendar` のボトムシートが
  `fixed bottom-0` のため、下部ナビと重ならないよう z-index/余白を調整する。

### N-2. 削除操作に確認ステップ・エラーハンドリングが無い

- 該当: `src/features/wishlist/WishlistList.tsx` の `remove`（74-90行）・`saveEdit`（62-72行）
- `try/catch` が無く、`wishlist.remove` / `wishlist.update` 失敗時に未処理例外になりうる。
  削除前の確認ダイアログも無く、誤タップで即削除される。
- 推奨: 削除前に簡易確認、`try/catch` で失敗時に `ErrorState`/`Toast` 表示。
  （CLAUDE.md の「破壊的操作は説明・確認」の趣旨にも沿う）

### N-3. バッジ色が colorToken ではなくハードコード

- 該当: `src/features/sales/SaleCalendar.tsx` の `merchantClass()`（19-21行）
- `merchantId === "rakuten" ? 楽天色 : Amazon色` の三項分岐で、**楽天以外はすべて Amazon 配色に
  フォールバック**する。`Merchant.colorToken`（"amazon"/"rakuten"）を使っておらず、
  3社目以降を追加しても色が反映されない（merchant マスタ管理の趣旨に反する）。
- 推奨: `colorToken` を CSS変数／Tailwind セーフリストにマッピングし、マスタ駆動で配色する。

### N-4. ルート名が仕様と不一致

- 仕様 `/sales/[saleEventId]` に対し実装は `/sales/[id]`（機能影響なし）。
- 推奨: docs を実装に合わせるか、命名を仕様に合わせて整合を取る。

### N-5. ドキュメントと実装の軽微な不一致（要件10）

- `docs/v1-mvp-task-breakdown.md:19` は「test:4 pass」と記載だが、実際は **9 tests / 6 files** 通過。
  ビルドも「11 routes」。数値を実態に更新する。
- ルート名（N-4）も docs と実装で表記統一する。

---

## v1.1 へ回してよい事項

- **複数日にまたがるセールの帯表示**。`buildCalendarDays`（`src/lib/utils/calendar.ts`）は
  `toDateKey(event.startAt) === dateKey` で **開始日のみ** にイベントを配置するため、期間中の各日には
  表示されない。v1は「予定メモ」なので許容範囲。期間バー表示は v1.1 で検討。
- **コンポーネントテストの追加**。現状は純ユーティリティの単体テストのみ。`@testing-library/react` は
  導入済みなので、フォーム送信・ボトムシート開閉（Escで閉じる等）の component test を v1.1 で。
- **ログイン同期 / データ移行（recovery）の実装**。現状 `/recovery` は説明のみの静的プレースホルダー
  （本人も v1.2 と記載）。
- **記事 / セール詳細の `generateStaticParams` による静的化**（現状は動的 `ƒ`）。
- **`colorToken` のデザインシステム統合**（N-3 を恒久解消する形で）。

---

## Codex へ渡す修正プロンプト

> 【前提】WSL2 Ubuntu-24.04、`~/dev/workspaces/personal/sale-calendar-navi` で作業。
> 着手時に `pwd` / `git status --short` / `git branch --show-current` / `node -v` / `npm -v` を確認。
> 破壊的操作・スクレイピング・外部画像取得・断定/公式誤認表現は禁止。日本語で報告。
> main を直接編集せず作業ブランチを切ること。各修正後に該当コマンドを実行し結果を報告。
>
> **1. スマホ下部ナビの追加（最優先 / UI要件）**
> - `src/components/layout/SiteHeader.tsx` に、スマホ用の下部固定ナビを追加する。
>   - PC（`md` 以上）は現行の上部ヘッダーを維持。スマホは `md:hidden` の `fixed inset-x-0 bottom-0`
>     ナビにし、ホーム(`/`)・カレンダー(`/calendar`)・欲しいもの(`/wishlist`)・履歴(`/history`)・
>     記事(`/articles`) をアイコン＋ラベルで横並び表示（`lucide-react` 使用、最小タップ44px目安）。
>   - 下部ナビ分の余白を `layout.tsx` の `main` に確保（`pb-20 md:pb-0` 等）。
>   - `SaleCalendar.tsx` のボトムシート（`fixed bottom-0`）と下部ナビが重ならないよう
>     z-index と下余白を調整する。
> - 参照画像（`docs/ui-reference/`）の情報順序・カード密度・余白・角丸・CTA色に寄せる。
>
> **2. 削除操作の堅牢化**
> - `src/features/wishlist/WishlistList.tsx` の `remove` と `saveEdit` を `try/catch` で囲み、
>   失敗時に `ErrorState` か `Toast` でユーザーに通知。削除前に簡易確認ステップを入れる。
>
> **3. バッジ色のマスタ駆動化**
> - `src/features/sales/SaleCalendar.tsx` の `merchantClass()` を、merchantId のハードコード分岐から
>   `Merchant.colorToken` 参照に変更。`colorToken`（"amazon"/"rakuten"…）を CSS変数または Tailwind の
>   セーフリスト経由で配色に対応づけ、EC追加時に色が自動反映されるようにする。
>   ホーム（`src/app/page.tsx`）等で色を直書きしている箇所があれば同様に統一する。
>
> **4. ドキュメント整合（実装変更ではなく追従）**
> - `docs/v1-mvp-task-breakdown.md` のテスト件数（「4 pass」→ 実際は 9 tests/6 files）と
>   ルート数表記を実態に更新。
> - ルート名 `/sales/[id]` と docs 表記（`[saleEventId]`）の不一致を、片方に統一して整合させる。
>
> 【完了条件】`npm run lint` / `npm run test` / `npm run build` がすべて成功（既存9テストが緑のまま）。
> 報告に「変更ファイル／実行コマンド／確認結果／未対応・次にやること」を含めること。

---

## レビュー実施メモ（変更ファイル / 実行コマンド / 確認結果 / 未対応）

- **変更ファイル**: `docs/reviews/v1-review.md`（本ファイル）のみ。実装には未介入。
- **実行コマンド**: `npm run lint`（成功） / `npm run test`（9テスト全パス） / `npm run build`（成功）、
  および確認用に `npx vitest run` と依存バージョン確認（vitest 2.1.9 / vite 5.4.21）。
- **確認結果**: lint・test・build いずれも成功。機能要件・規約順守を満たす。致命的欠陥なし。
  通常修正5件（最優先=スマホ下部ナビ）、v1.1送り5件を抽出。
- **未対応・次にやること**: 上記「Codex へ渡す修正プロンプト」を Codex に実装依頼 →
  実装後に Claude で再レビュー（特にスマホ下部ナビのUI整合、削除の確認/エラー処理、色のマスタ駆動を確認）。
