# Codex 用プロンプト: v3.5 価格比較（公式APIマルチEC比較）

以下を Codex へ貼り付けて使用する。設計・レビューは Claude、実装は Codex が担当する。

---

```text
あなたは熟練したフルスタックエンジニアです。Next.js App Router + TypeScript + Tailwind の
既存プロジェクト「セールカレンダー比較ナビ」に、複数ECの公式APIを使った価格比較機能を実装します。

対象リポジトリ:
~/dev/workspaces/personal/sale-calendar-navi
（WSL2 Linux側で作業。/mnt/c や /mnt/d では作業しない）

## 0. 着手前に必ず実行・確認

- 最初に AGENTS.md と CLAUDE.md を読み、必ず日本語で報告する。
- 着手時に以下を実行して状態を報告する。
  pwd
  git status --short
  git branch --show-current
  node -v
  npm -v
- 作業用ブランチを切る（例: feat/price-comparison）。main では直接作業しない。
- 既存ファイルの無断全面上書き・rm -rf・git reset --hard・強制push は禁止。
- 報告の最後に必ず「変更ファイル / 実行コマンド / 確認結果 / 未対応・次にやること」をまとめる。

## 1. 守るべきポリシー（厳守）

- **スクレイピング禁止**。価格・在庫・画像・レビューをスクレイピングで取得しない。
  価格取得は「各ECの公式API」または「手入力」のみ。HTMLパースによる価格取得は不可。
- **「最安値」「最安保証」等の断定・保証表現を使わない**。比較結果は
  「取得時点の参考値」であることを明示し、「最安」ではなく「安い順」「参考価格」等で表現する。
- **公式サービスと誤認されるロゴ・表現を使わない**。EC名はテキスト表記に留める。
- **秘密情報をコミットしない**。各APIキーは .env.local に置き、.env.local.example のみ更新する。
- **ECは enum固定にしない**。merchantId + merchants マスタで管理する。EC追加がマスタ追加と
  Provider追加だけで済む構造を維持する（既存の ProductSearchProvider 抽象を踏襲）。
- **Firebase/各API未設定でも動く**こと。未設定時はモック候補またはエラー状態を返し、UIは
  loading / empty / error / success の4状態を持つ（既存の Skeleton/EmptyState/ErrorState/Toast を使う）。

## 2. 画像ポリシーの更新（オーナー承認済み）

現行 CLAUDE.md / AGENTS.md の画像ポリシーは「画像表示は楽天APIのみ許可」だが、
今回オーナー判断で **各公式API（楽天 / Yahoo!ショッピング / eBay）が返した画像URLを、
出典を明記して表示可** に拡張する。実装に合わせて次を行う。

- CLAUDE.md と AGENTS.md の「商品画像ポリシー」節を、次の趣旨に更新する:
  「v2以降は、各ECの公式APIが返した画像URLに限り、出典（例: 画像出典: Yahoo!ショッピングAPI）を
   明記して表示できる。ユーザー任意の画像URL入力やスクレイピングによる画像取得・表示は引き続き禁止。」
- 画像URLは各APIごとに許可ホストをホワイトリスト化して検証する（既存 rakuten-image.ts の
  sanitize/isAllowed パターンを踏襲し、yahoo / ebay 用のホスト許可関数を追加）。許可外ホストは表示しない。
- ProductImageSource 型に "yahoo_api" / "ebay_api" を追加する（既存の "placeholder" / "rakuten_api" に追加）。
- 各社の画像利用規約・表記要件は実装時点で未確認の前提で、docs/owner-setup-todo.md に
  「Yahoo / eBay の画像・APIの利用規約確認とアフィリエイト表記要件の確認」をTODOとして追記する。

## 3. 実装スコープ（今回の対象API）

ライブで公式APIを叩いて価格取得まで作るのは **楽天（拡張）/ Yahoo!ショッピング / eBay Browse** の3つ。
**Amazon は今回は現状どおりスタブ（手入力）のまま**にする（PA-APIはアカウントの売上条件を満たさないと
利用できないため、キー発行できない前提）。Amazon は比較対象として「手入力で追加」できる導線のみ維持する。

### 3-1. Provider 抽象の拡張

- 既存の src/lib/providers/types.ts の ProductSearchProvider 抽象をそのまま使う。
- src/lib/product-search/ に各Providerを追加:
  - rakuten.ts（既存・必要なら送料/ポイント関連フィールドの取り込みを拡張）
  - yahoo.ts（新規: Yahoo!ショッピング商品検索API v3）
  - ebay.ts（新規: eBay Browse API item_summary/search）
  - amazon.ts（既存スタブのまま）
- ProductSearchCandidate 型（src/lib/product-search/types.ts）を比較に必要な項目へ拡張する:
  既存の price / shopName / imageUrl / imageSource に加え、可能な範囲で
  shippingFee（送料、不明は null）, points（付与ポイント, 不明は null）, currency（"JPY" 等）,
  inStock（在庫有無, 不明は null）を追加。取得できない値は必ず null とし、UI側で「-」表示する。
- 各Providerは API未設定時に { configured: false, candidates: [], message } を返し、
  既存 rakuten.ts の mockSearch / 失敗時 message パターンに揃える。失敗時も例外を投げず result で返す。

### 3-2. 各APIの実装メモ

- 楽天: 既存実装（openapi.rakuten.co.jp / applicationId + accessKey + affiliateId、
  Origin/Referer が登録ドメイン一致必須）を維持。送料区分(postageFlag)やポイント情報(pointRate等)が
  取れる範囲で candidate に反映。新ドメイン/accessKey 必須仕様を壊さない。
- Yahoo!ショッピング: ItemSearch API（appid 必須）。env: YAHOO_SHOPPING_APP_ID。
  通貨はJPY。アフィリエイト(VC)パラメータは env: YAHOO_VC（任意）として付与可能にする。
- eBay Browse API: OAuth2 client_credentials でアクセストークン取得（env: EBAY_CLIENT_ID /
  EBAY_CLIENT_SECRET、必要なら EBAY_MARKETPLACE_ID 例 EBAY_JP/EBAY_US）。トークンはサーバー側で
  取得・短期キャッシュし、クライアントへ秘密を渡さない。価格は元通貨（USD等）を currency 付きで保持。
  日本円換算が必要なら換算は「参考」と明記し、固定レートや為替APIは今回スコープ外（元通貨表示＋注記でよい）。
- いずれも fetch は AbortController でタイムアウト（既存の SEARCH_TIMEOUT_MS パターン）を入れる。

### 3-3. API ルート（サーバー経由）

- 既存 src/app/api/products/rakuten/search/route.ts を踏襲し、各ECの検索を1本に集約した
  src/app/api/products/compare/route.ts（GET ?q=...&merchants=rakuten,yahoo,ebay）を新設するか、
  または ec ごとのルートを並列で叩く構成にする（どちらでもよいが、APIキーは必ずサーバー側のみで使用）。
- 各Providerは merchants マスタの supportsApi / supportsPriceAutoFetch と
  既存 searchMerchantProducts(assertMerchantSupportsAutoFetch) ガードを通す。
- 1ECの失敗が全体を落とさないよう、Provider単位で success/failure を返し、UIで部分表示できるようにする。

## 4. merchants マスタの更新

src/data/merchants.ts を更新:
- yahoo-shopping: supportsApi=true, supportsPriceAutoFetch=true, integrationStatus="available" に更新
  （placeholderImageType 等は既存を尊重）。
- ebay: 新規エントリを追加（merchantId="ebay", name="eBay", type="marketplace",
  urlHosts=["ebay.com","ebay.co.jp"], supportsApi=true, supportsPriceAutoFetch=true,
  integrationStatus="available", colorToken/placeholderKey は既存トークンから無難なものを割当, sortOrder を採番）。
- amazon: 変更しない（現状の manual-only / supportsApi=false を維持）。
- 既存の getMerchantCapabilities / getMerchantIntegrationLabel が新マスタ値で正しく動くか確認し、
  必要なら capabilities.test.ts を更新する。

## 5. 価格比較ページ（独立ページ）

- ルート: src/app/compare/page.tsx（クライアント側で検索フォーム＋結果表示。RSCで枠、検索はClient）。
- 機能:
  - キーワード（または商品URL）入力 → /api/products/compare を呼び出し、対象EC（楽天/Yahoo/eBay、
    既定はマスタの supportsPriceAutoFetch=true のEC）から候補を取得して一覧表示。
  - 各候補カードに: EC名, 商品名, 画像（出典明記。許可ホストのみ）, 取得価格(currency付き),
    送料（不明は「-」）, 付与ポイント（不明は「-」）, **実質価格**（既存 calculateEffectivePrice を使用。
    商品価格＋送料−クーポン−ポイント×換算率）, 店舗名, 商品リンク（アフィリエイトURLがあれば優先）。
  - 並び替え: 「実質価格が安い順」をデフォルトに、価格未取得は末尾。
    見出しは「安い順」等とし、「最安値」表記は使わない。各価格に「取得時点の参考値」注記を必ず付ける。
  - 各候補に「欲しいものに追加」ボタンを置き、選んだ候補を querystring などで /wishlist/new に渡して
    フォームへ事前反映できるようにする（タイトル/URL/merchantId/価格/送料/ポイント/画像URL・出典）。
  - loading/empty/error/success の4状態を必ず実装。EC単位の失敗は部分エラー表示にする。
- ヘッダー/フッター/モバイルナビに「価格比較」導線を追加（既存 SiteHeader / SiteFooter / ナビに合わせる）。
- sitemap.ts に /compare を追加。

## 6. 欲しいもの登録フォームへの反映

src/features/wishlist/WishlistForm.tsx（既存の楽天候補検索UIがある）を拡張:
- 既存の「楽天商品補完」検索を、対象EC（楽天/Yahoo/eBay）を横断する候補検索に拡張する
  （既存の applyRakutenCandidate / candidate 反映フローを踏襲）。
- 候補を「反映」したとき、取得できた範囲で次を入力欄へ反映する:
  - title, productUrl(またはaffiliateUrl), merchantId
  - 価格内訳: productPrice, shippingFee(送料), grantedPoints(付与ポイント)。
    pointRate は既存どおり手入力（既定1）を尊重し、ポイント率がAPIから取れる場合のみ補助反映。
  - 画像: imageSource（rakuten_api/yahoo_api/ebay_api）と imageUrl。許可ホスト検証を通す。
- 反映後も全項目を手で修正可能にし、「APIの取得値は参考。保存前に確認してください」旨の注記を出す
  （既存の Toast 文言パターンに合わせる）。
- 比較ページから ?title=...&merchantId=...&price=... 等で遷移してきた場合に初期値を反映する
  （既存の useSearchParams による merchantId/saleId 反映と同じ要領）。
- 既存の「比較候補（手入力）」機能・参考リンク・実質価格内訳・楽天画像プレビューは壊さない。

## 7. 環境変数

.env.local.example に追記（値はダミー/空、実キーはコミットしない）:
- RAKUTEN_APPLICATION_ID / RAKUTEN_ACCESS_KEY / RAKUTEN_AFFILIATE_ID（既存があれば維持）
- YAHOO_SHOPPING_APP_ID / YAHOO_VC（任意）
- EBAY_CLIENT_ID / EBAY_CLIENT_SECRET / EBAY_MARKETPLACE_ID（任意, 既定値を注記）
docs/owner-setup-todo.md に、各キーの取得手順リンクと、Yahoo/eBay の規約・アフィリエイト表記確認TODOを追記。

## 8. テスト・品質確認

- 単体テスト（vitest）:
  - 各Providerの正常応答パース / 未設定時のモック / 失敗時の message 返却 / 許可外画像ホストの除外。
    fetch はモックし、実APIは叩かない。
  - ProductSearchCandidate 拡張に伴う型・既存 product-search.test.ts の更新。
  - 比較の並び替え（実質価格 安い順、null末尾）ロジックを純関数に切り出して単体テスト。
  - merchants 更新に伴う capabilities.test.ts の更新。
- 実行して結果を報告: npm run lint / npm run test / npm run build。失敗は原因と対処を記録する。
- 可能なら e2e（playwright）に /compare の最低限の表示確認を1本追加（既存 e2e 構成に合わせる、任意）。

## 9. 完了報告

最後に必ず次をまとめる:
- 変更ファイル一覧
- 実行コマンドと結果（lint/test/build）
- 確認結果（4状態の動作、未設定時フォールバック、画像出典表示、断定表現なしの確認）
- 未対応・次にやること（Amazon PA-API対応、為替換算、各社規約確認、アフィリエイト表記 等）

## やってはいけないこと（再掲）

- スクレイピングや HTMLパースでの価格・画像取得。
- 任意の画像URL入力欄の追加、許可外ホスト画像の表示。
- 「最安値」「最安保証」等の断定・保証表現、公式ロゴの使用。
- APIキーのクライアント露出、.env.local や秘密情報のコミット。
- 既存機能（カレンダー / 履歴 / 通知設定 / 楽天画像ポリシー / LocalStorageフォールバック / 管理者コンソール）の破壊。
```

---

## 補足（Claude → オーナー向けメモ。Codexには貼らない）

- Amazon は PA-API の売上条件があるため今回スタブ維持。条件達成後に別PRで Provider 実装する。
- eBay は元通貨（USD等）取得が基本。日本円換算は「参考」注記に留め、為替APIは次フェーズ。
- 画像ポリシー拡張は CLAUDE.md / AGENTS.md の文言更新を伴うため、Codex 実装後に Claude でレビューする。
- 「最安値」表現の不使用は景表法・各ECガイドラインの観点から重要。レビュー時に文言を重点確認する。
