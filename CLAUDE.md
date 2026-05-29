# CLAUDE.md — セールカレンダー比較ナビ

Claude（設計・レビュー担当）向けの作業ルール。実装ルールは `AGENTS.md` と整合させる。

## 必須ルール

- **日本語で回答・報告する。**
- **破壊的操作の前に必ず説明し、承認を得る。** `rm -rf` / `git reset --hard` /
  既存ファイルの無断全面上書き / 強制pushは行わない。
- **機密情報をコミットしない。** Firebaseキー等は `.env.local` に置く（リポジトリに含めない）。
- **スクレイピング禁止。** 外部ECの価格・在庫・画像・レビューを自動取得しない。価格は手入力のみ。
- **v1〜v1.2 の商品画像はプレースホルダーのみ**（`public/images/placeholders/` の自作画像）。
  外部の商品画像を取得・表示しない。
- 「最安値」「最安保証」等の**断定・保証表現を使わない**。
- Amazon/楽天などの**公式サービスと誤認されるロゴ・表現を使わない**。
- ECは enum固定ではなく **merchantId / merchants マスタ** で管理する。

## このリポジトリでのClaudeの役割

- 要件整理・設計・レビューが主担当。実装は原則 Codex が行う。
- 「Claudeで設計/レビュー → Codexで実装 → Claudeで確認」の流れを守る。
- Codex と同時に同じブランチ・同じファイルを編集しない。

## 作業環境

- WSL2 Ubuntu-24.04。Linux側の `~/dev/workspaces/personal/sale-calendar-navi` で作業する
  （`/mnt/c/...` `/mnt/d/...` では作業しない）。
- 着手時に `pwd` / `git status --short` / `git branch --show-current` / `node -v` / `npm -v` を確認する。

## 報告フォーマット

報告の最後に: **変更ファイル / 実行コマンド / 確認結果 / 未対応・次にやること** をまとめる。

## 参照ドキュメント

- `docs/requirements-summary.md` / `docs/implementation-plan.md` /
  `docs/architecture.md` / `docs/acceptance-checklist.md` /
  `docs/next-codex-instructions.md` / `docs/ui-reference/README.md`
