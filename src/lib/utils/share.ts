import type { SaleEvent, WishItem } from "@/lib/repositories/types";

function clean(value: string): string {
  return value
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\b(?:anon|anonymous|user)[_-]?[a-z0-9_-]+\b/gi, "")
    .replace(/非公開メモ/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildSaleShareText(sale: Pick<SaleEvent, "title" | "startAt">): string {
  const startDate = new Date(sale.startAt).toLocaleDateString("ja-JP");
  return `${clean(sale.title)}を買い物メモで確認中。開始予定: ${startDate} #セールカレンダー比較ナビ`;
}

export function buildCompareShareText(item: Pick<WishItem, "title" | "desiredPrice">, effectivePrice: number | null): string {
  const parts = [`${clean(item.title)}の買い時メモを見直しました。`];
  if (item.desiredPrice !== null) {
    parts.push(`希望価格: ${item.desiredPrice.toLocaleString("ja-JP")}円`);
  }
  if (effectivePrice !== null) {
    parts.push(`手入力の実質価格メモ: ${effectivePrice.toLocaleString("ja-JP")}円`);
  }
  parts.push("#セールカレンダー比較ナビ");
  return parts.join(" ");
}

export function buildXIntentUrl(text: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}
