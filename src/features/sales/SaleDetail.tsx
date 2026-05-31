"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, CalendarRange, CheckCircle2, ExternalLink, Share2, Store } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AdPlaceholder } from "@/components/ui/AdPlaceholder";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { articles } from "@/data/articles";
import { getAnonymousUserId } from "@/lib/firebase/auth";
import { getRepositories } from "@/lib/repositories";
import type { Merchant, SaleEvent, WishItem } from "@/lib/repositories/types";
import { formatDate, formatDateTime, formatSaleStatus, getSaleStatus, type SaleStatus } from "@/lib/utils/date";
import { getMerchantToneClass } from "@/lib/utils/merchant";
import { formatPrice } from "@/lib/utils/price";
import { buildSaleShareText, buildXIntentUrl } from "@/lib/utils/share";

function statusToneClass(status: SaleStatus): string {
  if (status === "active") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "upcoming") return "border-blue-200 bg-blue-50 text-blue-700";
  return "border-line bg-surface text-muted";
}

function placeholderPath(key: string): string {
  return `/images/placeholders/${key}.svg`;
}

export function SaleDetail({ saleId }: { saleId: string }) {
  const [sale, setSale] = useState<SaleEvent | null>(null);
  const [relatedSales, setRelatedSales] = useState<SaleEvent[]>([]);
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [wishes, setWishes] = useState<WishItem[]>([]);
  const [savedToHistory, setSavedToHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async function load() {
    setLoading(true);
    setError(null);
    try {
      const repositories = getRepositories();
      const userId = await getAnonymousUserId();
      const [saleItem, allSales, allMerchants, wishItems] = await Promise.all([
        repositories.sales.get(saleId),
        repositories.sales.list(),
        repositories.merchants.list(),
        repositories.wishlist.list(userId)
      ]);
      setSale(saleItem);
      setWishes(wishItems.filter((item) => item.targetSaleEventId === saleId));
      if (saleItem) {
        setMerchant(allMerchants.find((entry) => entry.merchantId === saleItem.merchantId) ?? null);
        setRelatedSales(
          (saleItem.relatedSaleEventIds ?? [])
            .map((id) => allSales.find((entry) => entry.id === id))
            .filter((entry): entry is SaleEvent => Boolean(entry))
        );
        await repositories.history.create(userId, {
          type: "sale",
          title: saleItem.title,
          href: `/sales/${saleItem.id}`,
          merchantId: saleItem.merchantId,
          occurredAt: new Date().toISOString(),
          memo: "セール詳細を表示"
        });
        setSavedToHistory(true);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "セール詳細を読み込めませんでした。");
    } finally {
      setLoading(false);
    }
  }, [saleId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <Skeleton className="h-80 w-full" />;
  }
  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }
  if (!sale) {
    return <EmptyState title="セール予定が見つかりません" description="カレンダーから別の予定を選び直してください。" />;
  }

  const status = getSaleStatus(sale.startAt, sale.endAt);
  const merchantName = merchant?.name ?? sale.merchantId;
  const strategyPoints = (sale.strategyMemo ?? "")
    .split(/[。\n]/)
    .map((line) => line.trim())
    .filter(Boolean);
  const relatedArticles = articles.slice(0, 3);

  return (
    <div className="space-y-5">
      <nav className="text-sm text-muted" aria-label="パンくず">
        <Link href="/" className="hover:text-accent">ホーム</Link>
        <span className="mx-2">/</span>
        <Link href="/calendar" className="hover:text-accent">セールカレンダー</Link>
        <span className="mx-2">/</span>
        <span className="text-ink">{sale.title}</span>
      </nav>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* メインカラム */}
        <div className="space-y-5">
          <Card>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={getMerchantToneClass(merchant)}>{merchantName}</Badge>
              <Badge>{sale.saleType}</Badge>
              <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusToneClass(status)}`}>
                {formatSaleStatus(status)}
              </span>
            </div>
            <h1 className="mt-4 text-2xl font-bold leading-tight text-ink sm:text-3xl">{sale.title}</h1>
            <p className="mt-3 inline-flex items-center gap-2 text-sm text-muted">
              <CalendarRange className="h-4 w-4 shrink-0 text-accent" aria-hidden />
              {formatDateTime(sale.startAt)} 〜 {formatDateTime(sale.endAt)}
            </p>
            <p className="mt-4 leading-7 text-ink">{sale.description}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {sale.sourceUrl ? (
                <a
                  href={sale.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-btn bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accentDark"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden />
                  公式サイトで確認
                </a>
              ) : null}
              <a
                href={buildXIntentUrl(buildSaleShareText(sale))}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center gap-1.5 rounded-btn border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-surface"
              >
                <Share2 className="h-4 w-4" aria-hidden />
                Xで共有
              </a>
              <Link href={`/wishlist/new?saleId=${sale.id}&merchantId=${sale.merchantId}`}>
                <Button variant="cta" className="gap-1.5">欲しいものを登録</Button>
              </Link>
            </div>
            {savedToHistory ? (
              <p className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-surface px-3 py-1.5 text-xs font-semibold text-muted">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden />
                この予定を履歴に保存しました
              </p>
            ) : null}
          </Card>

          {strategyPoints.length ? (
            <Card>
              <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
                <CheckCircle2 className="h-5 w-5 text-accent" aria-hidden />
                攻略メモ
              </h2>
              <ul className="mt-3 space-y-2">
                {strategyPoints.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-sm leading-6 text-ink">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                    <span>{point}。</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs leading-5 text-muted">
                条件やポイント施策は変更される場合があります。購入前に各サイトで最新情報を確認してください。
              </p>
            </Card>
          ) : null}

          <Card>
            <h2 className="text-lg font-bold text-ink">この予定に登録した欲しいもの</h2>
            {wishes.length === 0 ? (
              <div className="mt-3">
                <EmptyState
                  title="紐づく欲しいものはまだありません"
                  description="商品URLと希望価格を登録して、セール前に見直せるようにします。"
                  action={<Link href={`/wishlist/new?saleId=${sale.id}&merchantId=${sale.merchantId}`}><Button>この予定に登録</Button></Link>}
                />
              </div>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {wishes.map((item) => (
                  <div key={item.id} className="flex gap-3 rounded-card border border-line bg-white p-3">
                    <Image
                      src={placeholderPath(item.placeholderKey)}
                      alt=""
                      width={64}
                      height={64}
                      className="h-16 w-16 shrink-0 rounded-lg border border-line bg-surface"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{item.title}</p>
                      <p className="mt-1 text-sm text-muted">希望価格: {formatPrice(item.desiredPrice)}</p>
                      {item.actualPriceMemo ? <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{item.actualPriceMemo}</p> : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <AdPlaceholder label="セール詳細広告枠" slot="sale-detail-inline" />

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
                <BookOpen className="h-5 w-5 text-accent" aria-hidden />
                関連記事
              </h2>
              <Link href="/articles" className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
                記事一覧へ
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {relatedArticles.map((article) => (
                <Link
                  key={article.slug}
                  href={`/articles/${article.slug}`}
                  className="rounded-card border border-line p-3 text-sm transition hover:bg-surface"
                >
                  <p className="text-xs font-semibold text-muted">{formatDate(article.publishedAt)}</p>
                  <p className="mt-1 font-semibold leading-5 text-ink">{article.title}</p>
                </Link>
              ))}
            </div>
          </Card>
        </div>

        {/* サイドバー */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <h2 className="text-base font-bold text-ink">セール概要</h2>
            <dl className="mt-3 space-y-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <dt className="inline-flex items-center gap-1.5 text-muted"><Store className="h-4 w-4" aria-hidden />EC</dt>
                <dd className="text-right font-semibold text-ink">{merchantName}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted">セール種別</dt>
                <dd className="text-right font-semibold text-ink">{sale.saleType}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted">ステータス</dt>
                <dd className="text-right font-semibold text-ink">{formatSaleStatus(status)}</dd>
              </div>
              <div className="border-t border-line pt-3">
                <dt className="text-muted">期間</dt>
                <dd className="mt-1 font-semibold text-ink">{formatDateTime(sale.startAt)}</dd>
                <dd className="font-semibold text-ink">〜 {formatDateTime(sale.endAt)}</dd>
              </div>
            </dl>
          </Card>

          {relatedSales.length ? (
            <Card>
              <h2 className="text-base font-bold text-ink">関連セール</h2>
              <div className="mt-3 space-y-2">
                {relatedSales.map((related) => (
                  <Link
                    key={related.id}
                    href={`/sales/${related.id}`}
                    className="flex items-center justify-between gap-2 rounded-btn border border-line px-3 py-2 text-sm font-semibold text-ink transition hover:bg-surface"
                  >
                    <span className="min-w-0 truncate">{related.title}</span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-accent" aria-hidden />
                  </Link>
                ))}
              </div>
            </Card>
          ) : null}

          <AdPlaceholder label="サイドバー広告枠" slot="sale-detail-sidebar" />
        </aside>
      </div>
    </div>
  );
}
