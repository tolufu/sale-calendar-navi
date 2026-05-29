import type { Merchant } from "@/lib/repositories/types";

export const merchants: Merchant[] = [
  {
    merchantId: "amazon",
    name: "Amazon",
    colorToken: "amazon",
    placeholderKey: "blue-box",
    affiliate: null,
    isActive: true,
    sortOrder: 10
  },
  {
    merchantId: "rakuten",
    name: "楽天",
    colorToken: "rakuten",
    placeholderKey: "red-bag",
    affiliate: {
      provider: "rakuten",
      enabled: true
    },
    isActive: true,
    sortOrder: 20
  }
];
