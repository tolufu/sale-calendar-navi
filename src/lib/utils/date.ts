export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    weekday: "short"
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(date));
}

export function toDateKey(date: string | Date): string {
  const value = new Date(date);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export type SaleStatus = "upcoming" | "active" | "ended";

export function getSaleStatus(startAt: string | Date, endAt: string | Date, now: Date = new Date()): SaleStatus {
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  const current = now.getTime();

  if (current < start) return "upcoming";
  if (current > end) return "ended";
  return "active";
}

export function formatSaleStatus(status: SaleStatus): string {
  if (status === "active") return "開催中";
  if (status === "upcoming") return "開催予定";
  return "終了";
}
