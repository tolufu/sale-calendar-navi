import type { AffiliateLinkProvider } from "@/lib/providers/types";

const DEFAULT_RAKUTEN_SCID = process.env.NEXT_PUBLIC_RAKUTEN_AFFILIATE_SCID || "af_link_dummy";

function isRakutenHost(hostname: string): boolean {
  const normalized = hostname.replace(/^www\./, "").toLowerCase();
  return normalized === "rakuten.co.jp" || normalized.endsWith(".rakuten.co.jp");
}

export function convertRakutenAffiliate(url: string, scid = DEFAULT_RAKUTEN_SCID): string {
  try {
    const parsed = new URL(url);
    if (!isRakutenHost(parsed.hostname)) {
      return url;
    }
    if (!parsed.searchParams.has("scid")) {
      parsed.searchParams.set("scid", scid);
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

export function buildAffiliateUrl(
  url: string,
  merchantAffiliate: { provider: string; enabled: boolean } | null | undefined
): string | null {
  if (!merchantAffiliate?.enabled) {
    return null;
  }

  return affiliateLinkProviders[merchantAffiliate.provider]?.buildUrl(url) ?? null;
}

export const affiliateLinkProviders: Record<string, AffiliateLinkProvider> = {
  rakuten: {
    providerId: "rakuten",
    buildUrl(url) {
      const converted = convertRakutenAffiliate(url);
      return converted === url ? null : converted;
    }
  }
};

export function convertRakutenAffiliateUrl(url: string, affiliateId?: string): string {
  if (!affiliateId) {
    return convertRakutenAffiliate(url);
  }

  try {
    const parsed = new URL(url);
    if (!isRakutenHost(parsed.hostname)) {
      return url;
    }

    const affiliateUrl = new URL("https://hb.afl.rakuten.co.jp/hgc/g00dummy/");
    affiliateUrl.searchParams.set("pc", parsed.toString());
    affiliateUrl.searchParams.set("link_type", "hybrid_url");
    affiliateUrl.searchParams.set("me_id", affiliateId);
    return affiliateUrl.toString();
  } catch {
    return url;
  }
}
