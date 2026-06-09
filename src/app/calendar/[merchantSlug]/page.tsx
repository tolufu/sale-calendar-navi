import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { SaleCalendar } from "@/features/sales/SaleCalendar";
import { getMerchantForServer } from "@/lib/merchants/public-server";
import { buildPageMetadata } from "@/lib/utils/metadata";

// 管理コンソールのECマスタ編集をサーバー描画へ反映するため、定期的に再生成する。
export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ merchantSlug: string }> }) {
  const { merchantSlug } = await params;
  const merchant = await getMerchantForServer(merchantSlug);
  return buildPageMetadata({
    title: `${merchant?.isActive ? merchant.name : "EC別"} のセールカレンダー`,
    description: "EC別に絞り込んだセール予定を月表示とリスト表示で確認できます。",
    path: `/calendar/${merchantSlug}`
  });
}

export default async function MerchantCalendarPage({ params }: { params: Promise<{ merchantSlug: string }> }) {
  const { merchantSlug } = await params;
  const merchant = await getMerchantForServer(merchantSlug);
  if (!merchant || !merchant.isActive) {
    notFound();
  }

  return (
    <>
      <PageHeader title={`${merchant.name} のセールカレンダー`} description="EC別に絞り込んだ予定を月表示・リスト表示で確認できます。" />
      <SaleCalendar initialMerchantSlug={merchantSlug} />
    </>
  );
}
