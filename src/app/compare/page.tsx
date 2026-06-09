import { PageHeader } from "@/components/ui/PageHeader";
import { ComparePageClient } from "@/features/compare/ComparePageClient";
import { buildPageMetadata } from "@/lib/utils/metadata";

export const metadata = buildPageMetadata({
  title: "価格比較",
  description: "複数ECの公式APIから取得した候補を、取得時点の参考値として比較できます。",
  path: "/compare"
});

export default function ComparePage() {
  return (
    <div>
      <PageHeader title="価格比較" description="楽天、Yahoo!ショッピング、eBayの公式APIから取得した候補を参考価格として比較します。" />
      <ComparePageClient />
    </div>
  );
}
