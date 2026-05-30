# UI reference screenshots

このディレクトリは、Codex/ClaudeがUI再現・レビューで参照する添付画像置き場です。
Next.jsのアプリ画面から直接配信しません。アプリ固有の静的画像には public/images/placeholders/ の自作プレースホルダーのみ使います。

必須ファイル:
- 01_home_responsive.png
- 02_sale_calendar_responsive.png
- 03_sale_detail_rakuten_super_sale_responsive.png
- 04_wishlist_new_form_responsive.png
- 05_wishlist_list_responsive.png
- 06_history_responsive.png
- 07_article_monthly_sale_strategy_responsive.png

配置ルール:
- UIレビュー専用の非公開アセットとして扱い、`public/` にコピーしない。
- ファイル名は上記のまま固定し、画面差分がある場合は docs 側で履歴を説明する。
- 添付画像や実在の商品画像、企業ロゴ画像を `public/` にコピーしない。
- v1〜v1.2 の商品画像は `public/images/placeholders/` の自作SVG/PNGのみとする。
- v2以降で楽天公式API由来の商品画像URLを表示する場合は、出典を明記し、任意URL入力やスクレイピング取得を行わない。

画面別レビュー観点:
- `01_home_responsive.png`: 大きな青見出し、青/オレンジCTA、注目セール、記事カード、広告枠、スマホ下部ナビ。
- `02_sale_calendar_responsive.png`: PCの右側選択日パネル、スマホのボトムシート、2件表示と `+n`。
- `03_sale_detail_rakuten_super_sale_responsive.png`: 概要、攻略メモ、関連商品、関連記事、広告枠、公式サイトCTA、Xシェア、履歴保存。
- `04_wishlist_new_form_responsive.png`: PC 2カラム、スマホ縦積み、商品画像プレースホルダー、詳細入力折りたたみ、固定保存ボタン。
- `05_wishlist_list_responsive.png`: 横長カード/スマホカード、希望価格、前回メモ、最終確認日、関連セール、外部リンクボタン。
- `06_history_responsive.png`: セール/記事タブ、全削除、個別削除、再訪ボタン。
- `07_article_monthly_sale_strategy_responsive.png`: 目次、ヒーロー、早見表、本文中広告、サイドバー、関連記事、スマホ固定シェアバー。

企業ロゴは使わず、ECの識別が必要な場合はテキストバッジで表現する。
