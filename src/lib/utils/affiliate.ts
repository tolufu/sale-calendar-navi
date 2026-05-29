export function convertRakutenAffiliateUrl(url: string, affiliateId?: string): string {
  if (!affiliateId) {
    return url;
  }

  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("rakuten.co.jp")) {
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
