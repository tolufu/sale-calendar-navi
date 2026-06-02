# Codex 実装プロンプト — v3 管理者コンソール

このファイルはCodexにそのまま貼り付ける指示書です。設計の根拠は
`docs/v3-admin-console-design.md` を参照（矛盾があれば作業を止めて報告）。

---

あなたはこのリポジトリの実装担当（Codex）です。`AGENTS.md` と `CLAUDE.md` を厳守し、
**管理者コンソール `/admin`** を段階実装します。設計書は `docs/v3-admin-console-design.md`。

## 着手時に必ず実行・確認
- `pwd` / `git status --short` / `git branch --show-current` / `node -v` / `npm -v` を出力。
- 作業ブランチは新規に切る（例 `feat/v3-admin-console`）。`main` 直接編集は禁止。
- 破壊的操作（`rm -rf` / `git reset --hard` / 無断全面上書き / 強制push）は禁止。

## 絶対に外さない前提
- Next.js App Router + TypeScript + Tailwind。RSC優先、必要箇所のみClient Component。
- **Firebase未設定でもアプリが起動する**こと（localStorage/静的シードのフォールバック維持・AC-015）。
- ECは enum禁止。`merchantId: string` + `merchants` マスタ。
- スクレイピング/外部価格自動取得/外部商品画像取得は禁止。価格・日程は手入力/手動CSVのみ。
- 記事OG画像は `public/images/placeholders/` 配下のみ。任意画像URLは不可。
- 「最安値」「最安保証」等の断定/保証表現、公式サービスと誤認される表現を使わない。
- Firebase実キーをコミットしない（`.env.local` のみ）。
- 既存の公開UI（カレンダー/記事/欲しいもの等）の挙動を壊さない。

## スコープ（フェーズ順に実装。1フェーズ＝1PR目安、各フェーズ後にClaudeレビュー）

### フェーズ1: 土台（認証・ルール・Firestore本接続・ガード）
1. 管理者サインイン `/admin/sign-in`：Firebase Auth メール/パスワード（`signInWithEmailAndPassword`）。
   一般利用者の匿名認証は従来どおり併存させる。
2. 管理者判定：Firestore `admins/{uid}` の存在チェック（allowlist）。allowlist自体はコンソール手動管理（クライアント書込不可）。
3. `firestore.rules` を `docs/v3-admin-console-design.md` 第2章の内容へ全面更新
   （`isAdmin()`、articles/sales/merchants/admins/users のルール）。`firebase.json` 経由でデプロイ手順を報告に記載。
4. `/admin` 配下に共通ガード：未認証→sign-in、認証済み非管理者→「権限がありません」表示。
5. `src/lib/repositories/firestore.ts` の `createFirestoreRepositories()` を本実装
   （sales/merchants/articles の読み取り。Firestoreが空なら `src/data/*.ts` の静的シードを返すフォールバック）。
6. `/admin` ダッシュボード雛形：各管理画面への導線と「静的データをFirestoreへシード投入」アクション（初回投入用、冪等に）。

### フェーズ2: 記事管理
1. `src/lib/repositories/types.ts` の `Article` に `status?: "draft" | "published"` と `updatedAt?: string` を追加（後方互換：省略時 published 扱い）。
2. `AdminArticleRepository`（listAll/get/upsert/remove）と `getAdminRepositories()` ファクトリを追加（Firebase未設定時はlocalStorage実装で開発可能に）。
3. `/admin/articles`（下書き含む一覧）、`/admin/articles/new`、`/admin/articles/[slug]/edit`。
   フォーム項目：slug（英数ハイフン・一意）/title/description/body（`\n\n`区切りプレーンテキスト）/
   ogImage（プレースホルダーから選択）/tags（カンマ区切り）/publishedAt/relatedSlugs/status。保存時 `updatedAt` 自動付与。
4. 公開側（`features/articles/ArticleList`・`articles/[slug]`・`sitemap`）は `status === "draft"` を除外。

### フェーズ3: セール日程 ＋ CSVインポート
1. `AdminSaleRepository`（listAll/upsert/bulkUpsert/remove）を追加。
2. `/admin/sales`（一覧・編集・削除）、`/admin/sales/new`（フォーム）。
   項目：merchantId（マスタ選択）/title/saleType/startAt/endAt/confidence/sourceUrl/description/strategyMemo/confidenceNote。`startAt ≤ endAt` 検証。
3. セールCSVバリデータを新規作成：`src/lib/import/csv/sale-schedule-schema.ts` /
   `sale-schedule-validate.ts` /`sale-schedule-validate.test.ts`。
   - 列：`merchantId,title,saleType,startAt,endAt,confidence,sourceUrl,note`（`docs/sale-schedule-input.csv` 準拠）。
   - `#` 始まり・空行スキップ、先頭BOM除去、各セルは既存 `sanitizeCsvCell` を流用。
   - 検証：merchantId存在＆isActive／title・saleType必須／startAt・endAtは JST `YYYY-MM-DD HH:mm`（`24:00`超表記は翌日繰上げ後ISO化）・`startAt ≤ endAt`／confidenceは confirmed|estimated（空欄=confirmed）／sourceUrlは空可・あればhttps（`parseHttpsUrl`流用）。
   - 安定id生成（例 `${merchantId}-${saleType}-${YYYYMMDD(startAt)}`）。既存idは更新、無ければ新規。
4. `/admin/sales/import`：CSVアップロード/貼り付け → **ドライランのプレビュー**（行ごとOK/エラー理由・件数サマリ）→「確定」で `bulkUpsert`。失敗行はスキップし、created/updated/skipped を表示。

### フェーズ4（任意・後続）
- 既存 `src/lib/import/csv/`（商品フィード）UI配線。`ENABLE_CSV_IMPORT` フラグでガード。
- ECマスタ編集 `/admin/merchants`。

## UI/実装の注意
- 既存 `src/components/ui`（Button/Card/PageHeader 等）と配色トークンを流用し、公開画面と一貫させる。
- 公開ヘッダー/フッターに管理導線を出さない（直URL運用）。
- 取得系UIは loading/empty/error/success の4状態を持たせる（既存方針）。

## 完了確認（各フェーズ末）
- 受け入れ基準（`docs/v3-admin-console-design.md` 第8章）を自己チェック。
- `npm run lint` / `npm run test` / `npm run build` を実行し、失敗は原因と対処を記録。
- Firebase未設定で `npm run dev` が起動し公開画面が静的シードで成立することを確認。
- 報告の最後に「変更ファイル / 実行コマンド / 確認結果 / 未対応・次にやること」をまとめる。

## やらないこと
- 復旧コード機能の実装（別スコープ。`docs/v3-admin-console-design.md` 第10章参照）。
- Admin SDK / サーバ専用鍵の導入（クライアントSDK＋ルールで完結させる）。
- スクレイピングや外部価格・画像の自動取得。
