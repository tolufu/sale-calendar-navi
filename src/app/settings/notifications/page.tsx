import { PageHeader } from "@/components/ui/PageHeader";
import { NotificationSettings } from "@/features/notifications/NotificationSettings";

export default function NotificationsPage() {
  return (
    <>
      <PageHeader title="通知設定" description="セール前に見直す日数を保存します。通知実行方式は後続フェーズで拡張します。" />
      <NotificationSettings />
    </>
  );
}
