# v2 実装プロンプト注意点（Codex向け）

最終更新: 2026-05-30
担当: Claude（設計・レビュー）

設計の本体は [v2-delta-design.md](./v2-delta-design.md)。本書はそれを Codex に渡すときの
**依頼の仕方・落とし穴・分割案**をまとめる。前提ルールは [next-codex-instructions.md](./next-codex-instructions.md) /
[v1.2-codex-prompt-notes.md](./v1.2-codex-prompt-notes.md) と同じ。

> 大前提: 欲しいもの保存 / 候補配列(`candidates`) / 実質価格計算 / アフィリエイト変換は**既に存在**する。
> v2 は「ゼロから作る」ではなく「既存を壊さず、楽天API補完・画像表示・買い時スコアを差分で足す」。1依頼=1テーマ。

---

## 1. 毎回入れる共通ヘッダ（コピペ用）

```
【共通前提】
- 作業は WSL2 Linux側 ~/dev/workspaces/personal/sale-calendar-navi（/mnt/c, /mnt/d では作業しない）。
- 着手時に pwd / git status --short / git branch --show-current / node -v / npm -v を確認。
- 破壊的操作禁止（rm -rf / git reset --hard / 無断全面上書き / 強制push）。
- 既存実装を壊さない。1依頼=1テーマ。Claudeと同じファイルを同時編集しない。
- スクレイピング禁止。楽天は公式API経由のみ。Amazon/価格.comの自動取得はしない。
- 許可されていない画像を表示・保存しない（許可ホストのホワイトリストのみ）。imageSource を必ず保存。
- 「最安」「最安保証」等の断定・保証表現、公式サービス誤認表現は禁止。買い時スコアも「目安」止まり。
- APIキーを直書き・コミットしない。RAKUTEN_* は NEXT_PUBLIC を付けずサーバ専用 env に置く。
- 設計は docs/v2-delta-design.md に従う。型・正規化・スコア式・フォールバックはそこの定義どおり。
- 変更後に npm run lint / npm run test / npm run build を実行し、失敗は原因と対処を記録。
- 日本語で報告。最後に「変更ファイル / 実行コマンド / 確認結果 / 未対応・次にやること」をまとめる。
```

---

## 2. v2 特有の落とし穴（必ず伝える）

1. **APIキーをクライアントに露出させない**
   `RAKUTEN_APPLICATION_ID` / `RAKUTEN_AFFILIATE_ID` に **`NEXT_PUBLIC_` を付けない**。
   楽天APIは必ず Route Handler（`app/api/rakuten/search`）経由で叩き、`applicationId` をレスポンスに含めない。
   クライアントから楽天APIへ直接 fetch しない。キーを直書き・コミット・ログ出力しない。

2. **APIキー未設定でも壊れない（フォールバック必須）**
   フラグ off / 未設定 → 「楽天で候補を検索」ボタンを出さず、v1.2 までの手入力フローがそのまま動く。
   設定済みでも上流失敗・レート超過時は ErrorState/Toast で「手入力で続けられます」。
   保存・実質価格・買い時スコアは**手入力だけで成立**すること。Firebase未設定でも開発可能（v1方針維持）。

3. **スクレイピング禁止・公式APIのみ**
   楽天は公式ウェブサービスAPIのみ。HTMLパース・画像直リンク収集はしない。
   Amazon は PA-API を**無理に実装しない**（条件確認が取れるまで手入力のまま）。価格.comも自動取得しない。

4. **許可された画像URLのみ・imageSource を必ず保存**
   表示・保存してよいのは許可ホスト（楽天画像CDN）のホワイトリストに合致する https URL のみ。
   許可外は `imageUrl:null` に落とし、保存もしない。`imageSource`（"rakuten"/"placeholder"）と `fetchedAt` を必ず保存。
   `next/image` 採用時は `next.config.ts` の `remotePatterns` を許可ホストだけに限定（ワイルドカード全許可禁止）。
   **許可ホスト名・利用条件・アフィリ表記義務は実装前に楽天ウェブサービス規約で必ず確認**する。

