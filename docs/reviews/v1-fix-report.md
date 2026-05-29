# v1レビュー指摘 修正レポート

- 対象レビュー: `docs/reviews/v1-review.md`
- 修正日: 2026-05-29
- 作業ブランチ: `fix/v1-review`

## 修正方針

### 今すぐ修正

- N-1: スマホ下部ナビが未実装
- N-2: 削除操作に確認ステップ・エラーハンドリングが無い
- N-3: バッジ色が `Merchant.colorToken` ではなくハードコード
- N-4/N-5: ルート名・テスト件数・ルート数のドキュメント整合

### v1.1以降へ回す

- 複数日にまたがるセールの帯表示
- コンポーネントテストの追加
- ログイン同期 / データ移行（recovery）の本実装
- 記事 / セール詳細の `generateStaticParams` による静的化
- `colorToken` のデザインシステム全体への恒久統合

## 修正内容

- `SiteHeader` にスマホ用の下部固定ナビを追加し、ホーム / カレンダー / 欲しいもの / 履歴 / 記事をアイコン付きで表示。
- `layout.tsx` の `main` にスマホ下部ナビ分の余白を追加。
- カレンダーのボトムシートを下部ナビより前面に出る `z-50` に変更。
- `WishlistList` の更新・削除を `try/catch` 化し、失敗時はエラーToastを表示。
- 削除前に `window.confirm` による確認ステップを追加。
- `Toast` に `success` / `error` variant を追加し、スマホ下部ナビと重ならない位置に調整。
- `getMerchantToneClass()` を追加し、セール種別バッジを `Merchant.colorToken` ベースの配色に変更。
- トップページの直近セールバッジも同じ配色ヘルパーに統一。
- `docs/v1-mvp-task-breakdown.md` のテスト件数とルート数表記を実態に更新。

## 確認結果

| コマンド | 結果 |
| --- | --- |
| `npm run lint` | 成功（No ESLint warnings or errors） |
| `npm run test` | 成功（6 files / 9 tests passed） |
| `npm run build` | 成功（11 routes generated） |

## 未対応・次にやること

- v1.1送りの項目は今回実装していない。
- スマホ下部ナビの見た目はコード上で反映済み。必要に応じて Claude レビュー時に実機幅のスクリーンショットで確認する。
