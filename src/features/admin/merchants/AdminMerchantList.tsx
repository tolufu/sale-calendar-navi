"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { getAdminRepositories } from "@/lib/repositories";
import type { Merchant } from "@/lib/repositories/types";

type ListState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; merchants: Merchant[] };

export function AdminMerchantList() {
  const [state, setState] = useState<ListState>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      setState({ status: "success", merchants: await getAdminRepositories().merchants.listAll() });
    } catch {
      setState({ status: "error", message: "ECマスタを読み込めませんでした。" });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title="ECマスタ管理"
        description="ECの表示名、連携状態、プレースホルダー、公開状態を管理します。参照切れを避けるため物理削除は行いません。"
        action={<Link className={primaryLinkClass} href="/admin/merchants/new">ECを追加</Link>}
      />
      <Link href="/admin" className="mb-4 inline-block text-sm font-semibold text-accent hover:underline">管理者コンソールへ戻る</Link>

      {state.status === "loading" ? <Skeleton className="h-52 w-full" /> : null}
      {state.status === "error" ? <ErrorState message={state.message} onRetry={() => void load()} /> : null}
      {state.status === "success" && state.merchants.length === 0 ? (
        <EmptyState title="ECマスタはまだありません" description="ECを追加してください。" />
      ) : null}
      {state.status === "success" && state.merchants.length > 0 ? (
        <div className="space-y-3">
          {state.merchants.map((merchant) => (
            <Card key={merchant.merchantId} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{merchant.merchantId}</Badge>
                  <Badge className={merchant.isActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600"}>
                    {merchant.isActive ? "公開中" : "無効"}
                  </Badge>
                  <Badge>{integrationLabel(merchant.integrationStatus)}</Badge>
                </div>
                <h2 className="mt-2 font-bold text-ink">{merchant.name}</h2>
                <p className="mt-1 text-sm text-muted">並び順 {merchant.sortOrder} / プレースホルダー {merchant.placeholderKey}</p>
              </div>
              <Link className={secondaryLinkClass} href={`/admin/merchants/${merchant.merchantId}/edit`}>編集</Link>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function integrationLabel(status: Merchant["integrationStatus"]): string {
  if (status === "available") return "連携可";
  if (status === "planned") return "連携予定";
  return "手動運用";
}

const primaryLinkClass = "inline-flex min-h-10 items-center rounded-btn bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accentDark";
const secondaryLinkClass = "inline-flex min-h-10 items-center rounded-btn border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-surface";
