import { describe, expect, it } from "vitest";
import type { SaleEvent, WishItem } from "@/lib/repositories/types";
import { generateUpcomingSaleReminders, isReminderTimingDue } from "@/lib/utils/reminders";

const sale: SaleEvent = {
  id: "sale-1",
  merchantId: "rakuten",
  title: "楽天 セールメモ",
  saleType: "大型",
  startAt: "2026-06-04T20:00:00+09:00",
  endAt: "2026-06-11T01:59:00+09:00",
  description: "説明",
  sourceUrl: null
};

const wish: WishItem = {
  id: "wish-1",
  userId: "user",
  title: "手入力商品",
  productUrl: "https://example.com/item",
  merchantId: "rakuten",
  desiredPrice: null,
  actualPriceMemo: null,
  targetSaleEventId: null,
  placeholderKey: "red-bag",
  note: null,
  createdAt: "2026-05-01T00:00:00+09:00",
  updatedAt: "2026-05-01T00:00:00+09:00"
};

describe("reminders", () => {
  it("3日前、前日、開始時を純粋関数で判定する", () => {
    expect(isReminderTimingDue(sale.startAt, new Date("2026-06-01T09:00:00+09:00"), "threeDaysBefore")).toBe(true);
    expect(isReminderTimingDue(sale.startAt, new Date("2026-06-03T09:00:00+09:00"), "oneDayBefore")).toBe(true);
    expect(isReminderTimingDue(sale.startAt, new Date("2026-06-04T20:30:00+09:00"), "atStart")).toBe(true);
  });

  it("merchantId が一致する保存商品だけ通知候補にする", () => {
    const reminders = generateUpcomingSaleReminders({
      wishlist: [wish, { ...wish, id: "wish-2", merchantId: "amazon" }],
      saleEvents: [sale],
      now: new Date("2026-06-01T09:00:00+09:00")
    });

    expect(reminders).toHaveLength(1);
    expect(reminders[0]).toMatchObject({ wishItemId: "wish-1", saleEventId: "sale-1", timing: "threeDaysBefore" });
  });

  it("candidates の merchantId が一致する保存商品も通知候補にする", () => {
    const reminders = generateUpcomingSaleReminders({
      wishlist: [
        {
          ...wish,
          merchantId: "amazon",
          candidates: [
            {
              merchantId: "rakuten",
              originalUrl: "https://example.com/rakuten/item",
              affiliateUrl: null,
              breakdown: {
                productPrice: null,
                shippingFee: null,
                couponDiscount: null,
                grantedPoints: null,
                pointRate: null
              },
              priceMemo: null,
              lastCheckedAt: null,
              imageSource: "placeholder"
            }
          ]
        }
      ],
      saleEvents: [sale],
      now: new Date("2026-06-01T09:00:00+09:00")
    });

    expect(reminders).toHaveLength(1);
    expect(reminders[0]).toMatchObject({ merchantId: "rakuten", wishItemId: "wish-1", saleEventId: "sale-1" });
  });
});
