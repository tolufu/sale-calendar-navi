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
      <section className="mb-4 rounded-card border border-line bg-surface p-4 text-sm leading-6 text-muted">
        <p className="font-semibold text-ink">高頻度の定期施策について</p>
        <p className="mt-1">
          カレンダーには大型・季節セールを中心に掲載しています。各ECが毎月くり返す施策（楽天「5と0のつく日」＝毎月5・10・15・20・25・30日／Yahoo!ショッピング「5のつく日」＝毎月5・15・25日／「ゾロ目の日」など）は件数が多いため個別には掲載していません。
        </p>
        <p className="mt-1">
          これらの開催可否・対象・ポイント条件・エントリー要否は変更される場合があります。利用前に各ECの公式サイトで最新情報を確認してください。本サービスは価格や条件を保証するものではありません。
        </p>
      </section>
      <SaleCalendar />
    </>
  );
}
