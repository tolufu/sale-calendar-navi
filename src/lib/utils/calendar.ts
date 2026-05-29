import type { Merchant, SaleEvent } from "@/lib/repositories/types";
import { toDateKey } from "@/lib/utils/date";

export type CalendarDay = {
  date: Date;
  dateKey: string;
  inMonth: boolean;
  events: SaleEvent[];
};

export function buildCalendarDays(monthDate: Date, events: SaleEvent[]): CalendarDay[] {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const dateKey = toDateKey(date);

    return {
      date,
      dateKey,
      inMonth: date.getMonth() === monthDate.getMonth(),
      events: events.filter((event) => toDateKey(event.startAt) === dateKey)
    };
  });
}

export function sortSalesForDisplay(events: SaleEvent[], merchants: Merchant[]): SaleEvent[] {
  const merchantOrder = new Map(merchants.map((merchant) => [merchant.merchantId, merchant.sortOrder]));
  return [...events].sort((a, b) => {
    const startDiff = new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
    if (startDiff !== 0) {
      return startDiff;
    }
    return (merchantOrder.get(a.merchantId) ?? 999) - (merchantOrder.get(b.merchantId) ?? 999);
  });
}
