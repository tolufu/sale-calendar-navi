import type { Merchant } from "@/lib/repositories/types";

export const merchants: Merchant[] = [
  {
    merchantId: "amazon",
    name: "Amazon",
    type: "marketplace",
    colorToken: "amazon",
    placeholderKey: "blue-box",
    placeholderImageType: "blue-box",
    urlHosts: ["amazon.co.jp", "amzn.asia"],
    affiliate: null,
    affiliateProvider: null,
    supportsAffiliate: false,
    supportsApi: false,
    supportsPriceAutoFetch: false,
    supportsSaleCalendar: true,
    integrationStatus: "manual-only",
    isActive: true,
    sortOrder: 10
  },
  {
    merchantId: "rakuten",
    name: "楽天",
    type: "marketplace",
    colorToken: "rakuten",
    placeholderKey: "red-bag",
    placeholderImageType: "red-bag",
    urlHosts: ["rakuten.co.jp"],
    affiliate: {
      provider: "rakuten",
      enabled: true
    },
    affiliateProvider: "rakuten",
    supportsAffiliate: true,
    supportsApi: true,
    supportsPriceAutoFetch: true,
    supportsSaleCalendar: true,
    integrationStatus: "available",
    isActive: true,
    sortOrder: 20
  },
  {
    merchantId: "yahoo-shopping",
    name: "Yahoo!ショッピング",
    type: "marketplace",
    colorToken: "yahoo",
    placeholderKey: "blue-box",
    placeholderImageType: "generic",
    urlHosts: ["shopping.yahoo.co.jp"],
    affiliate: null,
    affiliateProvider: null,
    supportsAffiliate: false,
    supportsApi: true,
    supportsPriceAutoFetch: true,
    supportsSaleCalendar: false,
    integrationStatus: "available",
    isActive: true,
    sortOrder: 30
  },
  {
    merchantId: "ebay",
    name: "eBay",
    type: "marketplace",
    colorToken: "blue-box",
    placeholderKey: "blue-box",
    placeholderImageType: "generic",
    urlHosts: ["ebay.com", "ebay.co.jp"],
    affiliate: null,
    affiliateProvider: null,
    supportsAffiliate: false,
    supportsApi: true,
    supportsPriceAutoFetch: true,
    supportsSaleCalendar: false,
    integrationStatus: "available",
    isActive: true,
    sortOrder: 40
  }
];
