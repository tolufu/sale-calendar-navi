import Link from "next/link";
import { AdPlaceholder } from "@/components/ui/AdPlaceholder";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { merchants } from "@/data/merchants";
import { saleEvents } from "@/data/sales";
import { formatDateTime } from "@/lib/utils/date";
import { getMerchantToneClass } from "@/lib/utils/merchant";

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
        <AdPlaceholder />
      </section>
    </div>
  );
}
