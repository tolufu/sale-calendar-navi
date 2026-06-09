import type { PriceBreakdown, PriceCandidate } from "@/lib/repositories/types";

export function formatPrice(value: number | null): string {
  if (value === null) {
    return "未設定";
  }

  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0
  }).format(value);
}

function normalizeAmount(value: number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("価格内訳には0以上の数値を入力してください。");
  }
  return value;
}

export function calculateEffectivePrice(input: PriceBreakdown): number | null;
export function calculateEffectivePrice(basePrice: number, discount?: number, pointValue?: number): number;
export function calculateEffectivePrice(
  inputOrBasePrice: PriceBreakdown | number,
  discount = 0,
  pointValue = 0
): number | null {
  if (typeof inputOrBasePrice === "number") {
    if (!Number.isFinite(inputOrBasePrice) || inputOrBasePrice < 0 || discount < 0 || pointValue < 0) {
      throw new Error("価格には0以上の数値を入力してください。");
    }
    return Math.max(0, inputOrBasePrice - discount - pointValue);
  }

  if (inputOrBasePrice.productPrice === null || inputOrBasePrice.productPrice === undefined) {
    return null;
  }

  const productPrice = normalizeAmount(inputOrBasePrice.productPrice);
  const shippingFee = normalizeAmount(inputOrBasePrice.shippingFee);
  const couponDiscount = normalizeAmount(inputOrBasePrice.couponDiscount);
  const grantedPoints = normalizeAmount(inputOrBasePrice.grantedPoints);
  const pointRate = inputOrBasePrice.pointRate ?? 1;

  if (!Number.isFinite(pointRate) || pointRate < 0) {
    throw new Error("ポイント換算率には0以上の数値を入力してください。");
  }

  return Math.max(0, Math.round(productPrice + shippingFee - couponDiscount - grantedPoints * pointRate));
}

export const computeEffectivePrice = calculateEffectivePrice;

export function pickCandidateEffectivePrice(candidate: PriceCandidate): number | null {
  // 保存済み・外部由来の内訳に不正値が混ざっても描画を止めないよう、未計算(null)に倒す。
  try {
    return calculateEffectivePrice(candidate.breakdown);
  } catch {
    return null;
  }
}

export function pickEffectivePriceDiff(candidates: PriceCandidate[]): {
  lowerMerchantId: string;
  higherMerchantId: string;
  amount: number;
} | null {
  const comparable = candidates
    .map((candidate) => ({
      merchantId: candidate.merchantId,
      price: pickCandidateEffectivePrice(candidate)
    }))
    .filter((candidate): candidate is { merchantId: string; price: number } => candidate.price !== null);

  const uniqueMerchants = new Set(comparable.map((candidate) => candidate.merchantId));
  if (comparable.length < 2 || uniqueMerchants.size < 2) {
    return null;
  }

  const sorted = [...comparable].sort((a, b) => a.price - b.price);
  const amount = sorted[sorted.length - 1].price - sorted[0].price;
  if (amount <= 0) {
    return null;
  }

  return {
    lowerMerchantId: sorted[0].merchantId,
    higherMerchantId: sorted[sorted.length - 1].merchantId,
    amount
  };
}
