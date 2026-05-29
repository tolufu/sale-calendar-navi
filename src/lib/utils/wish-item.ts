import type {
  PriceBreakdown,
  PriceCandidate,
  ReferenceLink,
  ReferenceLinkKind,
  WishItem,
  WishItemInput
} from "@/lib/repositories/types";
import { WISH_ITEM_SCHEMA_VERSION } from "@/lib/repositories/types";

export const emptyPriceBreakdown: PriceBreakdown = {
  productPrice: null,
  shippingFee: null,
  couponDiscount: null,
  grantedPoints: null,
  pointRate: null
};

function toNumberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

export function normalizePriceBreakdown(value: Partial<PriceBreakdown> | null | undefined): PriceBreakdown {
  return {
    productPrice: toNumberOrNull(value?.productPrice),
    shippingFee: toNumberOrNull(value?.shippingFee),
    couponDiscount: toNumberOrNull(value?.couponDiscount),
    grantedPoints: toNumberOrNull(value?.grantedPoints),
    pointRate: toNumberOrNull(value?.pointRate)
  };
}

function normalizeCandidate(candidate: Partial<PriceCandidate>, fallback: WishItem | WishItemInput): PriceCandidate {
  const imageSource = candidate.imageSource === "rakuten_api" && candidate.imageUrl ? "rakuten_api" : "placeholder";

  return {
    merchantId: candidate.merchantId || fallback.merchantId,
    originalUrl: candidate.originalUrl || fallback.productUrl,
    affiliateUrl: candidate.affiliateUrl || null,
    breakdown: normalizePriceBreakdown(candidate.breakdown),
    priceMemo: candidate.priceMemo ?? fallback.actualPriceMemo ?? null,
    lastCheckedAt: candidate.lastCheckedAt ?? null,
    imageSource,
    imageUrl: imageSource === "rakuten_api" ? candidate.imageUrl ?? null : null
  };
}

function normalizeReferenceLink(link: Partial<ReferenceLink>): ReferenceLink | null {
  const kind: ReferenceLinkKind = link.kind === "kakaku" || link.kind === "maker" ? link.kind : "other";
  const label = typeof link.label === "string" ? link.label.trim().slice(0, 40) : "";
  const url = typeof link.url === "string" ? link.url.trim() : "";

  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol) || !label) {
      return null;
    }
    return {
      id: link.id || crypto.randomUUID(),
      kind,
      label,
      url: parsed.toString()
    };
  } catch {
    return null;
  }
}

function pickLatestDate(candidates: PriceCandidate[]): string | null {
  const timestamps = candidates
    .map((candidate) => candidate.lastCheckedAt)
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).getTime())
    .filter(Number.isFinite);

  if (timestamps.length === 0) {
    return null;
  }

  return new Date(Math.max(...timestamps)).toISOString();
}

export function syncWishItemMirrors<T extends WishItem | WishItemInput>(item: T): T {
  const fallbackCandidate: PriceCandidate = {
    merchantId: item.merchantId,
    originalUrl: item.productUrl,
    affiliateUrl: null,
    breakdown: { ...emptyPriceBreakdown },
    priceMemo: item.actualPriceMemo ?? null,
    lastCheckedAt: item.lastCheckedAt ?? null,
    imageSource: "placeholder"
  };
  const candidates = (item.candidates?.length ? item.candidates : [fallbackCandidate]).map((candidate) =>
    normalizeCandidate(candidate, item)
  );
  const primary = candidates[0];

  return {
    ...item,
    merchantId: primary.merchantId,
    productUrl: primary.affiliateUrl ?? primary.originalUrl,
    actualPriceMemo: primary.priceMemo,
    schemaVersion: WISH_ITEM_SCHEMA_VERSION,
    candidates,
    referenceLinks: (item.referenceLinks ?? []).map(normalizeReferenceLink).filter((link): link is ReferenceLink => link !== null),
    lastCheckedAt: pickLatestDate(candidates)
  };
}

export function migrateWishItem(raw: WishItem): WishItem {
  const item: WishItem = {
    ...raw,
    desiredPrice: toNumberOrNull(raw.desiredPrice),
    actualPriceMemo: raw.actualPriceMemo ?? null,
    targetSaleEventId: raw.targetSaleEventId ?? null,
    note: raw.note ?? null
  };

  return syncWishItemMirrors(item);
}
