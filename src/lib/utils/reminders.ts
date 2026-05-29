import type { NotificationSetting, SaleEvent, WishItem } from "@/lib/repositories/types";

export type ReminderTiming = "threeDaysBefore" | "oneDayBefore" | "atStart";

export type UpcomingSaleReminder = {
  id: string;
  wishItemId: string;
  wishTitle: string;
  saleEventId: string;
  saleTitle: string;
  merchantId: string;
  timing: ReminderTiming;
  remindAt: string;
};

export const reminderTimingLabels: Record<ReminderTiming, string> = {
  threeDaysBefore: "3日前",
  oneDayBefore: "前日",
  atStart: "開始時"
};

const timingOffsets: Record<ReminderTiming, number> = {
  threeDaysBefore: 3,
  oneDayBefore: 1,
  atStart: 0
};

function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export function isReminderTimingDue(saleStartAt: string, now: Date, timing: ReminderTiming): boolean {
  const saleStart = new Date(saleStartAt);
  if (timing === "atStart") {
    return Math.abs(saleStart.getTime() - now.getTime()) < 60 * 60 * 1000;
  }

  const diffDays = Math.round((startOfDay(saleStart).getTime() - startOfDay(now).getTime()) / 86_400_000);
  return diffDays === timingOffsets[timing];
}

export function generateUpcomingSaleReminders({
  wishlist,
  saleEvents,
  now,
  setting
}: {
  wishlist: WishItem[];
  saleEvents: SaleEvent[];
  now: Date;
  setting?: Pick<NotificationSetting, "enabled" | "timings" | "perMerchant">;
}): UpcomingSaleReminder[] {
  if (setting && !setting.enabled) {
    return [];
  }

  const enabledTimings = (Object.keys(timingOffsets) as ReminderTiming[]).filter((timing) => setting?.timings?.[timing] ?? true);
  const enabledMerchant = (merchantId: string) => setting?.perMerchant?.[merchantId] ?? true;

  return wishlist.flatMap((item) =>
    saleEvents
      .filter((sale) => sale.merchantId === item.merchantId && enabledMerchant(sale.merchantId))
      .flatMap((sale) =>
        enabledTimings
          .filter((timing) => isReminderTimingDue(sale.startAt, now, timing))
          .map((timing) => ({
            id: `${item.id}:${sale.id}:${timing}`,
            wishItemId: item.id,
            wishTitle: item.title,
            saleEventId: sale.id,
            saleTitle: sale.title,
            merchantId: sale.merchantId,
            timing,
            remindAt: sale.startAt
          }))
      )
  );
}
