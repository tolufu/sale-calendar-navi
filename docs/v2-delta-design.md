# v2 差分設計 — セールカレンダー比較ナビ

最終更新: 2026-05-30
担当: Claude（設計・レビュー）。本書は**設計のみ**で実装は含まない。実装は Codex が
[v2-codex-prompt-notes.md](./v2-codex-prompt-notes.md) を参照して行う。

関連: [architecture.md](./architecture.md) / [requirements-summary.md](./requirements-summary.md) /
[implementation-plan.md](./implementation-plan.md) / [acceptance-checklist.md](./acceptance-checklist.md) /
[v1.1-delta-design.md](./v1.1-delta-design.md) / [v1.2-delta-design.md](./v1.2-delta-design.md)

---

## 0. v2 のゴールと非ゴール

### ゴール（今回入れる）
- **楽天API連携（許可された公式APIのみ）**: 楽天商品の「商品名・画像URL・価格候補・アフィリエイトURL」を
  補完する。ただし **APIキー未設定でも v1.2 までの手入力フローがそのまま動く**こと（フォールバック必須）。
- **画像表示の解禁（楽天APIなど許可された取得元の画像URLのみ）**: 商品画像を表示できるようにするが、
  `imageSource` を**必ず保存**し、許可ホスト以外の画像URLは保存・表示しない。
- **買い時スコア初期版**: 「希望価格達成度・セール重要度・前回メモとの差分」から中立的な目安スコアを算出。
  **データ不足時はスコアを出しすぎない**（信頼度に応じて非表示 or 限定表示）。
- 楽天API adapter / env / フォールバック / 画像権利 / 買い時スコアの**型と純粋関数の設計**。

### 非ゴール（今回やらない / 禁止）
- **スクレイピング（据え置き禁止）**: 外部ECの価格・在庫・画像・レビューの自動取得（HTMLパース）はしない。
  楽天は**公式API経由のみ**。Amazon/価格.com の自動取得はしない。
- **Amazon PA-API の無理な実装**: PA-API は提携審査・売上要件があるため、**条件確認が取れるまで実装しない**。
  Amazon リンクは v1.2 までどおり手入力 + そのまま開く（アフィリエイト変換は条件確認後の別タスク）。
- **「最安」「最安保証」等の断定・保証表現**、公式サービスと誤認されるロゴ・表現。
- **買い時スコアの過信表現**（「今が買い」断定、ランキング保証）。あくまで中立的な「目安」。
- APIキーの**クライアント露出 / リポジトリへのコミット**。

---

## 1. 現状確認結果（v1.2 完了時点の棚卸し）

| 領域 | 現状（v1.2まで） | v2 でやること |
| --- | --- | --- |
| EC マスタ | `merchants.ts` に amazon / rakuten。楽天のみ `affiliate{provider:"rakuten",enabled:true}`。enum 固定でなくマスタ参照。 | 楽天 merchant に「API補完が有効か」を表す情報を足せる構造に（後述 §2.4 は任意）。 |
| 価格候補 | `WishItem.candidates: PriceCandidate[]`（EC別の `breakdown`/`originalUrl`/`affiliateUrl`/`priceMemo`/`lastCheckedAt`/`imageSource:"placeholder"`）。 | `PriceCandidate` に楽天API由来フィールド（画像URL・取得元・取得時刻・候補価格）を後方互換で追加。 |
| 価格計算 | `calculateEffectivePrice(breakdown)` が純粋関数で実装済み（送料 + 商品 − クーポン − 付与ポイント×換算率）。 | 買い時スコアの「希望価格達成度」はこの実質価格を使う。**価格計算ロジックは変えない**。 |
| アフィリエイト | `affiliate.ts`：楽天ホスト判定 + `scid` 付与（`af_link_dummy`）/ `hb.afl.rakuten.co.jp` 形式。env は `NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID`。 | 楽天APIが返す `affiliateUrl` を**優先採用**し、無い時は既存変換にフォールバック。 |
| 画像 | `imageSource: "placeholder"` 固定。商品画像は自作SVGプレースホルダーのみ。`next.config.ts` に画像許可なし。 | `imageSource: "placeholder" \| "rakuten"` に拡張。許可ホストのみ `next/image` で表示。 |
| サーバAPI | `app/api` ルートは**無い**（全てクライアント + localStorage / Firestore はスタブ）。 | 楽天API中継用に **Route Handler `/api/rakuten/*`** を新設（キーをサーバ側に隠す）。 |
| env | `.env.example` に Firebase 6 + `NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID`。`NEXT_PUBLIC_SITE_URL` は README のみ。 | 楽天APIキー（**非 NEXT_PUBLIC**）/ 機能フラグ / `NEXT_PUBLIC_SITE_URL` を `.env.example` に追記。 |
| リポジトリ | `types.ts` の interface 群。Firestore は local へフォールバックするスタブ。 | リポジトリ interface は**変えない**。楽天連携は別レイヤ（integrations）として足す。 |