5. **API値で手入力を勝手に上書きしない**
   楽天APIの価格は `apiSuggestion`（参考値）として別枠で保持。実質価格の根拠 `breakdown`（手入力）は
   ユーザー操作（「参考値を反映」）でのみ転記する。`calculateEffectivePrice` のロジックは変更しない。

6. **後方互換（スキーマ version 3）**
   `WISH_ITEM_SCHEMA_VERSION` を 3 に上げ、`migrateWishItem` で旧データ（`image`/`apiSuggestion`/`imageSource`
   無し）を例外なく読めること。`normalizeCandidate` は冪等。`imageSource` 既定は `"placeholder"`。
   `imageSource` を文字列 `"placeholder"` 固定で参照している箇所は実装前に grep で洗い、`ImageSource` 型へ置換。

7. **買い時スコアはデータ不足時に出しすぎない**
   `calculateBuyTiming({now, item, candidates, upcomingSales})` は `now` を引数で受ける純粋関数
   （内部で `Date.now()` を呼ばない）。必要データが欠ける要素は `available:false` で計算から除外。
   信頼度 `none/low`（available 0〜1個）では**スコア数値を出さず**「判定材料が不足」を表示。
   `medium/high`（2〜3個）でのみ数値表示。重みは available 要素だけで再正規化。

8. **断定・保証・煽り表現の禁止（スコアでも）**
   「最安」「今が買い」「最安保証」は使わない。スコア表示には必ず
   「手入力値に基づく中立的な目安です。最安・購入可否を保証しません。最新は各サイトで確認してください。」を併記。
   強い赤緑で煽らず中立配色。レビュー本文・点数の強調はしない。

9. **シェアに機密・画像URL・ID を入れない**
   v1.2 の `share.ts` 方針を維持。共有文面・URLに 保存URL/itemUrl/affiliateUrl/userId/メモ/画像URL を入れない。
   既存の混入防止回帰テストを壊さない（必要なら画像URLぶんを追加）。

10. **ロジックはユーティリティに切り出してテスト**
    API正規化(`mapRakutenItem`)・画像ホスト検証(`isAllowedImageUrl`)・候補正規化・買い時スコアを UI に
    ベタ書きしない。純粋関数化して単体テスト必須（設計 §7）。Route Handler のテストは fetch をモックし、
    CIで楽天本番を叩かない。

---

## 3. 推奨する依頼の分割（1依頼=1テーマ）

| 回 | テーマ | 主な対象 | 完了条件 |
| --- | --- | --- | --- |
| 1 | スキーマ拡張＋移行 | `types.ts`(ImageSource/PriceCandidate拡張/version3) / `wish-item.ts`(normalize/migrate) | 旧データ後方互換・冪等・画像ホスト検証で許可外null・既存テスト緑・build緑 |
| 2 | 楽天API連携レイヤ（純粋関数＋設定） | `integrations/rakuten/{types,config,mapper}.ts`(新) | `mapRakutenItem`/`isAllowedImageUrl`/`isRakutenApiConfigured` 実装・許可外画像null の回帰テスト |
| 3 | 楽天API中継 Route Handler | `integrations/rakuten/client.ts`(新) / `app/api/rakuten/search/route.ts`(新) / `.env.example`/`README` | 未設定で not-configured・入力検証・キー秘匿・レート/キャッシュ/タイムアウト・fetchモックテスト |
| 4 | 候補検索UI＋画像表示 | `WishlistForm.tsx` / `WishlistList.tsx` / `next.config.ts` | フラグ出し分け・候補選択で候補反映(breakdown非上書き)・許可ホストのみ画像・imageSource保存・注記 |
| 5 | 買い時スコア | `utils/buy-timing.ts`(新) ＋ 一覧/詳細表示 | 3要素のavailable判定・信頼度でnone/lowは非表示・重み再正規化・純粋関数・テスト緑・中立注記 |
| 6 | （条件確認後・任意）Amazonリンク方針 | docs / 必要なら affiliate 周辺 | PA-API 提携条件の可否確認結果を記録。無理に実装しない |

