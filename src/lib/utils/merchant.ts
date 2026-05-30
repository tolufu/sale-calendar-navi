import type { Merchant } from "@/lib/repositories/types";

const merchantToneClasses: Record<string, string> = {
  amazon: "border-amazon bg-blue-50 text-amazon",
  rakuten: "border-rakuten bg-red-50 text-rakuten"
};

export function getMerchantToneClass(merchant: Pick<Merchant, "colorToken"> | null | undefined): string {
  return merchantToneClasses[merchant?.colorToken ?? ""] ?? "border-line bg-surface text-muted";
}

export function detectMerchantIdFromUrl(url: string, merchants: Merchant[]): string | null {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "").toLowerCase();

    return merchants.find((merchant) =>
      (merchant.urlHosts ?? []).some((host) => {
        const normalizedHost = host.replace(/^www\./, "").toLowerCase();
        return hostname === normalizedHost || hostname.endsWith(`.${normalizedHost}`);
      })
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