> v1.1 で `candidates[]`（EC別候補）が既にあるため、楽天API補完は **新しい候補を作る/既存候補を更新する**
> 形で自然に乗る。`WishItem` 本体スキーマの破壊的変更は不要。

---

## 2. データモデル差分（後方互換で拡張）

既存フィールドは削除せず、**任意フィールドの追加のみ**。`WISH_ITEM_SCHEMA_VERSION` を 2 → 3 に上げ、
`migrateWishItem` で旧データを安全に読めること。

### 2.1 `imageSource` の拡張（`src/lib/repositories/types.ts`）
```ts
// before: "placeholder" のみ
export type ImageSource = "placeholder" | "rakuten";
```
- `Offer.imageSource` と `PriceCandidate.imageSource` を `ImageSource` 型に変更（既定は `"placeholder"`）。
- **`imageSource` は常に保存必須**。値が無い旧データは migrate 時に `"placeholder"` を補完。

### 2.2 `PriceCandidate` への楽天API由来フィールド追加
```ts
export type CandidateImage = {
  url: string;            // 許可ホストの画像URLのみ（§5 のホワイトリストで検証済み）
  source: ImageSource;    // "rakuten" 等。取得元を必ず保存
  width?: number | null;
  height?: number | null;
  fetchedAt: string | null; // ISO。APIから取得した時刻（鮮度表示・再取得判断用）
};

export type CandidatePriceSuggestion = {
  price: number | null;   // 楽天APIの itemPrice（手入力 breakdown とは別枠で保持）
  affiliateUrl: string | null;
  itemUrl: string | null; // 楽天の通常URL（itemUrl）
  source: "rakuten-api";
  fetchedAt: string | null;
};

export type PriceCandidate = {
  merchantId: string;
  originalUrl: string;
  affiliateUrl: string | null;
  breakdown: PriceBreakdown;     // 既存：手入力の内訳（実質価格の根拠）
  priceMemo: string | null;
  lastCheckedAt: string | null;
  imageSource: ImageSource;      // 既存（型だけ拡張）
  // ===== v2 追加（任意） =====
  image?: CandidateImage | null;        // 表示用画像。許可ホストのみ
  apiSuggestion?: CandidatePriceSuggestion | null; // API由来の参考価格（手入力を上書きしない）
};
```
**設計原則**:
- **手入力の `breakdown` を API値で勝手に上書きしない**。`apiSuggestion` は別枠で持ち、UI上「APIの参考値を
  内訳へ反映しますか？」のように**ユーザー操作でのみ** `breakdown.productPrice` へ転記する。
- 実質価格（`calculateEffectivePrice`）の入力は引き続き手入力 `breakdown`。API値は「候補・参考」止まり。
- 価格は「参考値・手入力値」であり保証しない旨をUIに明記（断定表現禁止）。

### 2.3 移行（`migrateWishItem` / `syncWishItemMirrors`）
- `WISH_ITEM_SCHEMA_VERSION = 3`。
- 旧候補（`image`/`apiSuggestion` 無し）→ `image: null`, `apiSuggestion: null`, `imageSource: "placeholder"` を補完。
- `normalizeCandidate` を拡張し、`image.url` は**許可ホスト検証を通った場合のみ**保持（不正なら `null` に落とす）。
  許可外URLは**保存もしない**（混入防止を正規化で担保）。
