import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { merchants } from "@/data/merchants";
import { SaleCalendar } from "@/features/sales/SaleCalendar";

export default async function MerchantCalendarPage({ params }: { params: Promise<{ merchantSlug: string }> }) {
  const { merchantSlug } = await params;
  const merchant = merchants.find((item) => item.merchantId === merchantSlug && item.isActive);
  if (!merchant) {
    notFound();
  }

  return (
    <>
      <PageHeader title={`${merchant.name} のセールカレンダー`} description="EC別に絞り込んだ予定を月表示・リスト表示で確認できます。" />
      <SaleCalendar initialMerchantSlug={merchantSlug} />
    </>
  );
}
