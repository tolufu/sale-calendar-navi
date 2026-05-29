import { describe, expect, it } from "vitest";
import { isValidNotificationEmail, normalizeNotificationSetting } from "@/lib/services/notifications";

describe("notifications service", () => {
  it("通知メールアドレスの形式を検証する", () => {
    expect(isValidNotificationEmail("name@example.com")).toBe(true);
    expect(isValidNotificationEmail(" name@example.com ")).toBe(true);
    expect(isValidNotificationEmail("invalid")).toBe(false);
    expect(isValidNotificationEmail("name@example")).toBe(false);
    expect(isValidNotificationEmail("name @example.com")).toBe(false);
    expect(isValidNotificationEmail("")).toBe(false);
  });

  it("通知設定のメールアドレスを保存前に正規化する", () => {
    const setting = normalizeNotificationSetting("user-1", { email: " name@example.com " });

    expect(setting.email).toBe("name@example.com");
  });
});