- 冪等であること（既存 `wish-item.test.ts` の方針を踏襲）。

### 2.4 merchant マスタ（任意・最小）
- 楽天 merchant に API 補完可否を持たせたい場合は `affiliate` とは別に `apiProvider?: "rakuten" | null` を
  足してもよい。ただし **enum 固定にしない**（マスタ参照を維持）。v2 では `merchantId === "rakuten"` 判定 +
  「楽天APIが設定済みか」のランタイム判定で十分なため、**マスタ拡張は任意**とする。

---

## 3. 楽天API adapter 設計

### 3.1 使う公式API（候補）
- **楽天市場 商品検索API（IchibaItem Search）**: キーワード/ジャンルから商品候補を取得。
  返却に `itemName` / `itemPrice` / `itemUrl` / `affiliateUrl` / `mediumImageUrls`/`smallImageUrls` 等。
- （任意）**商品コード/URLからの特定商品ルックアップ**: ユーザーが貼った楽天商品URLから `itemCode` を抽出して
  該当商品を引く用途。MVPは「キーワード検索で候補を出す」で可。
- **重要**: 採用エンドポイント・必須/任意パラメータ・レスポンス項目・**画像URLの許可ホスト**・
  **アフィリエイト表記義務**は、実装時に楽天ウェブサービスの**最新の規約・仕様で必ず確認**する
  （本書のフィールド名は設計時点の想定。実装前に要確認）。

### 3.2 レイヤ構成（新設 `src/lib/integrations/rakuten/`）
```
src/lib/integrations/rakuten/
  types.ts     … RakutenItem / RakutenSearchParams / RakutenSearchResult / 設定型
  config.ts    … isRakutenApiConfigured() / getRakutenConfig()（サーバ専用、env読取）
  mapper.ts    … mapRakutenItem(raw): RakutenItem（純粋関数・テスト対象。許可ホスト検証含む）
  client.ts    … callRakutenSearch(params): サーバ専用 fetch（タイムアウト/エラー正規化）
```
- **クライアントから楽天APIを直接叩かない**。必ず Next.js Route Handler 経由（§3.4）。
- `mapper.ts` は**ネットワーク非依存の純粋関数**にして単体テスト（生JSON → 正規化 → 許可ホスト外画像は落とす）。

### 3.3 型（設計案）
```ts
// integrations/rakuten/types.ts
export type RakutenItem = {
  itemCode: string;
  itemName: string;
  itemPrice: number | null;
  itemUrl: string;            // 楽天の通常URL
  affiliateUrl: string | null;// APIがアフィリ設定時に返す。未設定なら null
  imageUrl: string | null;    // 許可ホスト検証を通った1枚（mediumImageUrls先頭等）。NGなら null
  shopName: string | null;
  reviewAverage: number | null; // 取得しても表示は任意（レビュー本文は扱わない）
};

export type RakutenSearchParams = {
  keyword: string;
  hits?: number;   // 既定 10、上限は規約に従う
  page?: number;
};

export type RakutenSearchResult =
  | { ok: true; items: RakutenItem[]; fetchedAt: string }
  | { ok: false; reason: "not-configured" | "rate-limited" | "upstream-error" | "invalid-input" };
```

### 3.4 サーバ Route Handler（新設 `src/app/api/rakuten/search/route.ts`）
- メソッド: `GET`（`?keyword=...&hits=...`）。`runtime` は `nodejs`。
- 処理:
  1. `isRakutenApiConfigured()` が false → `{ ok:false, reason:"not-configured" }` を 200 で返す（UIがフォールバック判断）。
  2. 入力検証（`keyword` 必須・長さ上限・`hits` 範囲）。NG → `invalid-input`。
  3. **サーバ側 env の applicationId / affiliateId** を使って楽天APIへ fetch（タイムアウト ~5s）。
  4. `mapRakutenItem` で正規化（許可ホスト外画像は `imageUrl:null`）。
  5. **簡易レートリミット**（同一IP/期間のメモリ上カウント or `Cache-Control`）と**短時間キャッシュ**
     （`revalidate` or in-memory）で楽天への過剰アクセスを避ける。失敗時 `upstream-error`。
