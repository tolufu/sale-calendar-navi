import type { Merchant, WishItem } from "@/lib/repositories/types";
import type { PublicShareItem, PublicShareSetting, PublicShareSnapshot } from "@/lib/public-share/types";

function sanitizePublicText(value: string): string {
  return value
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\b(?:anon|anonymous|user)[_-]?[a-z0-9_-]+\b/gi, "")
    .replace(/非公開メモ/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function createDefaultPublicShareSetting(): PublicShareSetting {
  return {
    enabled: false,
    expiresAt: null
  };
}

export function toPublicShareItem(item: WishItem, merchants: Merchant[]): PublicShareItem {
  const merchant = merchants.find((entry) => entry.merchantId === item.merchantId);
  return {
    title: sanitizePublicText(item.title),
    merchantName: merchant?.name ?? "その他EC",
    desiredPrice: item.desiredPrice,
    placeholderImageType: merchant?.placeholderImageType ?? "generic"
  };
}

export function createPublicShareSnapshot(
  setting: PublicShareSetting,
  items: WishItem[],
  merchants: Merchant[],
  shareId: string,
  createdAt = new Date().toISOString()
): PublicShareSnapshot | null {
  if (!setting.enabled) {
    return null;
  }

  return {
    shareId,
    createdAt,
    expiresAt: setting.expiresAt,
    revoked: false,
    items: items.map((item) => toPublicShareItem(item, merchants))
  };
}
