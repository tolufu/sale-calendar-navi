# オーナー作業 TODO（APIキー設定・公開準備）

最終更新: 2026-06-01

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
- やること: Firebase プロジェクト作成 → Authentication で「匿名」を有効化 → Firestore 作成 → セキュリティルール設定。

> 重要: 現状の Firestore リポジトリ実装・**復旧コードの実処理・通知メール実配信は別PR（未実装）**です。本UI修正では復旧コード画面は「クラウド保存対応後に利用可能」と明示する導線のみです。Firebase キーを入れると保存先は切替わりますが、復旧・通知の実機能は別PR完了まで動きません。

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
- Firestore の実保存・同期・LocalStorage からの移行
- 復旧コードによる実復旧処理
- 通知メールの実配信・配信失敗処理
