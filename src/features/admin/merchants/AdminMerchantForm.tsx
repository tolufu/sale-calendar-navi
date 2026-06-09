"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  buildMerchant,
  createMerchantFormValues,
  MERCHANT_PLACEHOLDER_IMAGE_TYPES,
  MERCHANT_PLACEHOLDER_KEYS,
  validateMerchantForm,
  type MerchantFormErrors,
  type MerchantFormValues
} from "@/lib/merchants/admin";
import { getAdminRepositories } from "@/lib/repositories";
import type { Merchant } from "@/lib/repositories/types";

export function AdminMerchantForm({ merchantId }: { merchantId?: string }) {
  const router = useRouter();
  const [values, setValues] = useState<MerchantFormValues>(() => createMerchantFormValues());
  const [existingMerchants, setExistingMerchants] = useState<Merchant[]>([]);
  const [errors, setErrors] = useState<MerchantFormErrors>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void getAdminRepositories().merchants.listAll()
      .then((merchants) => {
        setExistingMerchants(merchants);
        if (!merchantId) {
          return;
        }
        const merchant = merchants.find((item) => item.merchantId === merchantId);
        if (!merchant) {
          throw new Error("ECマスタが見つかりません。");
        }
        setValues(createMerchantFormValues(merchant));
      })
      .catch((error) => setLoadError(error instanceof Error ? error.message : "ECマスタを読み込めませんでした。"))
      .finally(() => setLoading(false));
  }, [merchantId]);

  function update<K extends keyof MerchantFormValues>(key: K, value: MerchantFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateMerchantForm(values, existingMerchants, merchantId);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSaving(true);
    try {
      await getAdminRepositories().merchants.upsert(buildMerchant(values));
      router.push("/admin/merchants");
      router.refresh();
    } catch {
      setLoadError("ECマスタを保存できませんでした。");
    } finally {
      setIsSaving(false);
    }
  }

  if (loading) return <Skeleton className="h-96 w-full" />;
  if (loadError) return <ErrorState message={loadError} />;

  return (
    <div>
      <PageHeader
        title={merchantId ? "ECマスタ編集" : "ECマスタ追加"}
        description="商品画像は登録済みプレースホルダーのみ選択できます。外部画像URLや外部データの自動取得先は登録しません。"
      />
      <Link href="/admin/merchants" className="mb-4 inline-block text-sm font-semibold text-accent hover:underline">ECマスタ一覧へ戻る</Link>

      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5">
        <Card className="grid gap-5 sm:grid-cols-2">
          <Field label="merchantId" error={errors.merchantId}>
            <input className={inputClass} value={values.merchantId} disabled={Boolean(merchantId)} onChange={(event) => update("merchantId", event.target.value)} />
          </Field>
          <Field label="表示名" error={errors.name}>
            <input className={inputClass} value={values.name} onChange={(event) => update("name", event.target.value)} />
          </Field>
          <Field label="種別">
            <select className={inputClass} value={values.type} onChange={(event) => update("type", event.target.value as MerchantFormValues["type"])}>
              <option value="marketplace">marketplace</option>
              <option value="retailer">retailer</option>
              <option value="b2b">b2b</option>
              <option value="other">other</option>
            </select>
          </Field>
          <Field label="配色トークン" error={errors.colorToken}>
            <input className={inputClass} value={values.colorToken} onChange={(event) => update("colorToken", event.target.value)} />
          </Field>
          <Field label="プレースホルダー" error={errors.placeholderKey}>
            <select className={inputClass} value={values.placeholderKey} onChange={(event) => update("placeholderKey", event.target.value)}>
              {MERCHANT_PLACEHOLDER_KEYS.map((key) => <option key={key} value={key}>{key}</option>)}
            </select>
          </Field>
          <Field label="共有用画像種別" error={errors.placeholderImageType}>
            <select className={inputClass} value={values.placeholderImageType} onChange={(event) => update("placeholderImageType", event.target.value)}>
              {MERCHANT_PLACEHOLDER_IMAGE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </Field>
          <Field label="URLホスト（カンマ区切り）" error={errors.urlHosts}>
            <input className={inputClass} value={values.urlHosts} onChange={(event) => update("urlHosts", event.target.value)} placeholder="example.com, shop.example.com" />
          </Field>
          <Field label="並び順" error={errors.sortOrder}>
            <input className={inputClass} type="number" min="0" step="1" value={values.sortOrder} onChange={(event) => update("sortOrder", event.target.value)} />
          </Field>
          <Field label="連携状態">
            <select className={inputClass} value={values.integrationStatus} onChange={(event) => update("integrationStatus", event.target.value as MerchantFormValues["integrationStatus"])}>
              <option value="available">available</option>
              <option value="manual-only">manual-only</option>
              <option value="planned">planned</option>
            </select>
          </Field>
          <Field label="アフィリエイトプロバイダ" error={errors.affiliateProvider}>
            <input className={inputClass} value={values.affiliateProvider} onChange={(event) => update("affiliateProvider", event.target.value)} placeholder="未使用時は空欄" />
          </Field>
        </Card>

        <Card>
          <h2 className="font-bold text-ink">状態・連携機能</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Checkbox label="公開画面で有効" checked={values.isActive} onChange={(checked) => update("isActive", checked)} />
            <Checkbox label="セールカレンダー対応" checked={values.supportsSaleCalendar} onChange={(checked) => update("supportsSaleCalendar", checked)} />
            <Checkbox label="アフィリエイト対応" checked={values.supportsAffiliate} onChange={(checked) => update("supportsAffiliate", checked)} />
            <Checkbox label="アフィリエイト変換を有効化" checked={values.affiliateEnabled} onChange={(checked) => update("affiliateEnabled", checked)} />
            <Checkbox label="公式API対応" checked={values.supportsApi} onChange={(checked) => update("supportsApi", checked)} />
            <Checkbox label="公式APIによる価格候補取得" checked={values.supportsPriceAutoFetch} onChange={(checked) => update("supportsPriceAutoFetch", checked)} />
          </div>
          {errors.affiliateEnabled ? <p className="mt-3 text-sm text-red-700">{errors.affiliateEnabled}</p> : null}
          {errors.supportsPriceAutoFetch ? <p className="mt-3 text-sm text-red-700">{errors.supportsPriceAutoFetch}</p> : null}
        </Card>

        <Button type="submit" disabled={isSaving}>{isSaving ? "保存中..." : "保存"}</Button>
      </form>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <span className="mt-2 block">{children}</span>
      {error ? <span className="mt-1 block text-sm text-red-700">{error}</span> : null}
    </label>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-ink">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}

const inputClass = "w-full rounded-btn border border-line bg-white px-3 py-2 text-sm text-ink";
