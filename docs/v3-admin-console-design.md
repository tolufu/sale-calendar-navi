# v3 管理者コンソール設計（記事投稿・セール日程CSV・Firestore本接続）

最終更新: 2026-06-02
作成: Claude（設計）／実装: Codex

## 0. 背景と目的

現状、記事（`src/data/articles.ts`）とセール日程（`src/data/sales.ts`）は静的TSの直書きで、
更新のたびにコード編集・デプロイが必要になっている。運営メンテナンスを画面から行えるよう、
**管理者専用コンソール `/admin`** を追加し、以下を可能にする。

- 記事の作成・編集・下書き/公開・削除
- セール日程の作成・編集・削除と **CSV一括インポート**（`docs/sale-schedule-input.csv` 形式）
- （任意・後続）商品フィードCSV取込、ECマスタ編集

土台として、現在ダミーになっている **Firestore本接続**（`createFirestoreRepositories()`）と
**管理者認証**（現状は匿名認証のみ）を実装する。これが今回ユーザーが求めた「SDK（Firestore）試用＝本接続」に相当する。

> CLAUDE.md の原則どおり、本書は **Claude設計** であり、実装は **Codex** が担当する。
> 本書とセットの貼り付けプロンプトは `docs/prompts/codex-v3-admin-console.md`。

## 1. 確定方針

| 項目 | 採用方針 |
| --- | --- |
| 認証 | Firebase Auth（メール/パスワード）でサインイン。管理者判定は Firestore `admins/{uid}` allowlist |
| 永続化 | Firestore本接続（`createFirestoreRepositories` を実装）。Firebase未設定時は従来どおりlocalStorage/静的シードにフォールバック（AC-015維持） |
| 管理画面のルート | `/admin`（未認証・非管理者はサインイン画面/権限なし表示にリダイレクト） |
| サーバ鍵 | Admin SDK は使わない。クライアントSDK＋セキュリティルールで権限制御（既存のサーバレス前提を維持） |
| 公開フィルタ | 記事は `status: "published"` のみ公開画面に出す。`draft` は管理画面のみ |
| 画像ポリシー | 記事OG画像は `public/images/placeholders/` のみ選択可。任意URL入力・スクレイピング画像は不可（CLAUDE.md準拠） |

## 2. 認証・権限モデル

### サインイン
- 管理者は Firebase Auth のメール/パスワードでサインイン（`signInWithEmailAndPassword`）。
- 一般利用者の匿名認証（`getAnonymousUserId`）はそのまま併存。管理画面のみ実ユーザー認証を要求する。

### 管理者判定（allowlist方式）
- Firestore に `admins/{uid}` ドキュメントを置き、存在すれば管理者とみなす。
- allowlist の作成は **Firebaseコンソールで手動**（クライアントからは書込不可）。初期管理者UIDは運営者が登録。
- 画面側は `admins/{uid}` の存在チェックでガード。**真の防御はセキュリティルール**側で行う（画面ガードはUX用）。

