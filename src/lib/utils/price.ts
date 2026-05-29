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

export function calculateEffectivePrice(basePrice: number, discount = 0, pointValue = 0): number {
  return Math.max(0, basePrice - discount - pointValue);
}
