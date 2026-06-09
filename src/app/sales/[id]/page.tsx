import type { Metadata } from "next";
import { SaleDetail } from "@/features/sales/SaleDetail";
import { getSaleForServer } from "@/lib/sales/public-server";
import { buildPageMetadata } from "@/lib/utils/metadata";

// 管理コンソールのセール日程編集をメタデータへ反映するため、定期的に再生成する。
export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const sale = await getSaleForServer(id);
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
