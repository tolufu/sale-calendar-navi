import Link from "next/link";
import { AdPlaceholder } from "@/components/ui/AdPlaceholder";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { merchants } from "@/data/merchants";
import { saleEvents } from "@/data/sales";
import { formatDateTime } from "@/lib/utils/date";
import { buildPageMetadata } from "@/lib/utils/metadata";
import { getMerchantToneClass } from "@/lib/utils/merchant";

export const metadata = buildPageMetadata({
  title: "セール予定と買い物メモをひとつに",
  description: "Amazon・楽天のセール予定を起点に、商品URL、希望価格、実質価格メモを手入力で保存できます。",
  path: "/"
});

export default function HomePage() {
  const upcoming = saleEvents.slice(0, 3);
  const merchantById = new Map(merchants.map((merchant) => [merchant.merchantId, merchant]));

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <div>
          <PageHeader
            title="セール予定と買い物メモをひとつに"
            description="Amazon・楽天のセール予定を見ながら、欲しい商品URL、希望価格、実質価格メモを手入力で保存できます。価格や商品画像の自動取得は行いません。"
            action={<Link href="/calendar"><Button>カレンダーを見る</Button></Link>}
          />
          <div className="grid gap-4 md:grid-cols-3">
            {upcoming.map((sale) => (
              <Link key={sale.id} href={`/sales/${sale.id}`}>
                <Card className="h-full hover:bg-surface">
                  <Badge className={getMerchantToneClass(merchantById.get(sale.merchantId))}>{sale.saleType}</Badge>
                  <h2 className="mt-2 font-bold">{sale.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-muted">{formatDateTime(sale.startAt)} 開始</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
        <AdPlaceholder label="トップ広告枠" slot="home-sidebar" />
      </section>
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold">新着記事</h2>
          <Link href="/articles" className="text-sm font-semibold text-accent">記事一覧へ</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {["monthly-sale-prep", "sale-strategy-basics", "amazon-rakuten-compare"].map((slug) => (
            <Link key={slug} href={`/articles/${slug}`}>
              <Card className="h-full hover:bg-surface">
                <h3 className="font-bold">{slug === "monthly-sale-prep" ? "月別セールまとめ" : slug === "sale-strategy-basics" ? "セール攻略" : "Amazon/楽天比較"}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">セール前の確認項目をメモとして整理します。</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
