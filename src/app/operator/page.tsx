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
      description="公開前の仮情報です。"
      sections={[
        { heading: "運営者", body: "セールカレンダー比較ナビ運営準備中" },
        { heading: "サービス内容", body: "セール予定を起点に、ユーザー自身が入力した買い物メモを管理するWebアプリです。" },
        { heading: "収益化", body: "広告枠やアフィリエイトリンクを含む可能性があります。公式ECサービスではありません。" }
      ]}
    />
  );
}