> 各回の終わりに **Claudeレビュー**を挟む。次回はレビュー指摘の反映から始める。
> 回1（スキーマ）→回2（純粋関数）→回3（Route）→回4（UI）→回5（スコア）の順が前提依存的に安全。

---

## 4. 依頼テンプレ（例：回3 楽天API中継 Route Handler）

```
あなたは実装担当（Codex）です。docs/v2-delta-design.md の §3.4 / §4 に従い
「楽天API中継 Route Handler とサーバ設定」だけを実装してください。
- src/lib/integrations/rakuten/client.ts（サーバ専用 fetch・タイムアウト約5s・エラー正規化）と
  src/app/api/rakuten/search/route.ts（GET, runtime=nodejs）を新設。
  - isRakutenApiConfigured() が false → { ok:false, reason:"not-configured" } を 200 で返す。
  - keyword 必須・長さ上限・hits 範囲を検証。NG → invalid-input。
  - サーバ env の RAKUTEN_APPLICATION_ID / RAKUTEN_AFFILIATE_ID で楽天APIへ fetch（NEXT_PUBLIC 禁止）。
  - 返却は mapRakutenItem（回2）で正規化した RakutenItem のみ。applicationId をレスポンスに含めない。
  - 検索キーワード以外（userId・メモ等）を上流へ送らない。簡易レート制限と短時間キャッシュを入れる。
  - 上流失敗は upstream-error。例外を投げっぱなしにしない。
- .env.example に RAKUTEN_APPLICATION_ID / RAKUTEN_AFFILIATE_ID / NEXT_PUBLIC_ENABLE_RAKUTEN_API /
  NEXT_PUBLIC_SITE_URL を追記（値は空、役割差をコメント）。README の環境変数節も更新。
- テストは fetch をモックし、not-configured / invalid-input / 正常 / applicationId非露出 を検証（楽天本番を叩かない）。
- 許可ホストのホワイトリスト・楽天の利用条件は実装前に楽天ウェブサービス規約で確認した旨を報告に記す。
- スクレイピング・断定表現・公式誤認表現・キー直書きを入れない。
- 完了後 npm run lint / test / build を実行し結果を報告。最後に4項目（変更/コマンド/確認/次）をまとめる。
他の回（スキーマ・純粋関数mapper・UI・スコア）には踏み込まないこと。
```

---

## 5. 受け入れ・完了確認（Codexに自己チェックさせる）

- 今回の回で動いた範囲（スキーマ / 連携純粋関数 / Route / UI / スコア）を列挙させる。
- `npm run lint` / `npm run test` / `npm run build` の結果（緑/赤）を貼らせる。失敗時は原因と対処。
- 禁止事項チェックを自己申告させる:
  - 楽天APIはサーバ Route Handler 経由のみ。`RAKUTEN_*` に `NEXT_PUBLIC_` を付けていない。キーを露出/コミットしていない。
  - スクレイピング・HTMLパース・画像直リンク収集をしていない。Amazon PA-API を無理に実装していない。
  - 表示/保存した画像は許可ホストのホワイトリストのみ。`imageSource` と `fetchedAt` を保存している。
  - API値で手入力 `breakdown` を自動上書きしていない（参考値は `apiSuggestion` 別枠）。
  - 買い時スコアは `none/low` で数値非表示。中立注記を併記。「最安・今が買い・保証」表現を使っていない。
  - 共有文面・URLに 保存URL/itemUrl/affiliateUrl/userId/メモ/画像URL を含めていない。
  - merchantId は enum 固定でなくマスタ参照のまま。
- 後方互換: 旧 `WishItem`/`candidates`（image/apiSuggestion/imageSource なし）を読んでも例外なく描画・移行（version 3・冪等）。
- フォールバック: フラグ off / API未設定 / 上流失敗 のいずれでも、手入力での保存・実質価格・スコアが成立する。
- 楽天規約確認: 採用エンドポイント・必須パラメータ・画像許可ホスト・アフィリ表記義務を実装前に確認した旨を記す。
