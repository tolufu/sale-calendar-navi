# 次の実装プロンプトでCodexに注意してほしいこと

最終更新: 2026-05-29

次に Codex へ「v1 MVP の実装」を依頼する際、特に以下を明示・厳守させる。
全体像は [implementation-plan.md](./implementation-plan.md)、構成は [architecture.md](./architecture.md)。

## 守らせる前提（毎回）

- 作業は WSL2 Linux側 `~/dev/workspaces/personal/sale-calendar-navi`（`/mnt/c` `/mnt/d` では作業しない）。
- 着手時に `pwd` / `git status --short` / `git branch --show-current` / `node -v` / `npm -v` を確認させる。
- 破壊的操作禁止（`rm -rf` / `git reset --hard` / 無断全面上書き / 強制push）。
- 日本語で報告し、最後に「変更ファイル / 実行コマンド / 確認結果 / 未対応・次にやること」をまとめさせる。

## 技術・設計で外さないこと

- **Next.js App Router + TypeScript + Tailwind**。RSC優先、必要箇所のみClient Component。
- **リポジトリ抽象を先に作る**: `interface` → `Firestore実装` / `localStorage実装` →
  環境変数有無で切り替えるファクトリ。UIは実装を意識しない。
- **Firebase未設定でも動く**こと（localStorageフォールバック）を最優先で担保する（AC-015）。
  `.env.local.example` を用意し、実キーはコミットさせない。
- **ECは enum禁止**。`merchantId: string` + `merchants` マスタ（シードに amazon / rakuten）。
  EC追加がマスタ追加だけで済む構造にする。
- **状態UIをv1の最初に共通化**: `Skeleton` / `EmptyState` / `ErrorState` / `RetryButton` / `Toast`。
  取得系は loading/empty/error/success の4状態を必ず持たせる（AC-016〜AC-019）。

## UI・スマホで間違えやすい点

- **スマホの同日複数セール表示ルールを厳密に**（AC-021）:
  2件まで=縦スタック / 3件以上=上位2件 + 「+n」バッジ / 日付タップで当日一覧ボトムシート。
  「上位」の決定基準（startAt昇順→merchant sortOrder 等）を定数化し、単体テストを書かせる。
- **PC/スマホ両対応**（AC-020）。主要画面が両幅で崩れないこと。
- **登録フォームの詳細入力折りたたみは v1.1**。v1では基本項目（URL/希望価格/タイトル/merchant）優先。

## 禁止事項（必ず釘を刺す）

- **スクレイピング・外部価格自動取得・外部商品画像取得は禁止**。価格は手入力のみ。
- **商品画像は v1〜v1.2 はプレースホルダーのみ**（`public/images/placeholders/` の自作画像）。
- **「最安値」「最安保証」等の断定/保証表現を使わない**。
- **公式サービスと誤認されるロゴ・表現を使わない**。
- **秘密情報をコミットしない**。
- `docs/ui-reference/` の画像は**レビュー参照専用**で、アプリから配信しない。

## 完了確認

- 対象AC（v1は AC-001〜006, 014〜021）を満たしているか自己チェックさせる。
- `npm run lint` / `npm run test` / `npm run build` を実行させ、失敗は原因と対処を記録させる。
- v1の範囲を超えた実装（実質価格メモ/AF変換/通知/履歴/広告/OGP）は**v1では入れない**。

## 推奨する依頼の分割

1. 雛形 + リポジトリ抽象 + 状態UI共通化（P-01〜P-06, V1-01〜V1-03, V1-10, V1-11）。
2. カレンダー + ECフィルター + スマホ複数セール（V1-04〜V1-07）。
3. 欲しいもの登録 + 一覧 + トップ + テスト（V1-08, V1-09, V1-12, V1-13）。

> 1依頼で全部やらせず、上記の単位で「実装→Claudeでレビュー→次へ」を回す。
