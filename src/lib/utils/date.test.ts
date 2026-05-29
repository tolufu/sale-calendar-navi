import { describe, expect, it } from "vitest";
import { getSaleStatus } from "@/lib/utils/date";

describe("getSaleStatus", () => {
  it("開催予定・開催中・終了を判定する", () => {
    const start = "2026-06-01T00:00:00+09:00";
    const end = "2026-06-02T00:00:00+09:00";

    expect(getSaleStatus(start, end, new Date("2026-05-31T23:00:00+09:00"))).toBe("upcoming");
    expect(getSaleStatus(start, end, new Date("2026-06-01T12:00:00+09:00"))).toBe("active");
    expect(getSaleStatus(start, end, new Date("2026-06-02T01:00:00+09:00"))).toBe("ended");
  });
});
