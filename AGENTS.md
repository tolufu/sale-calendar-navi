# AGENTS.md — セールカレンダー比較ナビ

実装エージェント（Codex 等）向けの作業ルール。設計・要件は `docs/` を参照する。

## 必須ルール

- **日本語で回答・報告する。**
- **破壊的操作の前に必ず説明し、承認を得る。** `rm -rf` / `git reset --hard` /
  既存ファイルの無断全面上書き / 強制pushは行わない。
- **機密情報をコミットしない。** Firebaseキー等は `.env.local` に置く（リポジトリに含めない）。
- **スクレイピング禁止。** 外部ECの価格・在庫・画像・レビューをスクレイピングで取得しない。価格は手入力のみ。
- **商品画像ポリシー:** v1〜v1.2 は `public/images/placeholders/` の自作プレースホルダーのみ。
  v2以降は楽天公式APIが返した画像URLに限り、出典を明記して表示できる。ユーザー任意の
  画像URL入力や、スクレイピングによる画像取得・表示は行わない。
- 「最安値」「最安保証」等の**断定・保証表現を使わない**。
- Amazon/楽天などの**公式サービスと誤認されるロゴ・表現を使わない**。
- ECは enum固定ではなく **merchantId / merchants マスタ** で管理する。

## 作業環境

- WSL2 Ubuntu-24.04。Linux側の `~/dev/workspaces/personal/sale-calendar-navi` で作業する
  （`/mnt/c/...` `/mnt/d/...` では作業しない）。
- 着手時に `pwd` / `git status --short` / `git branch --show-current` / `node -v` / `npm -v` を確認する。

## 進め方

- 原則「Claudeで設計/レビュー → Codexで実装/修正 → Claudeで確認」の順。
- Codex と Claude を同時に同じブランチ・同じファイルへ編集させない。
- 変更後は可能な限り `npm run lint` / `npm run test` / `npm run build` を実行。失敗時は原因と対処を記録。

## 報告フォーマット

報告の最後に次を簡潔にまとめる: **変更ファイル / 実行コマンド / 確認結果 / 未対応・次にやること**。

## 参照ドキュメント

- 要件: `docs/requirements-summary.md`
- 実装計画: `docs/implementation-plan.md`
- アーキテクチャ: `docs/architecture.md`
- 受け入れ基準: `docs/acceptance-checklist.md`
- 次の指示メモ: `docs/next-codex-instructions.md`
- UI参照画像（レビュー専用・非公開アセット）: `docs/ui-reference/README.md`
