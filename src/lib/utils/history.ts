import type { ViewHistory } from "@/lib/repositories/types";

export const HISTORY_LIMIT = 30;

export function limitHistoryItems(items: ViewHistory[], limit = HISTORY_LIMIT): ViewHistory[] {
  return [...items]
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
    .slice(0, limit);
}
