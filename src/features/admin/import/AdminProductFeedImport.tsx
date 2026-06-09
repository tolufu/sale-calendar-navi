"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import type { ProductFeedCsvPreview } from "@/lib/import/csv/schema";
import { validateProductFeedCsv } from "@/lib/import/csv/validate";
import { getRepositories } from "@/lib/repositories";
import type { Merchant } from "@/lib/repositories/types";

export function AdminProductFeedImport() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [content, setContent] = useState("");
  const [preview, setPreview] = useState<ProductFeedCsvPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setMerchants(await getRepositories().merchants.list());
    } catch {
      setError("ECマスタを読み込めませんでした。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setContent(await file.text());
    setPreview(null);
  }

  if (loading) return <Skeleton className="h-80 w-full" />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  return (
    <div>
      <PageHeader
        title="商品フィードCSV検証"
        description="手動で準備した商品フィードCSVをドライランします。外部サイトからの自動取得や外部商品画像の登録は行いません。"
      />
      <Link href="/admin" className="mb-4 inline-block text-sm font-semibold text-accent hover:underline">管理者コンソールへ戻る</Link>

      {merchants.length === 0 ? (
        <EmptyState title="有効なECマスタがありません" description="先にECマスタを登録してください。" />
      ) : (
        <Card>
          <p className="text-sm leading-6 text-muted">
            保存先と候補マスタ化の要件は未確定です。この画面では検証プレビューのみ実行できます。imageUrlは空欄にしてください。
          </p>
          <label className="mt-4 block">
            <span className="text-sm font-semibold text-ink">CSVファイルを選択</span>
            <input className="mt-2 block w-full text-sm text-muted" type="file" accept=".csv,text/csv,text/plain" onChange={(event) => void handleFile(event)} />
          </label>
          <label className="mt-5 block">
            <span className="text-sm font-semibold text-ink">またはCSVを貼り付け</span>
            <textarea
              className="mt-2 w-full rounded-btn border border-line bg-white px-3 py-2 font-mono text-xs leading-5 text-ink"
              rows={12}
              value={content}
              onChange={(event) => {
                setContent(event.target.value);
                setPreview(null);
              }}
              placeholder="merchantId,externalId,title,productUrl,affiliateUrl,imageUrl,priceMemo"
            />
          </label>
          <Button className="mt-4" type="button" onClick={() => setPreview(validateProductFeedCsv(content, merchants))} disabled={!content.trim()}>
            ドライラン
          </Button>
        </Card>
      )}

      {preview ? (
        <div className="mt-6 space-y-4">
          <Card>
            <h2 className="text-lg font-bold text-ink">ドライラン結果</h2>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">OK {preview.validCount}行</Badge>
              <Badge className="border-red-200 bg-red-50 text-red-700">スキップ {preview.skippedCount}行</Badge>
              <Badge>候補 {preview.validRows.length}件</Badge>
              {preview.duplicateCount > 0 ? <Badge className="border-amber-200 bg-amber-50 text-amber-700">CSV内重複統合 {preview.duplicateCount}行</Badge> : null}
            </div>
            {preview.fileErrors.length > 0 ? (
              <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-red-700">
                {preview.fileErrors.map((message) => <li key={message}>{message}</li>)}
              </ul>
            ) : null}
            <Button className="mt-4" type="button" disabled>保存先確定後に取込を有効化</Button>
          </Card>

          {preview.rows.map((row) => (
            <Card key={`${row.lineNumber}-${row.row.merchantId}-${row.row.externalId}`} className="text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={row.result.ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}>
                  {row.result.ok ? "OK" : "エラー"}
                </Badge>
                <span className="font-semibold text-muted">{row.lineNumber}行目</span>
                <span className="font-bold text-ink">{row.row.title || "タイトル未入力"}</span>
              </div>
              {!row.result.ok ? (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-red-700">
                  {row.result.errors.map((message) => <li key={message}>{message}</li>)}
                </ul>
              ) : null}
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
