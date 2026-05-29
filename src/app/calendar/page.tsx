import { PageHeader } from "@/components/ui/PageHeader";
import { SaleCalendar } from "@/features/sales/SaleCalendar";

export default function CalendarPage() {
  return (
    <>
      <PageHeader title="セールカレンダー" description="merchantId 単位で絞り込みながら、月次のセール予定を確認できます。" />
      <SaleCalendar />
    </>
  );
}
