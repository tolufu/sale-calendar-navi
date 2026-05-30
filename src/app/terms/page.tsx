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
        { heading: "価格情報", body: "価格、在庫、レビューを外部サイトからスクレイピングで取得しません。希望価格や実質価格メモはユーザー自身が入力した参考情報です。購入前に各ECサイトで最新条件をご確認ください。" },
        { heading: "商品画像", body: "v1〜v1.2 は自作プレースホルダーのみを表示します。v2以降は楽天公式APIが返した商品画像URLに限り、出典を明記して表示する場合があります。ユーザー任意の画像URL入力やスクレイピングによる画像取得は行いません。" },
        { heading: "広告・アフィリエイト", body: "本サービスには広告枠やアフィリエイトリンクが含まれる場合があります。リンクを経由した購入により、運営者が報酬を受け取る場合があります。" },
        { heading: "免責事項", body: "セール予定、リンク先、ポイント、クーポンなどの条件は変更される場合があります。本サービスのメモを参考にする場合も、購入前に各ECサイトで最新情報をご確認ください。" }
      ]}
    />
  );
}