- **applicationId をレスポンスに含めない**。返すのは正規化済み `RakutenItem` のみ。
- 認証ユーザーの保存データ（userId・メモ）はこのAPIに渡さない（検索キーワードのみ）。

### 3.5 クライアント呼び出し
- フォーム（`WishlistForm`）に「楽天で候補を検索」ボタン → `/api/rakuten/search?keyword=...` を fetch。
- 結果リストから1件選ぶと、その候補で `PriceCandidate` を作成/更新:
  - `merchantId: "rakuten"`、`originalUrl: itemUrl`、`affiliateUrl: item.affiliateUrl ?? buildAffiliateUrl(...)`、
    `image: { url: item.imageUrl, source:"rakuten", fetchedAt }`、`apiSuggestion: { price: itemPrice, ... }`。
  - `imageSource: item.imageUrl ? "rakuten" : "placeholder"`。
  - **`breakdown` は空のまま**（ユーザーが手入力 or 「参考値を反映」操作で転記）。
- API未設定/失敗時はボタンを出さない or 「現在は手入力のみ」を表示（§4）。

### 3.6 アフィリエイトURLの優先順位
1. 楽天APIが返した `affiliateUrl`（affiliateId 設定時）。
2. 無ければ既存 `buildAffiliateUrl` / `convertRakutenAffiliateUrl`（`affiliate.ts`）でフォールバック。
3. どちらも不可なら `affiliateUrl: null`（元URLをそのまま開く）。
- 既存 `affiliate.ts` の関数シグネチャは**変えない**（後方互換）。

---

## 4. env 変数設計 と APIキー未設定時フォールバック

### 4.1 `.env.example` 追記（キー名のみ・値は空）
```bash
# ===== v2: 楽天ウェブサービス（サーバ専用・NEXT_PUBLIC を付けない） =====
RAKUTEN_APPLICATION_ID=
RAKUTEN_AFFILIATE_ID=
# 楽天API連携の機能フラグ（未設定/false で手入力フォールバック）
NEXT_PUBLIC_ENABLE_RAKUTEN_API=

# ===== 既存（v1.x） =====
# NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID は v1.1 のURL変換用（クライアント可）。v2 の AFFILIATE_ID とは別物。
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```
- **`RAKUTEN_APPLICATION_ID` / `RAKUTEN_AFFILIATE_ID` は `NEXT_PUBLIC_` を付けない**（クライアントへ露出させない）。
  サーバ（Route Handler）でのみ `process.env` から読む。
- `NEXT_PUBLIC_ENABLE_RAKUTEN_API` は**機能トグル**（UIにボタンを出すか判断）。サーバ側の真の可否は
  `RAKUTEN_APPLICATION_ID` の有無で `isRakutenApiConfigured()` が決める（フラグだけでは有効化しない）。
- 既存 `NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID`（v1.1）は残す（URL変換のフォールバック用）。混同しないよう
  `.env.example` のコメントで役割差を明記。
- **秘密情報をコミットしない**（`.env.local` のみ）。値は出力・保存・ログしない。

### 4.2 設定判定ヘルパ
```ts
// サーバ専用（Route Handler 内）
export function isRakutenApiConfigured(): boolean {
  return Boolean(process.env.RAKUTEN_APPLICATION_ID);
}
// クライアント（UIトグル）
export const isRakutenApiEnabledClient =
  process.env.NEXT_PUBLIC_ENABLE_RAKUTEN_API === "true";
```

