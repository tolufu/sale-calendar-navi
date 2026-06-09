import { withTimeout } from "@/lib/product-search/common";

const DEFAULT_FRANKFURTER_ENDPOINT = "https://api.frankfurter.dev";
const CACHE_TTL_MS = 60 * 60 * 1000;
const cache = new Map<string, { result: ExchangeRateResult; expiresAt: number }>();

export type ExchangeRateResult = {
  ok: boolean;
  base: string;
  quote: string;
  rate: number | null;
  date: string | null;
  message: string | null;
};

type FrankfurterRateResponse = {
  base?: string;
  quote?: string;
  rate?: number;
  date?: string;
};

export class FrankfurterExchangeRateProvider {
  constructor(private readonly endpoint = process.env.EXCHANGE_RATE_API_BASE || DEFAULT_FRANKFURTER_ENDPOINT) {}

  async getRate(baseCurrency: string, quoteCurrency = "JPY"): Promise<ExchangeRateResult> {
    const base = baseCurrency.trim().toUpperCase();
    const quote = quoteCurrency.trim().toUpperCase();
    if (!base || !quote) {
      return failure(base, quote, "通貨コードが不正です。");
    }
    if (base === quote) {
      return { ok: true, base, quote, rate: 1, date: new Date().toISOString().slice(0, 10), message: null };
    }

    const cacheKey = `${base}:${quote}`;
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.result;
    }

    const timeout = withTimeout();
    try {
      const url = new URL(`/v2/rate/${encodeURIComponent(base)}/${encodeURIComponent(quote)}`, this.endpoint);
      const response = await fetch(url, {
        headers: { accept: "application/json" },
        next: { revalidate: 3600 },
        signal: timeout.signal
      });
      if (!response.ok) {
        return failure(base, quote, "為替レートを取得できませんでした。元通貨の参考値として表示します。");
      }

      const body = (await response.json()) as FrankfurterRateResponse;
      const rate = typeof body.rate === "number" && Number.isFinite(body.rate) && body.rate > 0 ? body.rate : null;
      if (rate === null) {
        return failure(base, quote, "為替レートの形式を確認できませんでした。元通貨の参考値として表示します。");
      }

      const result = {
        ok: true,
        base,
        quote,
        rate,
        date: body.date ?? null,
        message: null
      };
      cache.set(cacheKey, { result, expiresAt: Date.now() + CACHE_TTL_MS });
      return result;
    } catch {
      return failure(base, quote, "為替レートを取得できませんでした。元通貨の参考値として表示します。");
    } finally {
      timeout.clear();
    }
  }
}

export function clearExchangeRateCacheForTest(): void {
  cache.clear();
}

function failure(base: string, quote: string, message: string): ExchangeRateResult {
  return { ok: false, base, quote, rate: null, date: null, message };
}
