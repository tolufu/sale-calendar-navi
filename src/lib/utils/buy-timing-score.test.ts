import { describe, expect, it } from "vitest";
import { calculateBuyTimingScore } from "@/lib/utils/buy-timing-score";

describe("calculateBuyTimingScore", () => {
  it("希望価格または実質価格が不足している場合はデータ不足を返す", () => {
    const result = calculateBuyTimingScore({
      desiredPrice: null,
      currentEffectivePrice: 9000,
      saleImportance: "medium",
      previousEffectivePrice: null,
      checkedAt: new Date().toISOString()
    });

    expect(result).toMatchObject({
      status: "insufficient_data",
      score: null,
      label: "データ不足"
    });
  });

  it("希望価格内で前回より下がっている場合は控えめな買い時表示を返す", () => {
    const result = calculateBuyTimingScore({
      desiredPrice: 10000,
      currentEffectivePrice: 9200,
      saleImportance: "high",
      previousEffectivePrice: 11000,
      checkedAt: new Date().toISOString()
    });

    expect(result.status).toBe("scored");
    if (result.status === "scored") {
      expect(result.score).toBeGreaterThanOrEqual(70);
      expect(result.label).toBe("買い時かも");
    }
  });

  it("希望価格を上回る場合は条件確認を返す", () => {
    const result = calculateBuyTimingScore({
      desiredPrice: 10000,
      currentEffectivePrice: 13000,
      saleImportance: "low",
      previousEffectivePrice: null,
      checkedAt: new Date().toISOString()
    });

    expect(result.status).toBe("scored");
    if (result.status === "scored") {
      expect(result.label).toBe("条件確認");
      expect(result.score).toBeLessThan(70);
    }
  });
});
