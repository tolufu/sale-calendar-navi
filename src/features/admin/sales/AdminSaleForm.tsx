"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toast } from "@/components/ui/Toast";
import { getAdminRepositories, getRepositories } from "@/lib/repositories";
import type { Merchant } from "@/lib/repositories/types";
import {
  buildSaleEvent,
  createSaleFormValues,
  validateSaleForm,
  type SaleFormErrors,
  type SaleFormValues
} from "@/lib/sales/admin";

type LoadState = "loading" | "success" | "not-found" | "error";

export function AdminSaleForm({ id }: { id?: string }) {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [values, setValues] = useState<SaleFormValues>(() => createSaleFormValues());
  const [savedId, setSavedId] = useState(id);
  const [errors, setErrors] = useState<SaleFormErrors>({});
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    setLoadState("loading");
    try {
      const merchantItems = await getRepositories().merchants.list();
      setMerchants(merchantItems);
      if (!id) {
        setValues(createSaleFormValues(undefined, merchantItems));
        setLoadState("success");
        return;
      }

      const event = await getAdminRepositories().sales.get(id);
      if (!event) {
        setLoadState("not-found");
        return;
      }
      setValues(createSaleFormValues(event, merchantItems));
      setLoadState("success");
    } catch {
      setLoadState("error");
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateSaleForm(values, merchants);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSaving(true);
    try {
      const repository = getAdminRepositories().sales;
      const sale = buildSaleEvent(values, savedId);
      if (!savedId && await repository.get(sale.id)) {
        setErrors({ saleType: "同じEC・セール種別・開始日の予定がすでにあります。" });
        return;
      }
      await repository.upsert(sale);
      setSavedId(sale.id);
      setToast("セール日程を保存しました。");
    } catch {
      setToast("セール日程を保存できませんでした。");
    } finally {
      setIsSaving(false);
    }
  }

  if (loadState === "loading") return <Skeleton className="h-96 w-full" />;
  if (loadState === "error") return <ErrorState message="セール日程を読み込めませんでした。" onRetry={() => void load()} />;
  if (loadState === "not-found") return <EmptyState title="セール日程が見つかりません" description="一覧から編集対象を選び直してください。" />;

  return (
    <div>
      <PageHeader title={savedId ? "セール日程を編集" : "セール日程を作成"} description="日程と説明は手入力で管理します。開始日時と終了日時はJSTで入力してください。" />
      <Link href="/admin/sales" className="mb-4 inline-block text-sm font-semibold text-accent hover:underline">セール日程一覧へ戻る</Link>
      <Card>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="EC" error={errors.merchantId}>
              <select className={inputClass} name="merchantId" value={values.merchantId} onChange={handleChange}>
                {merchants.map((merchant) => <option key={merchant.merchantId} value={merchant.merchantId}>{merchant.name}</option>)}
              </select>
            </Field>
            <Field label="セール種別" error={errors.saleType}>
              <input className={inputClass} name="saleType" value={values.saleType} onChange={handleChange} required />
            </Field>
          </div>
          <Field label="タイトル" error={errors.title}>
            <input className={inputClass} name="title" value={values.title} onChange={handleChange} required />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="開始日時（JST）" error={errors.startAt}>
              <input className={inputClass} type="datetime-local" name="startAt" value={values.startAt} onChange={handleChange} required />
            </Field>
            <Field label="終了日時（JST）" error={errors.endAt}>
              <input className={inputClass} type="datetime-local" name="endAt" value={values.endAt} onChange={handleChange} required />
            </Field>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="日程の確度" error={errors.confidence}>
              <select className={inputClass} name="confidence" value={values.confidence} onChange={handleChange}>
                <option value="confirmed">確定・開催実績あり</option>
                <option value="estimated">予測・公式未発表</option>
              </select>
            </Field>
            <Field label="根拠URL（https・任意）" error={errors.sourceUrl}>
              <input className={inputClass} type="url" name="sourceUrl" value={values.sourceUrl} onChange={handleChange} />
            </Field>
          </div>
          <Field label="説明" error={errors.description}>
            <textarea className={inputClass} name="description" rows={4} value={values.description} onChange={handleChange} />
          </Field>
          <Field label="攻略メモ（任意）" error={errors.strategyMemo}>
            <textarea className={inputClass} name="strategyMemo" rows={4} value={values.strategyMemo} onChange={handleChange} />
          </Field>
          <Field label="確度メモ（任意）" error={errors.confidenceNote}>
            <textarea className={inputClass} name="confidenceNote" rows={3} value={values.confidenceNote} onChange={handleChange} />
          </Field>
          <Button type="submit" disabled={isSaving}>{isSaving ? "保存中..." : "保存"}</Button>
        </form>
      </Card>
      {toast ? <Toast message={toast} variant={toast.includes("できません") ? "error" : "success"} onClose={() => setToast("")} /> : null}
    </div>
  );
}

const inputClass = "mt-1 w-full rounded-btn border border-line bg-white px-3 py-2 text-sm text-ink";

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-sm font-semibold text-red-700">{error}</span> : null}
    </label>
  );
}
