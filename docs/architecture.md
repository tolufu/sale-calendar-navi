# アーキテクチャ設計 — セールカレンダー比較ナビ

最終更新: 2026-05-29

関連: [requirements-summary.md](./requirements-summary.md) /
[implementation-plan.md](./implementation-plan.md) /
[acceptance-checklist.md](./acceptance-checklist.md)

---

## 1. 技術スタック

| 領域 | 採用 | 備考 |
| --- | --- | --- |
| フレームワーク | Next.js（App Router） | RSC基本、必要箇所のみClient Component |
| 言語 | TypeScript | strict |
| スタイル | Tailwind CSS | 色トークンでEC色分け |
| 認証 | Firebase Anonymous Auth + 管理者Email/Password Auth | 未設定時は一般利用者のみローカル匿名IDで代替 |
| DB | Cloud Firestore | 未設定時は localStorage フォールバック |
| テスト | Vitest + Testing Library | ユーティリティ/コンポーネント中心 |
| Lint/Format | ESLint + Prettier | |

---

## 2. Next.js App Router 構成（想定）

```
app/
  layout.tsx              # 共通レイアウト（ヘッダ/ナビ/フッタ, レスポンシブ）
  page.tsx                # トップ
  calendar/page.tsx       # カレンダー
  sales/[id]/page.tsx     # セール詳細
  wishlist/
    new/page.tsx          # 欲しいもの登録
    page.tsx              # 欲しいもの一覧
  history/page.tsx        # 履歴 (v1.2)
  articles/
    page.tsx              # 記事一覧 (v1.2)
    [slug]/page.tsx       # 記事詳細 + generateMetadata(OGP)
  settings/notifications/page.tsx  # 通知設定 (v1.2)
  recovery/page.tsx       # 復旧 (v1.2)

components/
  state/                  # Skeleton, EmptyState, ErrorState, RetryButton, Toast
  calendar/               # CalendarGrid, DayCell, DaySalesBottomSheet など
  wishlist/ , ads/ , layout/ ...

lib/
  repositories/           # リポジトリ抽象 + Firestore実装 + local実装
  merchants/              # merchants マスタ・色トークン
  affiliate/              # 楽天AF変換 (v1.1)
  firebase/               # 初期化（未設定検知）
  auth/                   # 匿名Auth / ローカル代替
```

- **RSC優先**: 表示主体はServer Component。フォーム/カレンダー操作/Toast等はClient Component。
- **データ取得は薄いリポジトリ越し**にして、Firestore/localの差異をUIから隠す。

---

## 3. Firebase / Firestore とローカルフォールバック

### 環境変数検知

- `NEXT_PUBLIC_FIREBASE_*` が揃っていれば Firebase を初期化。
- 揃っていなければ初期化せず、**localStorage 実装**に自動フォールバック。
- これにより「Firebase未設定でもローカル開発が完結」する（AC-015）。秘密情報はコミットしない。

### リポジトリ抽象（核）

```ts
interface WishItemRepository {
  list(userId: string): Promise<WishItem[]>;
  get(userId: string, id: string): Promise<WishItem | null>;
  create(userId: string, input: WishItemInput): Promise<WishItem>;
  update(userId: string, id: string, patch: Partial<WishItemInput>): Promise<WishItem>;
  remove(userId: string, id: string): Promise<void>;
}
// 同形で SaleEventRepository / MerchantRepository / PurchaseHistoryRepository /
// NotificationSettingRepository / ArticleRepository を定義。
```

- 実装は `FirestoreWishItemRepository` と `LocalWishItemRepository`。
- ファクトリ `getRepositories()` が環境に応じて実装を返す。UIは実装を意識しない。
- 認証も同様に「Firebase匿名Auth」or「ローカル匿名uid」を返すアダプタにする。

### Firestore コレクション設計（例）

