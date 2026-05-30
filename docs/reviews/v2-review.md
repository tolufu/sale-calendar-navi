# v2 コードレビュー — 楽天API土台と買い時スコア

- 対象コミット: `0498427 feat: v2 楽天API土台と買い時スコアを追加`
- ブランチ: `fix/v1-review`
- レビュー日: 2026-05-30
- レビュー担当: Claude（設計・レビュー）

## 対象ファイル

追加（A）:
- `src/lib/product-search/rakuten.ts` / `types.ts` / `amazon.ts` / `rakuten.test.ts`
- `src/app/api/products/rakuten/search/route.ts`
- `src/lib/utils/buy-timing-score.ts` / `buy-timing-score.test.ts`
- `docs/todo/amazon-product-provider.md` / `docs/v2-implementation-report.md`

変更（M）:
- `src/features/wishlist/WishlistForm.tsx` / `WishlistList.tsx`
- `src/lib/repositories/types.ts`
- `src/lib/utils/wish-item.ts` / `wish-item.test.ts`
- `.env.example` / `README.md`

## 検証（本セッションで実行）

| コマンド | 結果 |
|---|---|
| `npx vitest run`（rakuten / buy-timing-score / wish-item） | **10 passed / 3 files** ✓ |
| `npx eslint`（v2 追加・変更ファイル） | **エラー・警告なし（exit 0）** ✓ |
| `npm run build`（`next build`） | **成功（型チェック含む・18ページ生成）** ✓。`ƒ /api/products/rakuten/search` がサーバルートとして出力。 |

---

## 総合判定: **PASS**

重点観点 1〜8 をすべて満たす。セキュリティ・規約上のブロッカー（必須修正）は無し。
以下は本番のAPI接続・運用を見据えた**推奨修正**と v2.5 課題。

---

## 重点観点ごとの結果