### Firestore セキュリティルール（`firestore.rules` を全面更新）
現在は `allow read, write: if false`。以下へ置き換える。

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAdmin() {
      return request.auth != null
        && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    // 管理者allowlist（読みは本人のみ、書込はコンソール限定）
    match /admins/{uid} {
      allow read: if request.auth != null && request.auth.uid == uid;
      allow write: if false;
    }

    // 公開コンテンツ：誰でも読める／書込は管理者のみ
    match /articles/{slug} {
      // 下書きは管理者のみ閲覧。公開記事は誰でも。
      allow read: if isAdmin() || resource.data.status == "published";
      allow write: if isAdmin();
    }
    match /sales/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /merchants/{merchantId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // 既存の利用者データは本人のみ（wishlist/history/notifications）
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

> 注: 公開記事一覧で `status == "published"` をルールで絞るため、一覧クエリには
> `where("status","==","published")` を必ず付ける（ルールはクエリ条件と整合が必要）。

## 3. データモデル変更

### Article（`src/lib/repositories/types.ts`）に運用フィールドを追加
```ts
export type ArticleStatus = "draft" | "published";

export type Article = {
  slug: string;
  title: string;
  description: string;
  body: string;
  ogImage: string;          // public/images/placeholders/ 配下のみ
  tags: string[];
  publishedAt: string;
  relatedSlugs?: string[];
  status?: ArticleStatus;   // 追加（省略時 published 互換）
  updatedAt?: string;       // 追加
};
```
- 既存の静的記事は `status` 省略＝公開扱いとして後方互換を保つ。
- 公開画面（`ArticleList` / `articles/[slug]`）は `status !== "draft"` のみ表示。

### SaleEvent は既存型をそのまま使用（変更不要）
`id / merchantId / title / saleType / startAt / endAt / description / sourceUrl /
strategyMemo? / confidence? / confidenceNote?`。

### Firestoreコレクション
| コレクション | ドキュメントID | 読み | 書き |
| --- | --- | --- | --- |
| `articles` | slug | 公開記事は全員/下書きは管理者 | 管理者 |
| `sales` | id | 全員 | 管理者 |
| `merchants` | merchantId | 全員 | 管理者 |
| `admins` | uid | 本人のみ | 不可（コンソール） |
| `users/{uid}/...` | 既存 | 本人 | 本人 |

### シード（初期投入）
- Firestoreが空のとき静的データ（`src/data/*.ts`）で画面が成立するよう、
  リポジトリは「Firestoreが空なら静的シードを返す」フォールバックを持つ。
- 管理画面に「静的データをFirestoreへ投入（シード）」アクションを設け、初回のみ実行できるようにする。

## 4. リポジトリ層の拡張

### `createFirestoreRepositories()` を本実装
- 現在は `createLocalRepositories()` を返すダミー。Firestore CRUDを実装する。
- 読み取り系（sales/merchants/articles）はFirestore→空なら静的シード。
- 既存の `SaleRepository` / `ArticleRepository` は読み取り専用インターフェース。
  **管理用に書込メソッドを足した別インターフェースを新設**する（公開UIの型は汚さない）。

```ts
export interface AdminArticleRepository {
  listAll(): Promise<Article[]>;                 // draft含む
  get(slug: string): Promise<Article | null>;
  upsert(article: Article): Promise<Article>;
  remove(slug: string): Promise<void>;
}
export interface AdminSaleRepository {
  listAll(): Promise<SaleEvent[]>;
  upsert(event: SaleEvent): Promise<SaleEvent>;
  bulkUpsert(events: SaleEvent[]): Promise<{ created: number; updated: number }>;
  remove(id: string): Promise<void>;
}
```
- `getAdminRepositories()` ファクトリを追加（Firebase未設定なら localStorage 実装で開発可能に）。

## 5. 画面構成（`/admin`）

```
/admin                … ダッシュボード（件数概況・シード/各管理への導線）
/admin/sign-in        … 管理者サインイン（メール/パスワード）
/admin/articles       … 記事一覧（下書き含む・status表示・編集/削除）
/admin/articles/new   … 記事作成フォーム
/admin/articles/[slug]/edit … 記事編集フォーム
/admin/sales          … セール日程一覧（編集/削除）
/admin/sales/new      … セール日程フォーム
/admin/sales/import   … セールCSVインポート（プレビュー→確定）
/admin/import/products … （任意・後続）商品フィードCSV取込
```

- レイアウトは既存の `src/components/ui`（Button/Card/PageHeader等）と配色トークンを流用。
- `/admin` 配下は共通ガード（未認証→sign-in、非管理者→権限なし表示）。
- 公開ヘッダー/フッターには管理導線を**出さない**（直URL運用）。

### 記事フォーム項目
slug（URL用・英数ハイフン・一意）／title／description／body（複数段落テキスト。
現行は `\n\n` 区切りプレーンテキスト）／ogImage（プレースホルダーから選択）／tags（カンマ区切り）／
publishedAt（日時）／relatedSlugs（任意）／status（draft/published）。
保存時 `updatedAt` を自動付与。slug重複・必須・OG画像のホワイトリスト検証。

### セール日程フォーム項目
merchantId（マスタから選択）／title／saleType／startAt／endAt／confidence（confirmed/estimated）／
sourceUrl（https・任意）／description／strategyMemo／confidenceNote。startAt≤endAt検証。

## 6. CSVインポート設計

### 6.1 セール日程CSV（`docs/sale-schedule-input.csv` 形式）
新規バリデータを `src/lib/import/csv/` に追加（商品フィードCSVと同じ作法）。

- ファイル: `src/lib/import/csv/sale-schedule-schema.ts` / `sale-schedule-validate.ts`（＋ `.test.ts`）
- 列: `merchantId, title, saleType, startAt, endAt, confidence, sourceUrl, note`
- `#` で始まる行・空行はスキップ（CSV冒頭のコメント行に対応）。先頭BOM除去。
- 各セルは既存 `sanitizeCsvCell`（CSVインジェクション対策）を流用。
- 検証ルール:
  - `merchantId`: `merchants` マスタに存在し `isActive`（rakuten/amazon/yahoo-shopping）。
  - `title`/`saleType`: 必須・非空。
  - `startAt`/`endAt`: JST `YYYY-MM-DD HH:mm`。`24:00` 超の表記（例 `25:59`）は翌日へ繰り上げてからISOへ。`startAt ≤ endAt`。
  - `confidence`: `confirmed`|`estimated`、空欄は `confirmed`。
  - `sourceUrl`: 空可。あれば https のみ（既存 `parseHttpsUrl` 流用）。
  - `note`: 任意（内部メモ。`confidenceNote` か内部運用メモへマップ）。
  - `id`: 既存と突き合わせる安定キーを生成（例 `${merchantId}-${saleType}-${startAt(YYYYMMDD)}`）。同一keyは更新、無ければ新規。
- フロー: アップロード/貼り付け → **ドライラン プレビュー**（行ごとに OK / エラー理由を表示、件数サマリ）→ 「確定」で `bulkUpsert`。
- 失敗行はスキップして取り込まない。結果（created/updated/skipped）を表示。

### 6.2 商品フィードCSV（既存資産の配線・任意/後続）
- 既存の `src/lib/import/csv/schema.ts` / `validate.ts` を活用。UIは同じ「プレビュー→確定」型。
- 取込先・用途（候補マスタ化）は要件が未確定のため **後続フェーズ**。フラグ `ENABLE_CSV_IMPORT` でガード。

## 7. ポリシー順守（CLAUDE.md）

- スクレイピング・外部価格自動取得・外部商品画像取得は**しない**。CSVは手入力データの一括登録のみ。
- 記事OG画像は `public/images/placeholders/` 限定。任意画像URLは受け付けない。
- 「最安値」「最安保証」等の断定/保証表現を使わない（フォーム説明文・既定テキストでも避ける）。
- 公式サービスと誤認されるロゴ/表現を使わない。
- 秘密情報（Firebase実キー）はコミットしない。`.env.local` のみ。`.env.example` に管理者認証の項目は追加不要（公開Web設定のみ）。

## 8. 受け入れ基準

- 非管理者は `/admin` 配下にアクセスできない（ルール＋画面ガードの二重）。
- 記事を作成→下書き保存→公開すると公開一覧/詳細に反映、下書きは公開側に出ない。
- セールCSVを取り込むとカレンダー/一覧に反映。不正行はスキップされ理由が表示される。
- **Firebase未設定でもアプリが起動し**、公開画面が静的シードで成立する（AC-015維持）。
- `firestore.rules` 更新後、利用者データ（wishlist/history）が本人のみアクセス可能。
- CSVバリデータの単体テストが通る。`npm run lint` / `npm run test` / `npm run build` 成功。

## 9. 実装フェーズ分割（Codex依頼単位）

1. **土台**: 管理者認証（メール/パスワード）＋ `admins` allowlist ＋ `firestore.rules` 更新 ＋
   `/admin` ガード ＋ ダッシュボード雛形 ＋ `createFirestoreRepositories` 本実装（読み取り＋シードフォールバック）。
2. **記事管理**: Article型拡張（status/updatedAt）＋ `AdminArticleRepository` ＋ 一覧/作成/編集/削除 ＋
   公開側の下書き除外。
3. **セール日程＋CSV**: `AdminSaleRepository` ＋ 一覧/フォーム ＋ セールCSVバリデータ（＋テスト）＋
   インポート画面（プレビュー→確定）。
4. **（任意）商品フィードCSV / ECマスタ編集**: フラグガードで段階導入。

> 1依頼で全部やらせない。各フェーズ「実装→Claudeレビュー→次へ」。

## 10. 復旧コードとの関係（参考・別件）

`src/app/recovery/page.tsx` は現在プレースホルダー（入力欄/ボタンともdisabled、Firestore対応後に有効化と明記）で、
**まだ利用者に渡せる状態ではない**。本v3でFirestore＋認証の土台が入ると復旧コード実装の前提は整うが、
復旧コードは利用者向け機能であり管理者コンソールとは別スコープ。別途「コード発行→保存→別端末照合→データ移行」の
設計が必要。必要なら次の設計依頼として切り出す。
