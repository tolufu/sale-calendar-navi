import { LegalPage } from "@/components/legal/LegalPage";
import { buildPageMetadata } from "@/lib/utils/metadata";

export const metadata = buildPageMetadata({
  title: "利用規約",
  description: "セールカレンダー比較ナビの利用条件です。",
  path: "/terms"
});

export default function TermsPage() {
  return (
    <LegalPage
      title="利用規約"
      description="本サービスは買い物メモを補助する非公式ツールです。"
      sections={[
        { heading: "サービスの位置づけ", body: "本サービスはAmazon、楽天その他ECの公式サービスではありません。公式ロゴや公式サービスと誤認される表示は行いません。" },
        { heading: "価格情報", body: "価格、在庫、商品画像、レビューを外部サイトから自動取得しません。希望価格や実質価格メモはユーザー自身が入力した参考情報です。" },
        { heading: "広告・アフィリエイト", body: "本サービスには広告枠やアフィリエイトリンクが含まれる可能性があります。実広告コードは審査・運用準備後に別途設定します。" }
      ]}
    />
  );
}
