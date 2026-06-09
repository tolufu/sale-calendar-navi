"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toast } from "@/components/ui/Toast";
import { getAdminRepositories, getRepositories } from "@/lib/repositories";
import type { Merchant, SaleEvent } from "@/lib/repositories/types";
import { formatDateTime, isEstimatedSale } from "@/lib/utils/date";

type ListState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; sales: SaleEvent[]; merchants: Merchant[] };

export function AdminSaleList() {
  const [state, setState] = useState<ListState>({ status: "loading" });
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const [sales, merchants] = await Promise.all([
        getAdminRepositories().sales.listAll(),
        getRepositories().merchants.list()
      ]);
      setState({ status: "success", sales, merchants });
    } catch {
      setState({ status: "error", message: "セール日程一覧を読み込めませんでした。" });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRemove(event: SaleEvent) {
    if (!window.confirm(`「${event.title}」を削除しますか？`)) {
      return;
    }

    try {
      await getAdminRepositories().sales.remove(event.id);
      setToast("セール日程を削除しました。");
      await load();
    } catch {
      setState({ status: "error", message: "セール日程を削除できませんでした。" });
    }
  }

  return (
    <div>
      <PageHeader
        title="セール日程管理"
        description="日程は手入力または手動CSVで登録します。公開画面には保存済みの日程が反映されます。"
        action={
          <div className="flex flex-wrap gap-2">
            <Link className={secondaryLinkClass} href="/admin/sales/import">CSV取込</Link>
            <Link className={primaryLinkClass} href="/admin/sales/new">日程を作成</Link>
          </div>
        }
      />
      <Link href="/admin" className="mb-4 inline-block text-sm font-semibold text-accent hover:underline">管理者コンソールへ戻る</Link>

      {state.status === "loading" ? <Skeleton className="h-52 w-full" /> : null}
      {state.status === "error" ? <ErrorState message={state.message} onRetry={() => void load()} /> : null}
      {state.status === "success" && state.sales.length === 0 ? (
        <EmptyState title="セール日程はまだありません" description="日程を作成するか、手動CSVから取り込んでください。" />
      ) : null}
      {state.status === "success" && state.sales.length > 0 ? (
        <div className="space-y-3">
          {state.sales.map((event) => {
            const merchantName = state.merchants.find((merchant) => merchant.merchantId === event.merchantId)?.name ?? event.merchantId;
            return (
              <Card key={event.id} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{merchantName}</Badge>
                    <Badge>{event.saleType}</Badge>
                    {isEstimatedSale(event.confidence) ? <Badge className="border-amber-200 bg-amber-50 text-amber-700">予測</Badge> : null}
                  </div>
                  <h2 className="mt-2 font-bold text-ink">{event.title}</h2>
                  <p className="mt-1 text-sm text-muted">{formatDateTime(event.startAt)} 〜 {formatDateTime(event.endAt)}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link className={secondaryLinkClass} href={`/admin/sales/${event.id}/edit`}>編集</Link>
                  <Button variant="danger" onClick={() => void handleRemove(event)}>削除</Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : null}
      {toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}
    </div>
  );
}

const primaryLinkClass = "inline-flex min-h-10 items-center rounded-btn bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accentDark";
const secondaryLinkClass = "inline-flex min-h-10 items-center rounded-btn border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-surface";
