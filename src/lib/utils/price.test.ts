import { describe, expect, it } from "vitest";
import { calculateEffectivePrice } from "@/lib/utils/price";

describe("calculateEffectivePrice", () => {
  it("割引とポイント相当額を差し引く土台計算を行う", () => {
    expect(calculateEffectivePrice(10000, 1000, 500)).toBe(8500);
    expect(calculateEffectivePrice(1000, 1200, 0)).toBe(0);
  });
});
