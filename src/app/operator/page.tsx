import { LegalPage } from "@/components/legal/LegalPage";
import { buildPageMetadata } from "@/lib/utils/metadata";

export const metadata = buildPageMetadata({
  title: "運営者情報",
  description: "セールカレンダー比較ナビの運営者情報ページです。",
  path: "/operator"
});

export default function OperatorPage() {
  return (
    <LegalPage
      title="運営者情報"
      description="セールカレンダー比較ナビの運営方針と連絡方法を案内します。"
      sections={[
        { heading: "運営者", body: "セールカレンダー比較ナビ運営事務局" },
        { heading: "連絡方法", body: "ご意見、ご質問、削除依頼はお問い合わせページからご連絡ください。内容を確認のうえ、必要に応じて返信します。" },
        { heading: "サービス内容", body: "セール予定を起点に、ユーザー自身が確認した商品URL、希望価格、実質価格メモを管理するWebアプリです。外部ECの価格や在庫をスクレイピングで取得しません。" },
        { heading: "収益化", body: "本サービスには広告枠やアフィリエイトリンクが含まれる場合があります。Amazon、楽天その他ECの公式サービスではありません。" }
      ]}
    />
  );
}