| # | 観点 | 結果 | 根拠 |
|---|------|------|------|
| 1 | APIキーがブラウザ/リポジトリに漏れない | ✅ | `rakuten.ts:110-111` で `process.env.RAKUTEN_APPLICATION_ID` / `RAKUTEN_AFFILIATE_ID` を**サーバ専用 env**（`NEXT_PUBLIC_` なし）から読む。`.env.example` でも両キーは非 `NEXT_PUBLIC_`。呼び出しは Route Handler `route.ts`（サーバ）経由のみで、クライアント `WishlistForm` は `/api/products/rakuten/search` を叩くだけ（キーに触れない）。`git grep` 上の `NEXT_PUBLIC.*RAKUTEN` 一致は v1.1 の `NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID`（URL変換用・意図的にクライアント可）のみ。`build` 出力にもキーは含まれない。 |
| 2 | キー未設定でもアプリが壊れない | ✅（推奨①） | `rakuten.ts:116-118` キー未設定は `mockSearch()` を返し **throw しない**。`143-149` `!response.ok` も握りつぶしメッセージ返却。`WishlistForm.tsx:194-209` は `!ok`/例外を try/catch 表示（クラッシュなし）。**ただし** `fetch`(138) と `response.json()`(151) がネットワーク/パース例外を捕捉しておらず `route.ts` も try/catch 無し → 異常時 500（クライアントは表示処理するので落ちはしない）。観点完全達成のため捕捉を推奨。 |
| 3 | 楽天API由来の画像のみ表示し imageSource を保存 | ✅ | 多層で担保されている。①取得: `rakuten.ts:30-42` `firstImageUrl` が `http/https` を検証、`58` 画像ありのみ `imageSource:"rakuten_api"`。②保存(新規): `WishlistForm.tsx:270` `imageUrl: primaryImageSource==="rakuten_api" ? primaryImageUrl : null`。③正規化: `wish-item.ts:34,44` `candidate.imageSource==="rakuten_api" && candidate.imageUrl` のときだけ `rakuten_api`＋`imageUrl` を保持し、それ以外は強制 `placeholder`＋`imageUrl:null`（**永続データが汚れても防御**）。④表示: `WishlistList.tsx:349-357` `primaryCandidate?.imageSource==="rakuten_api" && primaryCandidate.imageUrl` のときだけ `<img>`、他は自作プレースホルダー。`WishlistForm.tsx:364-366` / `WishlistList.tsx:353` で「画像出典」をユーザーに明示。型 `repositories/types.ts:69-70,82-83` も `imageSource:"placeholder"|"rakuten_api"` / `imageUrl?` に拡張済み。 |
| 4 | スクレイピングの混入なし | ✅ | 公式 `IchibaItem/Search` API のみ（`rakuten.ts:8`）。`cheerio/puppeteer/jsdom/scrape` は本体に無し（`jsdom`=vitest 環境、`playwright`=e2e のみ）。手入力・参考リンクも「価格や画像は取得しません」と明記。 |
| 5 | 買い時スコアがデータ不足時に断定しない | ✅ | `buy-timing-score.ts:53-67` 希望価格/実質価格欠落で `status:"insufficient_data"` `label:"データ不足"` `score:null`。スコア時ラベルは `119` の「買い時かも」(≥70)/「条件確認」のみ。`reasons[]` で根拠提示。UI(`WishlistList.tsx:435-442`)も insufficient 時はラベルのみ表示。 |
| 6 | 「最安」「保証」等の危険表現なし | ✅ | 本体・テスト・UI に「最安」「保証」なし。文言は非断定。 |
| 7 | テストが API未設定/モック/スコア/画像出典をカバー | ✅（推奨③） | `rakuten.test.ts`: キー未設定→モック＋手入力継続 / API成功→許可画像・affiliateUrl・`rakuten_api` 変換。`buy-timing-score.test.ts`: データ不足 / 買い時かも(≥70) / 条件確認(<70)。`wish-item.test.ts`: v1→v2移行・冪等・不正リンク破棄・**楽天画像URLとimageSource保存(126-147)**。10件すべてグリーン。不足: `!response.ok`・`fetch` reject の経路、スコア境界(=70)。 |
| 8 | v1.2 の SEO・通知・シェア・履歴が壊れていない | ✅ | `build` 成功で全18ルート維持。`WishlistList` は編集・削除・**Xシェア(280-286)**・参考リンク・**履歴記録(remove時 history.create 262-269)** を保持しつつ買い時スコア/画像出典を追加。SEO/通知関連ファイルは本コミット対象外＝影響なし。`WishItemInput` 拡張も後方互換（`imageUrl?` は optional、`wish-item.ts` で既存データを安全に正規化）。 |

---

## 必須修正
なし。

## 推奨修正（本番API接続前に対応推奨）

1. **`rakuten.ts` の `fetch`/`json` 例外を捕捉 + タイムアウト。**
   `try/catch` で `await fetch` と `await response.json()` を包み、ネットワーク断・パース失敗時も
   `{ configured: true, candidates: [], message: "楽天APIの検索に失敗しました。…手入力で続けてください。" }`
   を返す。`AbortController`（例: 8000ms）も付与。

2. **画像ホストの許可リスト検証（ハードニング）。**
   `firstImageUrl` は現状 `http/https` 判定のみ。楽天画像ドメイン（例 `image.rakuten.co.jp`）に
   一致しないURLは `placeholder` 扱いにすると、API応答異常時の出典担保が強くなる。
   表示側で `next/image` を使う場合は `next.config` の `images.remotePatterns` 設定も必要
   （現状 `WishlistList.tsx:352` は `<img>`＋eslint-disable で回避しており、最適化の観点では将来 `next/image` 化が望ましい）。

3. **テスト追加**: `rakuten.test.ts` に「`!response.ok`→空＋メッセージ」「`fetch` reject→空＋メッセージ」、
   非 http(s) 画像URL→`placeholder`。`buy-timing-score.test.ts` に `score=70` 境界・
   `previousEffectivePrice` 上昇/下降・`checkedAt` 古い時のペナルティ。

