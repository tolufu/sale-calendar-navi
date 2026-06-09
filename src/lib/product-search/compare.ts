import type { ProductSearchCandidate, ProductSearchProviderResult } from "@/lib/product-search/types";
import type { PriceBreakdown } from "@/lib/repositories/types";
import { calculateEffectivePrice } from "@/lib/utils/price";

export type ComparableProductCandidate = ProductSearchCandidate & {
  effectivePrice: number | null;
  effectivePriceJpy: number | null;
};

export function candidatePriceBreakdown(candidate: ProductSearchCandidate): PriceBreakdown {
  return {
    productPrice: candidate.price,
    shippingFee: candidate.shippingFee,
    couponDiscount: null,
    grantedPoints: candidate.points,
    pointRate: 1
  };
}

export function candidateJpyPriceBreakdown(candidate: ProductSearchCandidate): PriceBreakdown {
  return {
    productPrice: candidate.currency === "JPY" ? candidate.price : candidate.priceJpy ?? null,
    shippingFee: candidate.currency === "JPY" ? candidate.shippingFee : candidate.shippingFeeJpy ?? null,
    couponDiscount: null,
    grantedPoints: candidate.currency === "JPY" ? candidate.points : null,
    pointRate: 1
  };
}

export function candidateEffectivePrice(candidate: ProductSearchCandidate): number | null {
  return calculateEffectivePrice(candidatePriceBreakdown(candidate));
}

export function candidateEffectivePriceJpy(candidate: ProductSearchCandidate): number | null {
  return calculateEffectivePrice(candidateJpyPriceBreakdown(candidate));
}

export function sortCandidatesByEffectivePrice(candidates: ProductSearchCandidate[]): ComparableProductCandidate[] {
  return candidates
    .map((candidate) => ({
      ...candidate,
      effectivePrice: candidateEffectivePrice(candidate),
      effectivePriceJpy: candidateEffectivePriceJpy(candidate)
    }))
    .sort((a, b) => {
      if (a.effectivePriceJpy === null && b.effectivePriceJpy === null) return a.title.localeCompare(b.title, "ja");
      if (a.effectivePriceJpy === null) return 1;
      if (b.effectivePriceJpy === null) return -1;
      return a.effectivePriceJpy - b.effectivePriceJpy;
    });
}

export function flattenProviderResults(results: ProductSearchProviderResult[]): ProductSearchCandidate[] {
  return results.flatMap((result) => result.candidates);
}