### 4.3 フォールバックの段階（必ず壊れない）
| 状態 | UI挙動 |
| --- | --- |
| `NEXT_PUBLIC_ENABLE_RAKUTEN_API` 未設定/false | 「楽天で候補を検索」ボタンを**出さない**。v1.2 までの手入力フローのみ。 |
| フラグ true だがサーバ `RAKUTEN_APPLICATION_ID` 無し | API は `not-configured` を返す → UIは「現在は手入力のみ」を控えめに表示。例外を出さない。 |
| API 設定済み・正常 | 候補リスト表示 → 選択で候補に反映（画像は許可ホストのみ）。 |
| API 設定済み・失敗/レート超過 | Toast/ErrorState で「候補を取得できませんでした。手入力で続けられます」。手入力は常に可能。 |

- **どの状態でも「保存・実質価格・買い時スコア（データが揃えば）」は手入力だけで成立**すること。
- localStorage / Firestore フォールバック（v1の方針）は v2 でも維持。Firebase 未設定でも開発可能。

---

## 5. 画像表示の権利・取得元保存

### 5.1 原則
- 表示してよいのは**許可された取得元の画像URLのみ**（v2 では楽天APIが返す画像URL）。
- **`imageSource` を必ず保存**（`"rakuten"` / `"placeholder"`）。取得時刻 `fetchedAt` も保存。
- 許可ホスト**ホワイトリスト**外のURLは**保存も表示もしない**（`null` に落とす）。スクレイピング/直リンクの混入防止。
- 自作プレースホルダーSVGは引き続き利用可（API画像が無い候補や Amazon は placeholder）。

### 5.2 許可ホスト（実装時に楽天規約で要確認）
- 想定: 楽天の画像CDNホスト（例 `thumbnail.image.rakuten.co.jp`, `image.rakuten.co.jp`, `*.r10s.jp`）。
- **正確なホスト名・利用条件・サイズ指定の作法は楽天ウェブサービス規約で確認してから確定**する。
  本書はプレースホルダーとして列挙。実装は `mapper.ts` のホワイトリスト定数に集約しテストする。
```ts
const RAKUTEN_IMAGE_HOSTS = [/* 規約確認後に確定 */];
export function isAllowedImageUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && RAKUTEN_IMAGE_HOSTS.some((h) => u.hostname === h || u.hostname.endsWith("." + h));
  } catch { return false; }
}
```

### 5.3 `next.config.ts` の画像許可
- `next/image` を使うなら `images.remotePatterns` に**許可ホストのみ** `https` で登録。
- ワイルドカードで全許可しない。`RAKUTEN_IMAGE_HOSTS` と整合させる。
- 代替として `<img loading="lazy">` 直書きでもよいが、その場合も**表示前に `isAllowedImageUrl` で検証**。

### 5.4 表示時のクレジット/注記
- 画像近傍に取得元（例「画像: 楽天市場」）と「価格・在庫は各サイトで最新を確認」の中立注記。
- レビュー本文・点数の強調表示はしない（扱うとしても average の控えめ表示まで・断定しない）。
- アフィリエイトリンクには規約に沿った表記（実装時に楽天の表記義務を確認）。

---

## 6. 買い時スコア（初期版）

### 6.1 目的と原則
- 保存商品ごとに「今、見直す価値があるか」の**中立的な目安**を 0–100 で表示。**断定・保証はしない**。
- **データ不足時はスコアを出しすぎない**: 必要データが欠ける要素は計算から除外し、根拠が薄い場合は
  スコアを出さず「判定材料が不足しています」を表示（信頼度 = `low` 以下は数値非表示）。
- 純粋関数化（`now`・入力を引数で受け、内部で `Date.now()` を呼ばない）してテスト容易に。

### 6.2 配置と型（新設 `src/lib/utils/buy-timing.ts`）
```ts
export type BuyTimingFactor = {
  key: "desiredPriceAchievement" | "saleImportance" | "priceTrend";
  available: boolean;   // 計算に必要なデータが揃っているか
  score: number;        // 0–100（available=false のときは計算に含めない）
  reason: string;       // 中立的な根拠文（UI表示用・保証表現を含めない）
};

export type BuyTimingConfidence = "none" | "low" | "medium" | "high";

export type BuyTimingResult = {
  score: number | null;          // 総合 0–100。信頼度 none/low では null（非表示）
  confidence: BuyTimingConfidence;
  factors: BuyTimingFactor[];    // 内訳（available=true のものを表示）
  note: string;                  // 「手入力値に基づく目安です」等の中立注記
};

export function calculateBuyTiming(args: {
  now: Date;
  item: WishItem;
  candidates: PriceCandidate[];
  upcomingSales: SaleEvent[];     // item のEC（merchantId / candidates[].merchantId）に一致する今後のセール
}): BuyTimingResult;
```

