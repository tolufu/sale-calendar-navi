import { PageHeader } from "@/components/ui/PageHeader";
import { NotificationSettings } from "@/features/notifications/NotificationSettings";
import { buildPageMetadata } from "@/lib/utils/metadata";

export const metadata = buildPageMetadata({
  title: "通知設定",
  description: "セール前の通知ON/OFF、対象EC、通知タイミングを保存します。実メール送信はまだ行いません。",
  path: "/settings/notifications"
});

export default function NotificationsPage() {
  return (
    <>
      <PageHeader title="通知設定" description="セール前の見直しタイミングを保存します。実メール送信は後続フェーズで接続します。" />
      <NotificationSettings />
    </>
  );
}
