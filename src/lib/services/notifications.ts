import type { NotificationSetting } from "@/lib/repositories/types";

export function createUnsubscribeToken(userId: string): string {
  const source = `${userId}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
  if (typeof btoa === "function") {
    return btoa(source).replace(/=+$/g, "");
  }
  return source.replace(/[^a-zA-Z0-9]/g, "");
}

export function defaultNotificationSetting(userId: string): NotificationSetting {
  return {
    userId,
    enabled: false,
    email: null,
    timings: {
      threeDaysBefore: true,
      oneDayBefore: true,
      atStart: false
    },
    perMerchant: null,
    unsubscribeToken: createUnsubscribeToken(userId)
  };
}

export function normalizeNotificationSetting(userId: string, setting: Partial<NotificationSetting> & { leadDays?: number }): NotificationSetting {
  const fallback = defaultNotificationSetting(userId);
  const migratedTiming =
    typeof setting.leadDays === "number"
      ? {
          threeDaysBefore: setting.leadDays === 3,
          oneDayBefore: setting.leadDays === 1 || setting.leadDays === 2,
          atStart: setting.leadDays === 0
        }
      : fallback.timings;

  return {
    ...fallback,
    ...setting,
    userId,
    email: setting.email?.trim() || null,
    timings: {
      ...migratedTiming,
      ...setting.timings
    },
    unsubscribeToken: setting.unsubscribeToken || fallback.unsubscribeToken
  };
}