### 6.3 各要素の計算式（初期版・いずれも 0–100、データ不足は `available:false`）

**(A) 希望価格達成度 `desiredPriceAchievement`**
- 必要データ: `item.desiredPrice`（> 0）と、いずれかの候補の実質価格 `calculateEffectivePrice(breakdown)`（非 null）。
- `best = 候補の実質価格の最小値`、`target = desiredPrice` として:
  - `best <= target` → `100`（希望価格以下）。
  - `best > target` → `clamp(0, 100, round(100 * target / best))`（希望にどれだけ近いか。`best=2*target` で 50）。
- どちらか欠ければ `available:false`（**手入力の実質価格が無ければこの要素は出さない**）。

**(B) セール重要度 `saleImportance`**
- 必要データ: `upcomingSales` が1件以上（item のECに一致する今後のセール）。
- 最も近い対象セールの `saleType` と開始までの日数 `d = days(startAt - now)` から:
  - セール種別の重み（マスタ的に定義。例: 大型セール=1.0 / 通常=0.6 / 不明=0.4）× 近接度。
  - 近接度: `d<=1 →1.0`, `d<=3 →0.8`, `d<=7 →0.6`, `d<=14 →0.4`, それ以上 →0.2。
  - `score = round(100 * weight * proximity)`。
- 今後セールが無ければ `available:false`。
- セール種別の重みは**断定でなく目安**として `buy-timing.ts` 内の定数表に集約（テスト対象）。

**(C) 前回メモとの差分（価格トレンド）`priceTrend`**
- 必要データ: 同一候補の**過去の実質価格 or `apiSuggestion.price`** と直近値の2点以上。
  - v2 初期は履歴系列を持たないため、**「前回 `lastCheckedAt` 時点の値」と「今回値」**が比較できる場合のみ算出。
    比較材料が `breakdown` の更新前後 or `apiSuggestion` と手入力の差など、**実データで2点取れる時だけ**。
  - 値下がり（今回 < 前回）→ 高スコア、横ばい→中位、値上がり→低スコア。
    `delta = (prev - curr) / prev` → `score = clamp(0,100, round(50 + 50 * delta))`。
- 2点取れなければ `available:false`（**1点しか無い大多数のケースではこの要素は出さない**＝出しすぎ防止）。

### 6.4 総合スコアと信頼度
- `available:true` の要素だけで**重み付き平均**。初期重み: A=0.5 / B=0.3 / C=0.2 を、**揃った要素だけで再正規化**。
  - 例: A と B のみ available → 重み 0.5:0.3 を 0.625:0.375 に再正規化して合成。
- 信頼度 `confidence`:
  - `available` 要素 0 個 → `none`（`score:null`、「判定材料が不足」表示）。
  - 1 個 → `low`（**数値は出さず**、根拠文のみ or 「材料不足」）。
  - 2 個 → `medium`。
  - 3 個 → `high`。
- **`score` は `confidence` が `medium` 以上のときだけ数値表示**（`none/low` は非表示）。＝データ不足時に出しすぎない。

### 6.5 表示条件・文言（中立）
- 表示場所: 欲しいもの一覧カード / 欲しいもの詳細。スコアは「買い時の目安」ラベル + 0–100 + 信頼度バッジ。
- `none/low`: 「判定材料が不足しています（希望価格や実質価格メモ、対象セールを入力すると目安が出ます）」。
- `medium/high`: スコア + 内訳（available 要素の `reason`）。
- **必須注記**: 「手入力値に基づく中立的な目安です。最安・購入可否を保証しません。最新は各サイトで確認してください。」
- 「今すぐ買い」「最安」等の**断定・保証表現は使わない**。色は強い赤緑で煽らない（中立配色）。

