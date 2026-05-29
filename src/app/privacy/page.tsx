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
        { heading: "Cookie・広告識別子", body: "広告配信やアクセス解析を導入する場合、Cookie、広告識別子、端末情報、閲覧ページなどが広告配信事業者により利用されることがあります。現時点で本サービスは商品価格・在庫・レビューを外部ECから自動取得しません。" },
        { heading: "広告のオプトアウト", body: "パーソナライズ広告は、Google 広告設定など各広告配信事業者が提供する設定ページから無効化できる場合があります。広告配信を導入する際は、利用する配信事業者のポリシーとオプトアウト導線を確認できるようにします。" },
        { heading: "データ削除", body: "欲しいもの、閲覧履歴、通知設定はアプリ内の削除機能で削除できます。ローカル保存の内容をまとめて削除したい場合は、ブラウザのサイトデータまたはlocalStorageを削除してください。Firebase連携時の削除依頼窓口は、お問い合わせページで案内します。" },
        { heading: "広告・アフィリエイト", body: "広告配信やアフィリエイトリンクを含む可能性があります。将来の広告配信では各配信事業者のポリシーに従います。" }
      ]}
    />
  );
}
