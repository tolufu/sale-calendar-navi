import { PageHeader } from "@/components/ui/PageHeader";
import { HistoryPageClient } from "@/features/history/HistoryPageClient";

export default function HistoryPage() {
  return (
    <>
      <PageHeader title="履歴" description="購入済みメモの振り返り画面です。" />
      <HistoryPageClient />
    </>
  );
}
