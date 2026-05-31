import type { Metadata } from "next";
import { KeyRound, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "復旧コード",
  description: "復旧コードでデータを引き継ぐための画面です。クラウド保存対応後に利用できます。"
};

export default function RecoveryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="復旧コードでデータを引き継ぐ"
        description="別の端末やブラウザで登録した欲しいもの・履歴を、復旧コードを使って引き継ぐための画面です。"
      />

      <Card className="space-y-4">
        <div className="flex items-center gap-2 text-accent">
          <KeyRound className="h-5 w-5" aria-hidden />
          <h2 className="text-base font-bold text-ink">復旧コードを入力</h2>
        </div>
        <p className="text-sm leading-6 text-muted">
          発行済みの復旧コードを入力してください。形式は半角英数字です。
        </p>
        <div>
          <label htmlFor="recovery-code" className="mb-1 block text-sm font-semibold text-ink">
            復旧コード
          </label>
          <input
            id="recovery-code"
            name="recovery-code"
            inputMode="text"
            autoComplete="off"
            placeholder="例: ABCD-1234-EFGH"
            disabled
            aria-describedby="recovery-code-note"
            className="w-full rounded-btn border border-line bg-surfaceMuted px-3 py-2 text-sm text-ink placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
          />
          <p id="recovery-code-note" className="mt-2 text-xs text-muted">
            現在この入力欄は無効です。
          </p>
        </div>
        <Button type="button" variant="primary" disabled className="w-full sm:w-auto">
          データを復旧する（準備中）
        </Button>
      </Card>

      <Card className="space-y-3 border-amber-200 bg-amber-50">
        <div className="flex items-center gap-2 text-amber-700">
          <ShieldAlert className="h-5 w-5" aria-hidden />
          <h2 className="text-base font-bold text-amber-900">この機能はまだ利用できません</h2>
        </div>
        <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-amber-900">
          <li>復旧コードによる引き継ぎは、クラウド保存（Firestore）への対応後に利用可能になります。</li>
          <li>現時点では復旧処理は行われず、入力したコードは送信・保存されません。</li>
          <li>この画面を開いても、いまお使いの端末に保存されているデータは消去されません。</li>
        </ul>
      </Card>

      <Card className="space-y-2">
        <h2 className="text-base font-bold text-ink">補足</h2>
        <p className="text-sm leading-6 text-muted">
          現在、欲しいものや履歴はお使いのブラウザ内（ローカル保存）にのみ保存されています。
          別端末との同期や復旧コードの発行・引き継ぎ、通知メールの配信は、今後のアップデートで順次対応予定です。
        </p>
      </Card>
    </div>
  );
}
