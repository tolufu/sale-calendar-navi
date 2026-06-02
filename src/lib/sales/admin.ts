import { parseHttpsUrl } from "@/lib/import/csv/validate";
import type { Merchant, SaleEvent, SaleEventConfidence } from "@/lib/repositories/types";

export type SaleFormValues = {
  merchantId: string;
  title: string;
  saleType: string;
  startAt: string;
  endAt: string;
  confidence: SaleEventConfidence;
  sourceUrl: string;
  description: string;
  strategyMemo: string;
  confidenceNote: string;
};

export type SaleFormErrors = Partial<Record<keyof SaleFormValues, string>>;

export function createSaleFormValues(event?: SaleEvent, merchants: Merchant[] = []): SaleFormValues {
  return {
    merchantId: event?.merchantId ?? merchants.find((merchant) => merchant.isActive)?.merchantId ?? "",
    title: event?.title ?? "",
    saleType: event?.saleType ?? "",
    startAt: event ? toJstDateTimeLocal(event.startAt) : "",
    endAt: event ? toJstDateTimeLocal(event.endAt) : "",
    confidence: event?.confidence ?? "confirmed",
    sourceUrl: event?.sourceUrl ?? "",
    description: event?.description ?? "",
    strategyMemo: event?.strategyMemo ?? "",
    confidenceNote: event?.confidenceNote ?? ""
  };
}

export function validateSaleForm(values: SaleFormValues, merchants: Merchant[]): SaleFormErrors {
  const errors: SaleFormErrors = {};
  const merchant = merchants.find((item) => item.merchantId === values.merchantId);

  if (!merchant || !merchant.isActive) errors.merchantId = "有効なECを選択してください。";
  if (!values.title.trim()) errors.title = "タイトルを入力してください。";
  if (!values.saleType.trim()) errors.saleType = "セール種別を入力してください。";

  const startAt = parseJstDateTime(values.startAt, false);
  const endAt = parseJstDateTime(values.endAt, false);
  if (!startAt) errors.startAt = "開始日時を入力してください。";
  if (!endAt) errors.endAt = "終了日時を入力してください。";
  if (startAt && endAt && startAt > endAt) errors.endAt = "終了日時は開始日時以降にしてください。";

  if (values.confidence !== "confirmed" && values.confidence !== "estimated") {
    errors.confidence = "日程の確度を選択してください。";
  }
  if (values.sourceUrl) {
    const urlErrors: string[] = [];
    parseHttpsUrl(values.sourceUrl.trim(), "sourceUrl", urlErrors);
    if (urlErrors.length > 0) errors.sourceUrl = urlErrors[0];
  }

  return errors;
}

export function buildSaleEvent(values: SaleFormValues, id?: string): SaleEvent {
  const startAt = parseJstDateTime(values.startAt, false);
  const endAt = parseJstDateTime(values.endAt, false);
  if (!startAt || !endAt) {
    throw new Error("開始日時と終了日時を確認してください。");
  }

  return {
    id: id ?? createSaleEventId(values.merchantId, values.saleType, startAt),
    merchantId: values.merchantId,
    title: values.title.trim(),
    saleType: values.saleType.trim(),
    startAt,
    endAt,
    confidence: values.confidence,
    sourceUrl: values.sourceUrl.trim() || null,
    description: values.description.trim(),
    strategyMemo: values.strategyMemo.trim() || undefined,
    confidenceNote: values.confidenceNote.trim() || undefined
  };
}

export function parseJstDateTime(value: string, allowExtendedHour = true): string | null {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/);
  if (!match) {
    return null;
  }

  const [, yearText, monthText, dayText, hourText, minuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const maxHour = allowExtendedHour ? 47 : 23;

  if (month < 1 || month > 12 || day < 1 || day > 31 || hour < 0 || hour > maxHour || minute < 0 || minute > 59) {
    return null;
  }

  const calendarDate = new Date(Date.UTC(year, month - 1, day));
  if (
    calendarDate.getUTCFullYear() !== year ||
    calendarDate.getUTCMonth() !== month - 1 ||
    calendarDate.getUTCDate() !== day
  ) {
    return null;
  }

  return new Date(Date.UTC(year, month - 1, day, hour - 9, minute)).toISOString();
}

export function toJstDateTimeLocal(value: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(new Date(value));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export function createSaleEventId(merchantId: string, saleType: string, startAt: string): string {
  const dateKey = toJstDateTimeLocal(startAt).slice(0, 10).replaceAll("-", "");
  const normalizedType = saleType
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "sale";
  return `${merchantId}-${normalizedType}-${dateKey}`;
}
