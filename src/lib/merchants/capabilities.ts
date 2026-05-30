import type { Merchant } from "@/lib/repositories/types";

export type MerchantCapability =
  | "affiliate"
  | "api"
  | "manual-link-save"
  | "price-auto-fetch"
  | "sale-calendar";

export function getMerchantCapabilities(merchant: Merchant): Set<MerchantCapability> {
  const capabilities = new Set<MerchantCapability>(["manual-link-save"]);

  if (merchant.supportsAffiliate && merchant.affiliateProvider) {
    capabilities.add("affiliate");
  }
  if (merchant.supportsApi) {
    capabilities.add("api");
  }
  if (merchant.supportsApi && merchant.supportsPriceAutoFetch) {
    capabilities.add("price-auto-fetch");
  }
  if (merchant.supportsSaleCalendar) {
    capabilities.add("sale-calendar");
  }

  return capabilities;
}

export function canUseMerchantCapability(merchant: Merchant, capability: MerchantCapability): boolean {
  return getMerchantCapabilities(merchant).has(capability);
}

export function getMerchantIntegrationLabel(merchant: Merchant): string | null {
  if (merchant.integrationStatus === "planned") {
    return "今後対応予定（手動リンク保存のみ）";
  }
  if (merchant.integrationStatus === "manual-only") {
    return "手動リンク保存のみ";
  }
  return null;
}
