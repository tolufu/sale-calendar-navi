import { PageHeader } from "@/components/ui/PageHeader";
import { SaleCalendar } from "@/features/sales/SaleCalendar";
import { buildPageMetadata } from "@/lib/utils/metadata";

export const metadata = buildPageMetadata({
  title: "セールカレンダー",
  description: "Amazon・楽天のセール予定をカレンダーで確認し、EC別に絞り込めます。",
  path: "/calendar"
});

export default function CalendarPage() {
  return (
    <>
      <PageHeader title="セールカレンダー" description="merchantId 単位で絞り込みながら、月次のセール予定を確認できます。" />
      <SaleCalendar />
    </>
  );
}
