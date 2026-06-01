"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { getRepositories } from "@/lib/repositories";
import type { Merchant, SaleEvent } from "@/lib/repositories/types";
import { buildCalendarDays, sortSalesForDisplay } from "@/lib/utils/calendar";
import { formatDate, formatDateTime, isEstimatedSale, toDateKey } from "@/lib/utils/date";
import { getMerchantToneClass } from "@/lib/utils/merchant";

const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

export function SaleCalendar({ initialMerchantSlug }: { initialMerchantSlug?: string }) {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [events, setEvents] = useState<SaleEvent[]>([]);
  const [activeMerchantIds, setActiveMerchantIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"month" | "list">("month");
  const [selectedDayEvents, setSelectedDayEvents] = useState<SaleEvent[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async function load() {
    setLoading(true);
    setError(null);
    try {
      const repositories = getRepositories();
      const [merchantItems, saleItems] = await Promise.all([repositories.merchants.list(), repositories.sales.list()]);
      setMerchants(merchantItems);
      setEvents(saleItems);
      setActiveMerchantIds((current) => {
        if (current.length) return current;
        if (initialMerchantSlug && merchantItems.some((merchant) => merchant.merchantId === initialMerchantSlug)) {
          return [initialMerchantSlug];
        }
        return merchantItems.map((merchant) => merchant.merchantId);
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "予定を読み込めませんでした。");
    } finally {
      setLoading(false);
    }
  }, [initialMerchantSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredEvents = useMemo(
    () => sortSalesForDisplay(events.filter((event) => activeMerchantIds.includes(event.merchantId)), merchants),
    [activeMerchantIds, events, merchants]
  );
  const days = useMemo(() => buildCalendarDays(month, filteredEvents), [filteredEvents, month]);
  const monthEvents = useMemo(
    () =>
      filteredEvents.filter((event) => {
        const start = new Date(event.startAt);
        return start.getFullYear() === month.getFullYear() && start.getMonth() === month.getMonth();
      }),
    [filteredEvents, month]
  );
  const merchantById = useMemo(() => new Map(merchants.map((merchant) => [merchant.merchantId, merchant])), [merchants]);
  const todayKey = toDateKey(new Date());

  function selectMerchant(merchantId: string) {
    setActiveMerchantIds([merchantId]);
  }

  function showAllMerchants() {
    setActiveMerchantIds(merchants.map((merchant) => merchant.merchantId));
  }

  if (loading) {
    return <Skeleton className="h-[620px] w-full" />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }

  return (
    <div className="space-y-4">
      <Card className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="前月">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <p className="min-w-36 text-center text-lg font-bold">{month.getFullYear()}年 {month.getMonth() + 1}月</p>
          <Button variant="secondary" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="翌月">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            className="text-accent"
            onClick={() => {
              const now = new Date();
              setMonth(new Date(now.getFullYear(), now.getMonth(), 1));
            }}
          >
            今月
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant={activeMerchantIds.length === merchants.length ? "primary" : "secondary"} onClick={showAllMerchants}>
            すべて
          </Button>
          {merchants.map((merchant) => (
            <Button
              key={merchant.merchantId}
              variant={activeMerchantIds.length === 1 && activeMerchantIds[0] === merchant.merchantId ? "primary" : "secondary"}
              onClick={() => selectMerchant(merchant.merchantId)}
            >
              {merchant.name}
            </Button>
          ))}
        </div>
        <div className="flex rounded-lg border border-line bg-surface p-1">
          <Button variant={viewMode === "month" ? "primary" : "ghost"} onClick={() => setViewMode("month")}>月表示</Button>
          <Button variant={viewMode === "list" ? "primary" : "ghost"} onClick={() => setViewMode("list")}>リスト</Button>
        </div>
      </Card>

      {viewMode === "list" ? (
        monthEvents.length === 0 ? (
        <EmptyState title="この月のセール予定はありません" description="ECフィルターを変更するか、別の月を確認してください。" />
      ) : (
        <div className="grid gap-3">
          {monthEvents.map((event) => {
            const merchant = merchants.find((entry) => entry.merchantId === event.merchantId);
            return (
              <Link key={event.id} href={`/sales/${event.id}`} className="block">
                <Card className="hover:bg-surface">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{merchant?.name ?? event.merchantId}</Badge>
                    <Badge className={getMerchantToneClass(merchant)}>{event.saleType}</Badge>
                    {isEstimatedSale(event.confidence) ? (
                      <Badge className="border-amber-300 bg-amber-50 text-amber-700">予測</Badge>
                    ) : null}
                  </div>
                  <h2 className="mt-3 text-lg font-bold">{event.title}</h2>
                  <p className="mt-2 text-sm text-muted">{formatDateTime(event.startAt)} - {formatDateTime(event.endAt)}</p>
                </Card>
              </Link>
            );
          })}
        </div>
        )
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-line bg-white">
            <div className="grid grid-cols-7 border-b border-line bg-surface text-center text-xs font-semibold text-muted">
              {weekdays.map((day) => <div key={day} className="py-2">{day}</div>)}
            </div>
            <div className="grid grid-cols-7">
              {days.map((day) => {
                const visibleEvents = day.events.slice(0, 2);
                const hiddenCount = Math.max(day.events.length - 2, 0);
                const isToday = day.dateKey === todayKey;
                return (
                  <button
                    key={day.dateKey}
                    type="button"
                    aria-current={isToday ? "date" : undefined}
                    className={`flex min-h-28 flex-col items-start border-b border-r border-line p-2 text-left hover:bg-surface sm:min-h-36 ${isToday ? "bg-accent/10 ring-2 ring-inset ring-accent" : ""}`}
                    onClick={() => day.events.length > 0 && setSelectedDayEvents(day.events)}
                  >
                    <span
                      className={
                        isToday
                          ? "flex h-6 w-6 items-center justify-center rounded-full bg-accent text-sm font-bold text-white"
                          : day.inMonth
                            ? "text-sm font-semibold text-ink"
                            : "text-sm text-zinc-400"
                      }
                    >
                      {day.date.getDate()}
                    </span>
                    <div className="mt-2 w-full space-y-1">
                      {visibleEvents.map((event) => (
                        <Link
                          key={event.id}
                          href={`/sales/${event.id}`}
                          title={isEstimatedSale(event.confidence) ? `${event.title}（予測日程）` : event.title}
                          className={`block rounded-md border px-2 py-1 text-[11px] font-semibold leading-4 ${getMerchantToneClass(merchantById.get(event.merchantId))} ${isEstimatedSale(event.confidence) ? "border-dashed" : ""}`}
                          onClick={(clickEvent) => clickEvent.stopPropagation()}
                        >
                          {isEstimatedSale(event.confidence) ? <span aria-hidden className="mr-0.5">◇</span> : null}
                          {event.title}
                        </Link>
                      ))}
                      {hiddenCount > 0 ? <Badge className="bg-ink text-white">+{hiddenCount}</Badge> : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <p className="text-xs leading-5 text-muted">◇・破線枠は過去の傾向にもとづく「予測日程」です。確定情報は各セールの詳細や公式サイトでご確認ください。</p>
        </>
      )}

      {selectedDayEvents ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/30 p-0 md:items-center md:justify-center md:p-6">
          <div className="max-h-[80vh] w-full overflow-auto rounded-t-2xl bg-white p-5 shadow-soft md:max-w-lg md:rounded-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{formatDate(selectedDayEvents[0].startAt)} の予定</h2>
              <Button variant="ghost" className="min-h-8 px-2" onClick={() => setSelectedDayEvents(null)} aria-label="閉じる">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-4 space-y-3">
              {selectedDayEvents.map((event) => (
                <Link key={event.id} href={`/sales/${event.id}`} className="block rounded-lg border border-line p-4 hover:bg-surface">
                  <p className="flex items-center gap-2 font-semibold text-ink">
                    {event.title}
                    {isEstimatedSale(event.confidence) ? (
                      <Badge className="border-amber-300 bg-amber-50 text-amber-700">予測</Badge>
                    ) : null}
                  </p>
                  <p className="mt-1 text-sm text-muted">{formatDateTime(event.startAt)} 開始</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
