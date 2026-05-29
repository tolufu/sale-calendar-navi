import type { SaleEvent } from "@/lib/repositories/types";

export const saleEvents: SaleEvent[] = [
  {
    id: "rakuten-super-sale-2026-06",
    merchantId: "rakuten",
    title: "楽天スーパーSALE メモ",
    saleType: "大型セール",
    startAt: "2026-06-04T20:00:00+09:00",
    endAt: "2026-06-11T01:59:00+09:00",
    description: "買い回りやポイント施策を確認しながら、事前に欲しいものを整理するための予定です。",
    sourceUrl: "https://www.rakuten.co.jp/",
    strategyMemo: "買い回り条件、クーポン、ポイント上限を事前にメモして、実質価格はユーザー自身の計算で確認します。",
    relatedSaleEventIds: ["rakuten-point-day-2026-06-05"]
  },
  {
    id: "amazon-summer-sale-2026-06",
    merchantId: "amazon",
    title: "Amazon セール予定メモ",
    saleType: "季節セール",
    startAt: "2026-06-01T00:00:00+09:00",
    endAt: "2026-06-07T23:59:00+09:00",
    description: "購入候補のURLと希望価格を手入力で控えておくための予定です。",
    sourceUrl: "https://www.amazon.co.jp/",
    strategyMemo: "候補商品の希望価格と前回チェック時のメモを見比べ、必要なものだけを確認します。",
    relatedSaleEventIds: ["amazon-weekend-2026-06-05"]
  },
  {
    id: "rakuten-point-day-2026-06-05",
    merchantId: "rakuten",
    title: "楽天 ポイント施策メモ",
    saleType: "ポイント施策",
    startAt: "2026-06-05T00:00:00+09:00",
    endAt: "2026-06-05T23:59:00+09:00",
    description: "実質価格メモを見直すための予定です。",
    sourceUrl: "https://www.rakuten.co.jp/",
    strategyMemo: "ポイント施策は条件が変わるため、公式サイトで最新条件を確認してからメモを更新します。",
    relatedSaleEventIds: ["rakuten-super-sale-2026-06"]
  },
  {
    id: "amazon-weekend-2026-06-05",
    merchantId: "amazon",
    title: "Amazon 週末セールメモ",
    saleType: "短期セール",
    startAt: "2026-06-05T09:00:00+09:00",
    endAt: "2026-06-08T23:59:00+09:00",
    description: "同日複数セール表示の確認を兼ねた開発用予定です。",
    sourceUrl: "https://www.amazon.co.jp/",
    strategyMemo: "急いで買わず、欲しいもの一覧の希望価格と実質価格メモを見て判断します。",
    relatedSaleEventIds: ["amazon-summer-sale-2026-06"]
  },
  {
    id: "rakuten-book-day-2026-06-05",
    merchantId: "rakuten",
    title: "楽天 ブックス系メモ",
    saleType: "カテゴリ施策",
    startAt: "2026-06-05T10:00:00+09:00",
    endAt: "2026-06-05T23:59:00+09:00",
    description: "同日に3件以上ある場合のカレンダー表示確認用の予定です。",
    sourceUrl: "https://books.rakuten.co.jp/",
    strategyMemo: "対象カテゴリや条件は公式サイトで確認し、必要な商品だけメモします。",
    relatedSaleEventIds: ["rakuten-point-day-2026-06-05"]
  }
];
