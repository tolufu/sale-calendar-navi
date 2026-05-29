import { describe, expect, it } from "vitest";
import { merchants } from "@/data/merchants";
import type { SaleEvent } from "@/lib/repositories/types";
import { sortSalesForDisplay } from "@/lib/utils/calendar";

describe("sortSalesForDisplay", () => {
  it("開始時刻、同時刻ならmerchant sortOrderで並べる", () => {
    const events: SaleEvent[] = [
      {
        id: "b",
        merchantId: "rakuten",
        title: "b",
        saleType: "sale",
        startAt: "2026-06-01T10:00:00+09:00",
        endAt: "2026-06-01T20:00:00+09:00",
        description: "",
        sourceUrl: null
      },
      {
        id: "a",
        merchantId: "amazon",
        title: "a",
        saleType: "sale",
        startAt: "2026-06-01T10:00:00+09:00",
        endAt: "2026-06-01T20:00:00+09:00",
        description: "",
        sourceUrl: null
      }
    ];

    expect(sortSalesForDisplay(events, merchants).map((event) => event.id)).toEqual(["a", "b"]);
  });
});
