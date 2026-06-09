"use client";

import Link from "next/link";
import { useEffect, useState, type ChangeEvent } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toast } from "@/components/ui/Toast";
import { validateSaleScheduleCsv } from "@/lib/import/csv/sale-schedule-validate";
import type { SaleScheduleCsvPreview } from "@/lib/import/csv/sale-schedule-schema";
import { getAdminRepositories, getRepositories } from "@/lib/repositories";
import type { BulkUpsertResult, Merchant, SaleEvent } from "@/lib/repositories/types";

export function AdminSaleImport() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [existingSales, setExistingSales] = useState<SaleEvent[]>([]);
  const [content, setContent] = useState("");
  const [preview, setPreview] = useState<SaleScheduleCsvPreview | null>(null);
  const [result, setResult] = useState<(BulkUpsertResult & { skipped: number }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    void Promise.all([
      getRepositories().merchants.list(),
      getAdminRepositories().sales.listAll()
    ])
      .then(([merchantItems, saleItems]) => {
        setMerchants(merchantItems);
        setExistingSales(saleItems);
      })
      .catch(() => setError("セール日程またはECマスタを読み込めませんでした。"))
      .finally(() => setLoading(false));
  }, []);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setContent(await file.text());
    setPreview(null);
    setResult(null);
  }

  function handlePreview() {
    setPreview(validateSaleScheduleCsv(content, merchants, existingSales));
    setResult(null);
  }

  async function handleImport() {
    if (!preview || preview.fileErrors.length > 0 || preview.validEvents.length === 0) {
      return;
    }

    setIsImporting(true);
    try {
      const imported = await getAdminRepositories().sales.bulkUpsert(preview.validEvents);
      setResult({ ...imported, skipped: preview.skippedCount });
      setToast("有効なセール日程を取り込みました。");
    } catch {
      setToast("セール日程を取り込めませんでした。");
    } finally {
      setIsImporting(false);
    }
  }

  if (loading) return <Skeleton className="h-80 w-full" />;
  if (error) return <ErrorState message={error} />;

  return (
    <div>
      <PageHeader title="セール日程CSV取込" description="手動で準備したCSVをドライランし、有効な行だけを保存します。外部サイトからの自動取得は行いません。" />
      <Link href="/admin/sales" className="mb-4 inline-block text-sm font-semibold text-accent hover:underline">セール日程一覧へ戻る</Link>

      <Card>
        <label className="block">
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
              setResult(null);
            }}
            placeholder="merchantId,title,saleType,startAt,endAt,confidence,sourceUrl,note"
          />
        </label>
        <Button className="mt-4" type="button" onClick={handlePreview} disabled={!content.trim()}>ドライラン</Button>
      </Card>

      {preview ? (
        <div className="mt-6 space-y-4">
          <Card>
            <h2 className="text-lg font-bold text-ink">ドライラン結果</h2>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">OK {preview.validCount}行</Badge>
              <Badge className="border-red-200 bg-red-50 text-red-700">スキップ {preview.skippedCount}行</Badge>
              <Badge>保存対象 {preview.validEvents.length}件</Badge>
              {preview.duplicateCount > 0 ? (
                <Badge className="border-amber-200 bg-amber-50 text-amber-700">CSV内重複統合 {preview.duplicateCount}行</Badge>
              ) : null}
            </div>
            {preview.fileErrors.length > 0 ? (
              <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-red-700">
                {preview.fileErrors.map((message) => <li key={message}>{message}</li>)}
              </ul>
            ) : null}
            <Button
              className="mt-4"
              type="button"
              onClick={() => void handleImport()}
              disabled={preview.fileErrors.length > 0 || preview.validEvents.length === 0 || isImporting}
            >
              {isImporting ? "取込中..." : "有効な行を確定して取り込む"}
            </Button>
          </Card>

          {preview.rows.length > 0 ? (
            <div className="space-y-3">
              {preview.rows.map((row) => (
                <Card key={`${row.lineNumber}-${row.row.merchantId}-${row.row.title}`} className="text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={row.result.ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}>
                      {row.result.ok ? "OK" : "エラー"}
                    </Badge>
                    {row.result.ok && row.mode ? (
                      <Badge className={row.mode === "update" ? "border-sky-200 bg-sky-50 text-sky-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}>
                        {row.mode === "update" ? "既存を更新" : "新規"}
                      </Badge>
                    ) : null}
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
      ) : null}

      {result ? (
        <Card className="mt-6 border-emerald-200 bg-emerald-50">
          <h2 className="font-bold text-emerald-900">取込結果</h2>
          <p className="mt-2 text-sm text-emerald-800">新規 {result.created}件 / 更新 {result.updated}件 / スキップ {result.skipped}行</p>
        </Card>
      ) : null}
      {toast ? <Toast message={toast} variant={toast.includes("できません") ? "error" : "success"} onClose={() => setToast("")} /> : null}
    </div>
  );
}
