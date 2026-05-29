import type { Merchant } from "@/lib/repositories/types";

export function detectMerchantIdFromUrl(url: string, merchants: Merchant[]): string | null {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    const knownHosts: Record<string, string[]> = {
      amazon: ["amazon.co.jp", "amzn.asia"],
      rakuten: ["rakuten.co.jp", "item.rakuten.co.jp", "books.rakuten.co.jp"]
    };

    return merchants.find((merchant) =>
      (knownHosts[merchant.merchantId] ?? []).some((host) => hostname === host || hostname.endsWith(`.${host}`))
    )?.merchantId ?? null;
  } catch {
    return null;
  }
}

export function extractAmazonAsin(url: string): string | null {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    if (!hostname.includes("amazon.") && hostname !== "amzn.asia") {
      return null;
    }

    const decodedPath = decodeURIComponent(parsed.pathname);
    const patterns = [
      /\/dp\/([A-Z0-9]{10})(?:[/?]|$)/i,
      /\/gp\/product\/([A-Z0-9]{10})(?:[/?]|$)/i,
      /\/product\/([A-Z0-9]{10})(?:[/?]|$)/i
    ];
    for (const pattern of patterns) {
      const match = decodedPath.match(pattern);
      if (match?.[1]) {
        return match[1].toUpperCase();
      }
    }

    const asin = parsed.searchParams.get("asin");
    return asin && /^[A-Z0-9]{10}$/i.test(asin) ? asin.toUpperCase() : null;
  } catch {
    return null;
  }
}