---

## 7. テスト観点

ユーティリティ（単体・必須）:
- `mapRakutenItem`（`integrations/rakuten/mapper.ts`）:
  - 正常JSON → `RakutenItem` 正規化（価格 number 化、欠損は null）。
  - **許可ホスト外の画像URLは `imageUrl:null` に落ちる**（混入防止の回帰テスト）。
  - `affiliateUrl` が無いケースで null、ある場合はそのまま。
- `isAllowedImageUrl`: 許可ホスト/サブドメイン true、http/別ホスト/不正URL false。
- `isRakutenApiConfigured` / クライアントフラグ: env 有無での true/false。
- `normalizeCandidate`（拡張後）: `image.url` が許可外なら保存しない（null 化）、`imageSource` 既定 `"placeholder"`、冪等。
- `migrateWishItem`: 旧データ（`image`/`apiSuggestion` 無し・`imageSource` 無し）を読んでも例外なく `v3` に移行、冪等。
- `calculateBuyTiming`（`buy-timing.ts`）:
  - 各要素の `available` 判定（必要データ欠落で false）。
  - 希望価格達成度: `best<=target`→100、`best=2*target`→約50、`desiredPrice` 無し→ available:false。
  - セール重要度: 近接度・種別重みの境界（d=1/3/7/14）、今後セール無し→ available:false。
  - 価格トレンド: 2点で値下がり/横ばい/値上がり、1点のみ→ available:false。
  - 信頼度: available 0/1/2/3 → none/low/medium/high、**none/low で `score:null`**。
  - 重みの再正規化（一部要素のみ available のとき合計重み=1）。
  - `now` を引数で受ける純粋関数（内部で `Date.now()` を呼ばない）。
- `calculateEffectivePrice`: **変更しない**ので既存テストが緑のまま（回帰）。

Route Handler / 統合（最小）:
- `/api/rakuten/search`: 未設定で `not-configured`、入力不正で `invalid-input`、
  applicationId が**レスポンスに含まれない**こと、検索キーワード以外（userId 等）を上流に送らないこと。
  実ネットワークはモック（fetch スタブ）でテストし、CIで楽天本番を叩かない。

コンポーネント / 回帰:
- API未設定（フラグ off）で「楽天で候補を検索」ボタンが出ず、手入力フローが従来どおり成立。
- 候補選択で `PriceCandidate` に `image`/`apiSuggestion` が入り、`breakdown`（手入力）は上書きされない。
- 画像は許可ホストのときだけ表示、それ以外は placeholder。`imageSource` が保存される。
- 買い時スコアが `medium` 以上でのみ数値表示、`none/low` で「材料不足」表示、注記が出る。
- 既存テスト（`affiliate`/`price`/`wish-item`/`history`/`share`/`reminder`/`notification` 等）が緑。
- `npm run lint` / `npm run test` / `npm run build` 緑。

---

## 8. 既存 v1.2 機能への影響

