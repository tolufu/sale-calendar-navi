# UI reference screenshots

このディレクトリは、Codex/ClaudeがUI再現・レビューで参照する添付画像置き場です。
Next.jsのアプリ画面から直接配信しません。アプリで表示する画像は public/images/placeholders/ の自作プレースホルダーのみ使います。

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
- アプリで使う商品画像は `public/images/placeholders/` の自作SVG/PNGのみとする。
