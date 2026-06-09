import type {
  Merchant,
  MerchantIntegrationStatus,
  MerchantType
} from "@/lib/repositories/types";

export const MERCHANT_PLACEHOLDER_KEYS = ["blue-box", "red-bag"] as const;
export const MERCHANT_PLACEHOLDER_IMAGE_TYPES = ["generic", "blue-box", "red-bag"] as const;

export type MerchantFormValues = {
  merchantId: string;
  name: string;
  type: MerchantType;
  colorToken: string;
  placeholderKey: string;
  placeholderImageType: string;
  urlHosts: string;
  affiliateProvider: string;
  affiliateEnabled: boolean;
  supportsAffiliate: boolean;
  supportsApi: boolean;
  supportsPriceAutoFetch: boolean;
  supportsSaleCalendar: boolean;
  integrationStatus: MerchantIntegrationStatus;
  isActive: boolean;
  sortOrder: string;
};

export type MerchantFormErrors = Partial<Record<keyof MerchantFormValues, string>>;

const MERCHANT_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HOST_PATTERN = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export function createMerchantFormValues(merchant?: Merchant): MerchantFormValues {
  return {
    merchantId: merchant?.merchantId ?? "",
    name: merchant?.name ?? "",
    type: merchant?.type ?? "marketplace",
    colorToken: merchant?.colorToken ?? "",
    placeholderKey: merchant?.placeholderKey ?? MERCHANT_PLACEHOLDER_KEYS[0],
    placeholderImageType: merchant?.placeholderImageType ?? MERCHANT_PLACEHOLDER_IMAGE_TYPES[0],
    urlHosts: merchant?.urlHosts?.join(", ") ?? "",
    affiliateProvider: merchant?.affiliateProvider ?? "",
    affiliateEnabled: merchant?.affiliate?.enabled ?? false,
    supportsAffiliate: merchant?.supportsAffiliate ?? false,
    supportsApi: merchant?.supportsApi ?? false,
    supportsPriceAutoFetch: merchant?.supportsPriceAutoFetch ?? false,
    supportsSaleCalendar: merchant?.supportsSaleCalendar ?? true,
    integrationStatus: merchant?.integrationStatus ?? "manual-only",
    isActive: merchant?.isActive ?? true,
    sortOrder: String(merchant?.sortOrder ?? 100)
  };
}

export function validateMerchantForm(
  values: MerchantFormValues,
  existingMerchants: Merchant[],
  originalMerchantId?: string
): MerchantFormErrors {
  const errors: MerchantFormErrors = {};
  const merchantId = values.merchantId.trim();
  const hosts = parseUrlHosts(values.urlHosts);
  const sortOrder = Number(values.sortOrder);

  if (!merchantId) {
    errors.merchantId = "merchantIdは必須です。";
  } else if (!MERCHANT_ID_PATTERN.test(merchantId)) {
    errors.merchantId = "merchantIdは英小文字・数字・ハイフンで指定してください。";
  } else if (merchantId !== originalMerchantId && existingMerchants.some((merchant) => merchant.merchantId === merchantId)) {
    errors.merchantId = "同じmerchantIdがすでに存在します。";
  }
  if (!values.name.trim()) errors.name = "表示名は必須です。";
  if (!values.colorToken.trim()) errors.colorToken = "配色トークンは必須です。";
  if (!MERCHANT_PLACEHOLDER_KEYS.includes(values.placeholderKey as (typeof MERCHANT_PLACEHOLDER_KEYS)[number])) {
    errors.placeholderKey = "登録済みのプレースホルダーを選択してください。";
  }
  if (!MERCHANT_PLACEHOLDER_IMAGE_TYPES.includes(values.placeholderImageType as (typeof MERCHANT_PLACEHOLDER_IMAGE_TYPES)[number])) {
    errors.placeholderImageType = "登録済みの画像種別を選択してください。";
  }
  if (hosts.some((host) => !HOST_PATTERN.test(host))) {
    errors.urlHosts = "URLホストはスキームやパスを含めず、カンマ区切りで指定してください。";
  }
  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    errors.sortOrder = "並び順は0以上の整数で指定してください。";
  }
  if ((values.supportsAffiliate || values.affiliateEnabled) && !values.affiliateProvider.trim()) {
    errors.affiliateProvider = "アフィリエイト対応時はプロバイダを指定してください。";
  }
  if (values.affiliateEnabled && !values.supportsAffiliate) {
    errors.affiliateEnabled = "変換を有効にする場合はアフィリエイト対応も有効にしてください。";
  }
  if (values.supportsPriceAutoFetch && !values.supportsApi) {
    errors.supportsPriceAutoFetch = "価格自動取得には公式API対応が必要です。";
  }

  return errors;
}

export function buildMerchant(values: MerchantFormValues): Merchant {
  const affiliateProvider = values.affiliateProvider.trim() || null;
  return {
    merchantId: values.merchantId.trim(),
    name: values.name.trim(),
    type: values.type,
    colorToken: values.colorToken.trim(),
    placeholderKey: values.placeholderKey,
    placeholderImageType: values.placeholderImageType,
    urlHosts: parseUrlHosts(values.urlHosts),
    affiliate: affiliateProvider && values.affiliateEnabled
      ? { provider: affiliateProvider, enabled: true }
      : null,
    affiliateProvider,
    supportsAffiliate: values.supportsAffiliate,
    supportsApi: values.supportsApi,
    supportsPriceAutoFetch: values.supportsPriceAutoFetch,
    supportsSaleCalendar: values.supportsSaleCalendar,
    integrationStatus: values.integrationStatus,
    isActive: values.isActive,
    sortOrder: Number(values.sortOrder)
  };
}

function parseUrlHosts(value: string): string[] {
  return [...new Set(
    value
      .split(",")
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean)
  )];
}
