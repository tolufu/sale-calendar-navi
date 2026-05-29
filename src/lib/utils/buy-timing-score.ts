export type SaleImportance = "low" | "medium" | "high";

export type BuyTimingScoreInput = {
  desiredPrice: number | null;
  currentEffectivePrice: number | null;
  saleImportance: SaleImportance;
  previousEffectivePrice: number | null;
  checkedAt: string | null;
};

export type BuyTimingScoreResult =
  | {
      status: "scored";
      score: number;
      label: "買い時かも" | "条件確認";
      reasons: string[];
    }
  | {
      status: "insufficient_data";
      score: null;
      label: "データ不足";
      reasons: string[];
    };

function isValidAmount(value: number | null): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function saleImportanceBonus(value: SaleImportance): number {
  if (value === "high") return 12;
  if (value === "medium") return 6;
  return 0;
}

function checkedAtPenalty(checkedAt: string | null): number {
  if (!checkedAt) return 8;
  const checkedTime = new Date(checkedAt).getTime();
  if (!Number.isFinite(checkedTime)) return 8;

  const days = (Date.now() - checkedTime) / (1000 * 60 * 60 * 24);
  if (days > 30) return 10;
  if (days > 14) return 5;
  return 0;
}

export function calculateBuyTimingScore(input: BuyTimingScoreInput): BuyTimingScoreResult {
  const reasons: string[] = [];

  if (!isValidAmount(input.desiredPrice)) {
    reasons.push("希望価格が未入力です。");
  }
  if (!isValidAmount(input.currentEffectivePrice)) {
    reasons.push("現在または候補の実質価格が未入力です。");
  }

  if (reasons.length > 0) {
    return {
      status: "insufficient_data",
      score: null,
      label: "データ不足",
      reasons
    };
  }

  let score = 45;
  const desiredPrice = input.desiredPrice;
  const currentEffectivePrice = input.currentEffectivePrice;
  if (!isValidAmount(desiredPrice) || !isValidAmount(currentEffectivePrice)) {
    return {
      status: "insufficient_data",
      score: null,
      label: "データ不足",
      reasons
    };
  }
  const targetGap = (desiredPrice - currentEffectivePrice) / Math.max(desiredPrice, 1);

  if (targetGap >= 0) {
    score += Math.min(35, 20 + targetGap * 100);
    reasons.push("希望価格に近い、または希望価格内です。");
  } else {
    score += Math.max(-30, targetGap * 80);
    reasons.push("希望価格との差を確認してください。");
  }

  if (isValidAmount(input.previousEffectivePrice)) {
    const previousGap = (input.previousEffectivePrice - currentEffectivePrice) / Math.max(input.previousEffectivePrice, 1);
    if (previousGap > 0) {
      score += Math.min(18, previousGap * 80);
      reasons.push("前回確認価格より下がっています。");
    } else if (previousGap < -0.03) {
      score -= 8;
      reasons.push("前回確認価格より上がっています。");
    }
  } else {
    reasons.push("前回確認価格は未入力です。");
  }

  score += saleImportanceBonus(input.saleImportance);
  if (input.saleImportance === "high") {
    reasons.push("関連セールの重要度を高めに見ています。");
  }

  const freshnessPenalty = checkedAtPenalty(input.checkedAt);
  score -= freshnessPenalty;
  if (freshnessPenalty > 0) {
    reasons.push("確認日が古い可能性があります。");
  }

  const normalizedScore = clampScore(score);

  return {
    status: "scored",
    score: normalizedScore,
    label: normalizedScore >= 70 ? "買い時かも" : "条件確認",
    reasons
  };
}