```
merchants/{merchantId}
sales/{eventId}                      # merchantId を持つ
users/{uid}/wishItems/{itemId}
users/{uid}/purchaseHistory/{id}
users/{uid}/notificationSetting/default
articles/{slug}                      # 公開コンテンツ
```

- セキュリティルール: `users/{uid}/**` は本人のみ。`merchants`/`sales` は読み取り公開。`articles` は公開状態のみ読み取り公開。

---

## 4. merchantId 設計（EC拡張前提）

- ECを **TypeScript enum や union literal に固定しない**。`merchantId: string` で参照する。
- 実体は `merchants` マスタ（Firestore `merchants` / ローカルはシードJSON）で一元管理。
- 表示名・色トークン・プレースホルダー・アフィリエイト設定・並び順・有効フラグをマスタが持つ。
- **EC追加 = マスタにレコードを足すだけ**で、カレンダー色分け・フィルター・登録対象に反映される。
- アフィリエイト変換は `merchants[id].affiliate` の設定駆動（v1.1は楽天のみ有効）。

---

## 5. 状態UIの共通化（v1から）

`components/state/` に以下を実装し、全データ取得画面で再利用する。

| コンポーネント | 役割 |
| --- | --- |
| `Skeleton` | 読み込み中のプレースホルダー |
| `EmptyState` | データ0件（イラスト＋次アクション導線） |
| `ErrorState` | 取得/保存失敗（原因の簡潔表示 + RetryButton） |
| `RetryButton` | 再試行トリガ |
| `Toast` | 保存/削除/エラーの一時通知 |

- 取得系は `loading / empty / error / success` の4状態を必ず持つ。
- フォーム系はバリデーションエラー表示と成功Toastを持つ。

---

## 6. レスポンシブ / スマホ複数セール表示

- PC/スマホ両対応（AC-020）。Tailwindのブレークポイントで切替。
- **同日複数セール（スマホ）**（AC-021）:
  - 2件まで → 縦スタック表示。
  - 3件以上 → 上位2件を表示し、残りを「**+n**」バッジ表示。
  - 日付セルタップで「**当日一覧ボトムシート**」を開き、全件表示。
- 「上位」の決定基準（例: startAt昇順 → merchant sortOrder）は実装時に定数化し、テストする。

---

## 7. アフィリエイト・広告・OGP

- **楽天AF変換**（v1.1）: 規約範囲でURL変換。IDは環境変数、未設定なら非変換のまま保存。
- **広告枠**（v1.2）: `components/ads/` に枠を用意。未設定時は自作プレースホルダー。
  公式サービスと誤認させる表記はしない。
- **OGP**（v1.2）: `generateMetadata` でページ別メタ。OG画像は自作（外部画像転載しない）。

---

## 8. 画像方針

- v1〜v1.2 の商品画像は **`public/images/placeholders/` の自作プレースホルダーのみ**。
- 外部ECの商品画像を取得・表示・キャッシュしない。
- `docs/ui-reference/` の画像は**レビュー参照専用**で、アプリから配信しない
  （[ui-reference/README.md](./ui-reference/README.md)）。

---

## 9. テスト方針

- **ユーティリティ**（楽天AF変換、複数セール上位n抽出、価格表示フォーマット）は単体テスト必須。
- **リポジトリ**: localStorage実装をテスト（Firestoreはモック/エミュレータは任意）。
- **コンポーネント**: 状態UI（loading/empty/error/success）と主要フォームのバリデーション。
- 変更後は `npm run lint` / `npm run test` / `npm run build` を実行し、失敗は原因と対処を記録。

---

## 10. セキュリティ / 法務上の構成メモ

- 価格はユーザーの手入力であり、外部から自動取得しない（スクレイピング禁止）。
- 「最安値」「最安保証」等の断定/保証表現をコード・コピーに含めない。
- 価格情報の正確性はユーザー責任である旨の免責表示を用意。
- Firebaseキー等の秘密情報は `.env.local` に置き、リポジトリにコミットしない。
