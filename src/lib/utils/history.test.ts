import { describe, expect, it } from "vitest";
import type { ViewHistory } from "@/lib/repositories/types";
import { limitHistoryItems } from "@/lib/utils/history";

describe("limitHistoryItems", () => {
  it("新しい順に最大30件へ制限する", () => {
    const items: ViewHistory[] = Array.from({ length: 35 }, (_, index) => ({
      id: String(index),
      userId: "local",
      type: "sale",
      title: `履歴${index}`,
      href: "/calendar",
      merchantId: null,
      occurredAt: new Date(2026, 0, index + 1).toISOString(),
      memo: null
    }));

    const limited = limitHistoryItems(items);
    expect(limited).toHaveLength(30);
    expect(limited[0].id).toBe("34");
    expect(limited.at(-1)?.id).toBe("5");
  });
});
