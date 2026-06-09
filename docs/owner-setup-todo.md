# オーナー作業 TODO（APIキー設定・公開準備）

最終更新: 2026-06-02

このアプリは **未設定でも動作**します（Firebase 未設定なら自動的に LocalStorage 保存、楽天 API キー未設定なら検索はモック候補表示）。
本番公開や実データ連携を行う際に、以下をご自身で設定してください。秘密情報は `.env.local` に置き、**リポジトリにコミットしない**でください（`.env.example` がテンプレートです）。

---

## 0. 前提
- Node.js 22 系 / npm 10 系（確認済み: `v22.22.3` / `10.9.8`）
- 初回セットアップ:
  ```bash
  npm install
  cp .env.example .env.local   # 値は未記入でも起動可
  npm run dev
  ```

---

## 1. 楽天 API（商品検索・アフィリエイト）※任意
未設定でも欲しいもの登録は手入力で動作します。実検索を使う場合のみ設定。

| 変数 | 種別 | 用途 | 取得元 |
| --- | --- | --- | --- |
| `RAKUTEN_APPLICATION_ID` | サーバー専用 | 楽天商品検索API(IchibaItem/Search)の呼び出し | [楽天ウェブサービス](https://webservice.rakuten.co.jp/) でアプリID発行 |
| `RAKUTEN_AFFILIATE_ID` | サーバー専用 | アフィリエイトID（任意） | 楽天アフィリエイト |
| `NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID` | 公開 | クライアント側のアフィリエイト変換（公開可能な値のみ） | 楽天アフィリエイト |
| `NEXT_PUBLIC_RAKUTEN_AFFILIATE_SCID` | 公開 | アフィリエイトリンクの scid | 楽天アフィリエイト |

- 注意: `RAKUTEN_APPLICATION_ID` / `RAKUTEN_AFFILIATE_ID` には **絶対に `NEXT_PUBLIC_` を付けない**（サーバー専用。クライアントへ露出させない）。
- 未設定時の挙動: 検索は「モック候補」を返し、手入力での保存は可能。

## 1.1 Yahoo!ショッピング API（商品検索）※任意
未設定でも欲しいもの登録は手入力で動作します。価格比較でYahoo!ショッピングの商品候補を取得する場合のみ設定。

| 変数 | 種別 | 用途 | 取得元 |
| --- | --- | --- | --- |
| `YAHOO_SHOPPING_APP_ID` | サーバー専用 | Yahoo!ショッピング商品検索API v3の呼び出し | [Yahoo!デベロッパーネットワーク](https://developer.yahoo.co.jp/webapi/shopping/v3/itemsearch.html) |
| `YAHOO_VC` | サーバー専用 | バリューコマース等の任意パラメータ付与 | 提携先の管理画面 |

- 注意: `YAHOO_SHOPPING_APP_ID` / `YAHOO_VC` には **絶対に `NEXT_PUBLIC_` を付けない**。
- TODO: Yahoo!ショッピングAPIの画像利用規約、アフィリエイト表記要件、掲載条件を公開前に確認する。

## 1.2 eBay Browse API（商品検索）※任意
未設定でも欲しいもの登録は手入力で動作します。価格比較でeBayの商品候補を取得する場合のみ設定。

| 変数 | 種別 | 用途 | 取得元 |
| --- | --- | --- | --- |
| `EBAY_CLIENT_ID` | サーバー専用 | Browse API OAuth2 client_credentials | [eBay Developers Program](https://developer.ebay.com/api-docs/buy/browse/resources/item_summary/methods/search) |
| `EBAY_CLIENT_SECRET` | サーバー専用 | Browse API OAuth2 client_credentials | eBay Developers Program |
| `EBAY_MARKETPLACE_ID` | サーバー専用 | 検索対象マーケットプレイス（例: `EBAY_US`, `EBAY_JP`） | eBay Developers Program |

- 注意: eBayのアクセストークンはサーバー側で取得し、クライアントへ渡さない。
- TODO: eBay Browse APIの画像利用規約、アフィリエイト表記要件、掲載条件を公開前に確認する。

## 1.3 為替API（外貨商品のJPY参考換算）※任意
eBayなど外貨建ての商品候補は、既定でFrankfurterの公開APIを使ってJPY参考値を表示します。未取得時は元通貨の参考値だけを表示し、アプリ全体は継続動作します。

| 変数 | 種別 | 用途 | 取得元 |
| --- | --- | --- | --- |
| `EXCHANGE_RATE_API_BASE` | サーバー専用 | 為替APIのベースURL。未指定時は `https://api.frankfurter.dev` | [Frankfurter v2 API](https://frankfurter.dev/) |

- FrankfurterはAPIキー不要で、`/v2/rate/{base}/{quote}` から取得したレートをアプリ側で換算します。
- TODO: 公開前にFrankfurterまたは代替為替APIの利用条件、商用利用条件、障害時表示方針を確認する。

## 2. Firebase（クラウド保存・匿名認証）※任意
6つ**すべて**設定されたときのみ Firestore 保存に切替わります（1つでも空なら LocalStorage 継続）。判定は `src/lib/firebase/client.ts` の `isFirebaseConfigured`。

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```
- 取得元: Firebase コンソール → プロジェクト設定 → 「ウェブアプリ」の構成値。
- これらは Web SDK の公開構成値（`NEXT_PUBLIC_` 前提）。**セキュリティは Firestore セキュリティルールで担保**してください。
- やること: Firebase プロジェクト作成 → Authentication で「匿名」を有効化 → Firestore 作成 → `firestore.rules` をレビュー・デプロイ。
- 管理者コンソールを使う場合: 下記「2.1 管理者コンソール `/admin` のセットアップ」を参照。

> 重要: Firestoreリポジトリは接続済みですが、**復旧コードの実処理・通知メール実配信は別PR（未実装）**です。Firebase キーを入れると保存先は切替わりますが、既存localStorageデータの自動移行は行いません。

### 2.1 管理者コンソール `/admin` のセットアップ
記事・セール日程・ECマスタを画面から管理する管理者コンソールです。**Firebase 設定が必須**で、未設定だと `/admin` はガードにより「Firebaseが未設定」と表示されて入れません（local-only モードでは管理画面は使えません）。手順:

1. **Cloud Firestore を有効化**: GCP コンソールで対象プロジェクトの **Cloud Firestore API を有効化**し、**Firestore データベースを作成**（ネイティブモード）。
   - 未有効だと記事取得や管理者照合が失敗します（ビルド時にも `Cloud Firestore API has not been used...` のエラーが出ます）。
2. **セキュリティルールをデプロイ**: リポジトリの `firestore.rules` をレビューのうえデプロイ（`firebase deploy --only firestore:rules` 等）。`admins/{uid}` の存在で管理者判定し、`articles/sales/merchants` の書込を管理者に限定します。
3. **管理者ユーザーを作成**: Authentication で「メール/パスワード」を有効化し、管理者ユーザー（メール＋パスワード）を作成。Authentication → Users で **その UID をコピー**。
4. **allowlist に登録**: Firestore に **`admins` コレクション → ドキュメントID = コピーした UID** を手動作成（中身は空でOK）。
   - ルール上クライアントからは書込不可のため、**必ず Firebase コンソール**で作成します。
5. **環境変数**: 「2. Firebase」の `NEXT_PUBLIC_FIREBASE_*` 6つを設定。
6. **サインイン**: `/admin/sign-in` にメール/パスワードでサインイン → 成功で `/admin` へ。Firestore が空のときはダッシュボードから「静的データを初期投入（シード）」を一度だけ実行できます。

補足:
- 管理者を増やす場合は手順3〜4を繰り返します（UID ごとに `admins/{uid}` を追加）。
- ECマスタは物理削除しません（参照切れ防止のため `isActive` 切替で無効化）。
- **商品フィードCSV検証画面** `/admin/import/products` は機能フラグ `ENABLE_CSV_IMPORT=true` のときのみ表示されます（保存はせず検証のみ。外部商品画像URLは許可しません）。
- 反映タイミング: 記事・セール日程・ECマスタの管理編集は公開画面へ反映されます。サーバー描画面（トップ/記事一覧・詳細/EC別カレンダー/セール詳細メタ/サイトマップ/楽天検索API）は **ISR（約5分間隔の再生成）**、クライアント描画面（カレンダー本体/セール詳細/通知設定）は表示時取得です。いずれも即時反映ではない場合があります（ISR間隔・キャッシュに依存）。
- 静的フォールバック: Firestore 未設定・未シード・一時障害時は、各公開画面はビルド同梱の静的データ（`src/data/*.ts`）で成立します。

## 3. サイト URL / お問い合わせ ※公開時に推奨
| 変数 | 用途 |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | OGP/メタデータ・robots・sitemap の絶対URL基準（既定 `http://localhost:3000`）。本番ドメインに変更 |
| `NEXT_PUBLIC_CONTACT_EMAIL` | お問い合わせページに表示する連絡先メール |

## 4. 機能フラグ（公開審査が済むまで空のまま）
```
ENABLE_ASP_FEED=
ENABLE_CSV_IMPORT=
NEXT_PUBLIC_ENABLE_PUBLIC_SHARE=
```

---

## 5. デプロイ前チェック
```bash
npm run lint
npm run test
npm run test:e2e
npm run build
```
- 表示確認: PC 約1200px / スマホ 約390px で各画面（トップ/カレンダー/セール詳細/欲しいもの登録・一覧/履歴/記事）を目視。
- `.env.local` と秘密情報がコミットされていないこと（`git status` で確認）。

## 6. GitHub への反映（このセッションで未実施）
このリポジトリは **git remote 未設定** かつ GitHub 認証情報がないため、push / PR 作成はオーナー側で実施が必要です。
```bash
# 例（<OWNER>/<REPO> は実際の値に置換）
git remote add origin https://github.com/<OWNER>/<REPO>.git
git push -u origin feat/v2.5-ui-remediation
# PR: 表示されるURL、または
#   https://github.com/<OWNER>/<REPO>/compare/main...feat/v2.5-ui-remediation?expand=1
```
- `gh` CLI を使う場合は `gh auth login` 後に `gh pr create`。

## 7. 別PD（今後の開発タスク。コードは未実装）
- LocalStorage から Firestore へのデータ移行
- 復旧コードによる実復旧処理
- 通知メールの実配信・配信失敗処理
