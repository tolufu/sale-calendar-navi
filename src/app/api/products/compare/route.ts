import { NextResponse } from "next/server";
import { merchants } from "@/data/merchants";
import { FrankfurterExchangeRateProvider } from "@/lib/currency/frankfurter";
import type { ProductSearchProviderResult } from "@/lib/product-search/types";
import { createProductSearchProviders } from "@/lib/product-search/providers";
import { searchMerchantProducts } from "@/lib/providers/product-search";

const DEFAULT_LIMIT = 5;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const requestedMerchants = (searchParams.get("merchants") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? DEFAULT_LIMIT), 1), 10);

  if (!query) {
    return NextResponse.json({ query, results: [], message: "商品URLまたはキーワードを入力してください。" }, { status: 400 });
  }

  const providerByMerchantId = createProductSearchProviders();
  const targetMerchants = merchants
    .filter((merchant) => merchant.isActive)
    .filter((merchant) => requestedMerchants.length > 0
      ? requestedMerchants.includes(merchant.merchantId)
      : merchant.supportsApi && merchant.supportsPriceAutoFetch)
    .filter((merchant) => providerByMerchantId[merchant.merchantId]);

  const rawResults = await Promise.all(targetMerchants.map(async (merchant): Promise<ProductSearchProviderResult> => {
    const provider = providerByMerchantId[merchant.merchantId];
    try {
      const result = await searchMerchantProducts(merchant, provider, { query, limit });
      return { merchantId: merchant.merchantId, ...result };
    } catch (error) {
      return {
        merchantId: merchant.merchantId,
        configured: false,
        candidates: [],
        message: error instanceof Error ? error.message : "商品候補を取得できませんでした。"
      };
    }
  }));
  const { results, exchangeMessages } = await attachJpyReferenceValues(rawResults);

  return NextResponse.json({ query, results, exchangeMessages });
}

async function attachJpyReferenceValues(results: ProductSearchProviderResult[]): Promise<{
  results: ProductSearchProviderResult[];
  exchangeMessages: string[];
}> {
  const provider = new FrankfurterExchangeRateProvider();
  const currencies = [...new Set(
    results
      .flatMap((result) => result.candidates)
      .map((candidate) => candidate.currency.toUpperCase())
      .filter((currency) => currency && currency !== "JPY")
  )];
  const rates = new Map(await Promise.all(currencies.map(async (currency) => [currency, await provider.getRate(currency, "JPY")] as const)));
  const exchangeMessages = [...rates.values()].flatMap((rate) => rate.message ? [`${rate.base}/${rate.quote}: ${rate.message}`] : []);

  return {
    exchangeMessages,
    results: results.map((result) => ({
      ...result,
      candidates: result.candidates.map((candidate) => {
        if (candidate.currency === "JPY") {
          return {
            ...candidate,
            priceJpy: candidate.price,
            shippingFeeJpy: candidate.shippingFee,
            exchangeRateToJpy: 1,
            exchangeRateDate: null
          };
        }
        const rate = rates.get(candidate.currency.toUpperCase());
        if (!rate?.rate) {
          return {
            ...candidate,
            priceJpy: null,
            shippingFeeJpy: null,
            exchangeRateToJpy: null,
            exchangeRateDate: null
          };
        }
        return {
          ...candidate,
          priceJpy: candidate.price === null ? null : Math.round(candidate.price * rate.rate),
          shippingFeeJpy: candidate.shippingFee === null ? null : Math.round(candidate.shippingFee * rate.rate),
          exchangeRateToJpy: rate.rate,
          exchangeRateDate: rate.date
        };
      })
    }))
  };
}
