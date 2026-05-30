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

  it("scoreが70の場合は買い時かもを返す", () => {
    const result = calculateBuyTimingScore({
      desiredPrice: 10000,
      currentEffectivePrice: 9500,
      saleImportance: "low",
      previousEffectivePrice: null,
      checkedAt: new Date().toISOString()
    });

    expect(result).toMatchObject({
      status: "scored",
      score: 70,
      label: "買い時かも"
    });
  });

  it("前回確認価格からの下降と上昇をスコアと理由へ反映する", () => {
    const commonInput = {
      desiredPrice: 10000,
      currentEffectivePrice: 10000,
      saleImportance: "low" as const,
      checkedAt: new Date().toISOString()
    };

    const decreased = calculateBuyTimingScore({
      ...commonInput,
      previousEffectivePrice: 11000
    });
    const increased = calculateBuyTimingScore({
      ...commonInput,
      previousEffectivePrice: 9000
    });

    expect(decreased.status).toBe("scored");
    expect(increased.status).toBe("scored");
    if (decreased.status === "scored" && increased.status === "scored") {
      expect(decreased.score).toBeGreaterThan(increased.score);
      expect(decreased.reasons).toContain("前回確認価格より下がっています。");
      expect(increased.reasons).toContain("前回確認価格より上がっています。");
    }
  });

  it("確認日が30日より古い場合はペナルティを反映する", () => {
    const checkedNow = new Date();
    const commonInput = {
      desiredPrice: 10000,
      currentEffectivePrice: 9500,
      saleImportance: "low" as const,
      previousEffectivePrice: null
    };

    const fresh = calculateBuyTimingScore({
      ...commonInput,
      checkedAt: checkedNow.toISOString()
    });
    const stale = calculateBuyTimingScore({
      ...commonInput,
      checkedAt: new Date(checkedNow.getTime() - 31 * 24 * 60 * 60 * 1000).toISOString()
    });

    expect(fresh.status).toBe("scored");
    expect(stale.status).toBe("scored");
    if (fresh.status === "scored" && stale.status === "scored") {
      expect(stale.score).toBe(fresh.score - 10);
      expect(stale.reasons).toContain("確認日が古い可能性があります。");
    }
  });
});