| 既存機能 | 影響 | 対応 |
| --- | --- | --- |
| 欲しいもの保存（`WishItem`/`candidates`） | スキーマ拡張（任意フィールド + version 3）。 | 後方互換 migrate。既存保存データが壊れないこと（テスト）。 |
| 実質価格（`calculateEffectivePrice`） | **変更なし**。買い時スコアが利用するのみ。 | ロジック据え置き。API値で `breakdown` を自動上書きしない。 |
| アフィリエイト変換（`affiliate.ts`） | API `affiliateUrl` を優先、無ければ既存関数にフォールバック。 | 既存シグネチャ維持。`NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID` は残す。 |
| 価格比較シェア（`share.ts`） | 画像URL・API値が増えても**機密扱いの方針は不変**。 | 画像URL・itemUrl・userId・メモを**共有文面に入れない**（既存の混入防止テストを維持/追加）。 |
| リマインダー（`reminder.ts`） | EC突合は `candidates[].merchantId` 利用済み。買い時スコアと相補。 | 変更なし（必要なら買い時スコアを表示側で併記する程度）。 |
| 通知設定（`notification.ts`） | 影響なし。 | 変更なし。 |
| 履歴（`history.ts`） | 影響なし。 | 変更なし。 |
| 記事 / metadata / canonical | 影響なし。 | 変更なし。 |
| 広告プレースホルダー | 影響なし（本番IDは引き続き入れない）。 | 変更なし。 |
| 画像方針（v1〜v1.2 はプレースホルダーのみ） | **v2 で許可ホストのAPI画像を解禁**（方針更新）。 | `imageSource` 保存・ホワイトリスト・`next.config` 許可・注記で統制。 |
| Firebase/localStorage フォールバック | 影響なし（API未設定でも開発可能を維持）。 | 楽天APIはサーバRoute経由で別レイヤ。 |
| サーバAPIルート | **新規**（初の `app/api`）。 | キーをサーバ専用 env に隠す。レート/キャッシュ/タイムアウトを実装。 |

破壊的変更の有無:
- **破壊的なし**を目標。`imageSource` 型拡張・`PriceCandidate` 追加フィールド・version 3 は後方互換。
- もし `imageSource` を文字列リテラル `"placeholder"` に依存している箇所があれば、`ImageSource` 型へ置換する
  だけで済むよう影響範囲を実装前に grep で洗う（`types.ts` / `wish-item.ts` / 表示コンポーネント）。

---

## 9. 影響ファイル一覧（実装は Codex・1依頼=1テーマ）

| 区分 | ファイル | 変更概要 |
| --- | --- | --- |
| 型 | `src/lib/repositories/types.ts` | `ImageSource` 拡張、`CandidateImage`/`CandidatePriceSuggestion`、`PriceCandidate` 追加フィールド、`WISH_ITEM_SCHEMA_VERSION=3` |
| 移行 | `src/lib/utils/wish-item.ts` | `normalizeCandidate`/`migrateWishItem` 拡張（画像ホスト検証・既定補完・冪等） |
| 連携 | `src/lib/integrations/rakuten/types.ts`（新） | 楽天API型 |
| 連携 | `src/lib/integrations/rakuten/config.ts`（新） | `isRakutenApiConfigured` 等（サーバ専用 env 読取） |
| 連携 | `src/lib/integrations/rakuten/mapper.ts`（新） | `mapRakutenItem`/`isAllowedImageUrl`（純粋関数・テスト対象） |
| 連携 | `src/lib/integrations/rakuten/client.ts`（新） | サーバ専用 fetch（タイムアウト/エラー正規化） |
| API | `src/app/api/rakuten/search/route.ts`（新） | 中継Route Handler（検証/レート/キャッシュ/キー秘匿） |
| UI | `src/features/wishlist/WishlistForm.tsx` | 「楽天で候補を検索」導線・候補選択で候補反映（フラグで出し分け） |
| UI | `src/features/wishlist/WishlistList.tsx` ほか | 画像表示（許可ホストのみ）・買い時スコア表示 |
| スコア | `src/lib/utils/buy-timing.ts`（新） | `calculateBuyTiming`（純粋関数） |
| アフィリ | `src/lib/utils/affiliate.ts` | 変更最小（API `affiliateUrl` 優先のフォールバック呼び出しは UI/連携側で） |
| 設定 | `next.config.ts` | `images.remotePatterns` に許可ホスト（`next/image` 採用時） |
| 設定 | `.env.example` / `README.md` | 楽天API env・フラグ・役割差の追記 |
| テスト | 各 `*.test.ts` | §7 |
| ドキュメント | `docs/acceptance-checklist.md` 等 | v2 の証跡更新（実装後） |

> 実装は Claude と同時編集しない。1依頼=1テーマで Codex に渡す（[v2-codex-prompt-notes.md](./v2-codex-prompt-notes.md)）。
> 「Claude設計 → Codex実装 → Claude確認」の流れを守る。
