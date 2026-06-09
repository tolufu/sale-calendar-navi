import { afterEach, describe, expect, it, vi } from "vitest";
import { clearExchangeRateCacheForTest, FrankfurterExchangeRateProvider } from "@/lib/currency/frankfurter";

describe("FrankfurterExchangeRateProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    clearExchangeRateCacheForTest();
  });

  it("Frankfurterのrate APIからJPY換算レートを取得する", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ base: "USD", quote: "JPY", rate: 155.25, date: "2026-06-02" })
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await new FrankfurterExchangeRateProvider("https://api.frankfurter.test").getRate("usd");

    expect(result).toEqual({ ok: true, base: "USD", quote: "JPY", rate: 155.25, date: "2026-06-02", message: null });
    expect(String(fetchMock.mock.calls[0][0])).toBe("https://api.frankfurter.test/v2/rate/USD/JPY");
  });

  it("同一通貨はAPIを呼ばずrate=1を返す", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const result = await new FrankfurterExchangeRateProvider().getRate("JPY");
    expect(result.rate).toBe(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("取得失敗時は例外にせずmessageを返す", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    const result = await new FrankfurterExchangeRateProvider("https://api.frankfurter.test").getRate("USD");
    expect(result.ok).toBe(false);
    expect(result.rate).toBeNull();
    expect(result.message).toContain("為替レート");
  });
});
