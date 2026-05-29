import { LegalPage } from "@/components/legal/LegalPage";
import { buildPageMetadata } from "@/lib/utils/metadata";

export const metadata = buildPageMetadata({
  title: "プライバシーポリシー",
  description: "匿名ID、ローカル保存、通知設定の扱いについて説明します。",
  path: "/privacy"
});

export default function PrivacyPage() {
  return (
    <LegalPage
      title="プライバシーポリシー"
      description="保存データと共有時の扱いを明記します。"
      sections={[
        { heading: "保存する情報", body: "匿名ID、欲しいもの、希望価格、実質価格メモ、通知設定、閲覧履歴を保存する場合があります。Firebase未設定のローカル環境ではlocalStorageに保存します。" },
        { heading: "共有", body: "Xシェア文面には保存URL、匿名ID、非公開メモを含めない設計にしています。" },
        { heading: "広告・アフィリエイト", body: "広告配信やアフィリエイトリンクを含む可能性があります。将来の広告配信では各配信事業者のポリシーに従います。" }
      ]}
    />
  );
}
