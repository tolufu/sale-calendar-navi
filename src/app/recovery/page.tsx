import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";

export default function RecoveryPage() {
  return (
    <>
      <PageHeader title="復旧" description="ローカルデータのエクスポート/インポートは v1.2 で実装します。" />
      <Card>
        <p className="text-sm leading-6 text-muted">Firebase 未設定時も localStorage に保存されます。移行補助の操作は次フェーズで追加します。</p>
      </Card>
    </>
  );
}
