import type { Metadata } from "next";
import { saleEvents } from "@/data/sales";
import { SaleDetail } from "@/features/sales/SaleDetail";
import { buildPageMetadata } from "@/lib/utils/metadata";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const sale = saleEvents.find((item) => item.id === id);
  return buildPageMetadata({
    title: sale?.title ?? "セール詳細",
    description: sale?.description ?? "セール予定の概要、攻略メモ、関連する欲しいものを確認できます。",
    path: `/sales/${id}`
  });
}

export default async function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SaleDetail saleId={id} />;
}