4. **買い時スコアの `previousEffectivePrice` の与え方（要検討）。**
   `WishlistList.tsx:343` は `previousEffectivePrice` に **2番目の比較候補（別ECの現在価格）** を渡している。
   スコア側は「前回確認価格」を想定（`buy-timing-score.ts:90-101` で「前回確認価格より下がっています」と表示）するため、
   *別店舗の価格* を *時系列の前回価格* として扱う意味のずれがある。価格履歴が未永続の現状では
   誤解を招く `reasons` が出得るので、文言を「他候補より安い」等に調整するか、履歴永続まで当該入力を `null` にするのが安全。

5. **軽微**: `WishlistForm.tsx:573-574` 右カラムの「v1では外部サイトの商品画像を取得せず…」は、
   v2 で楽天API画像を候補表示するようになったため文言を更新。
   `buy-timing-score.ts:72-79` の二重ガードは型ナローイング用途で実質到達不能 → ローカル const 利用で整理可。

## v2.5 以降へ回す事項

- 楽天API呼び出しの**レート制限**と、`next: { revalidate: 3600 }` を超えるキャッシュ戦略の精緻化。
- **Amazon プロバイダ実装**（`amazon.ts` はスタブ。PA-API/アソシエイト条件確認後）。
- **価格履歴の永続化**（Firestore 等）と、それを用いた買い時スコアの時系列化（推奨修正4の本質的解決）。
- 取得候補の `Product`/`Offer` への正式マージと、`next/image` + `remotePatterns` への移行。

---

## Codex へ渡す修正プロンプト

```
v2 レビューの推奨修正を反映してください。ブランチ fix/v1-review。
着手前に pwd / git status --short / git branch --show-current / node -v / npm -v を確認。
Claude と同時編集しないこと。

1. src/lib/product-search/rakuten.ts:
   - search() の fetch と response.json() を try/catch で囲み、ネットワーク/パース例外時も throw せず
     { configured: true, candidates: [], message: "楽天APIの検索に失敗しました。時間をおいて再試行するか、手入力で続けてください。" } を返す。
   - AbortController でタイムアウト（8000ms 目安）を設定し、タイムアウト時も同様に返す。
   - 既存の「キー未設定→mockSearch」「!response.ok→空」の挙動は維持。
   - firstImageUrl: ホストが楽天画像ドメイン（例 image.rakuten.co.jp を含む）でなければ null を返し、
     結果 imageSource を placeholder にフォールバックする。

2. src/lib/product-search/rakuten.test.ts に追加:
   - !response.ok → 空＋メッセージ
   - fetch が reject → 空＋メッセージ
   - 非楽天ドメイン画像URL → imageSource placeholder
   src/lib/utils/buy-timing-score.test.ts に追加:
   - score=70 の境界、previousEffectivePrice 上昇/下降、checkedAt が古い時のペナルティ

3. src/features/wishlist/WishlistList.tsx:
   - 買い時スコアの previousEffectivePrice に「2番目の比較候補（別ECの現在価格）」を渡しているのを見直す。
     価格履歴が未永続の現状では previousEffectivePrice を null にする（誤った「前回より下落」表示を防ぐ）。

4. src/features/wishlist/WishlistForm.tsx:
   - 右カラム(573-574 付近)の「v1では外部サイトの商品画像を取得せず…」を、楽天API画像のみ出典明記で扱う旨に更新。

# 禁止事項
- RAKUTEN_APPLICATION_ID / RAKUTEN_AFFILIATE_ID に NEXT_PUBLIC_ を付けない。
- スクレイピングを足さない。外部商品画像は楽天APIが返したURLのみ、imageSource を必ず保存。
- 「最安」「保証」等の断定表現を足さない。v1.2 の SEO/通知/シェア/履歴を壊さない。

# 完了後
- npm run lint / npx vitest run / npm run build を実行し結果を報告。
```
```
