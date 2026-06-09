import type { SaleEvent } from "@/lib/repositories/types";

export const SALE_SCHEDULE_CSV_COLUMNS = [
  "merchantId",
  "title",
  "saleType",
  "startAt",
  "endAt",
  "confidence",
  "sourceUrl",
  "note"
] as const;

export type SaleScheduleCsvColumn = (typeof SALE_SCHEDULE_CSV_COLUMNS)[number];
export type SaleScheduleCsvRow = Record<SaleScheduleCsvColumn, string>;

// 既存と突き合わせた結果、この行が新規追加か既存への更新（統合）かを表す。
export type SaleScheduleCsvRowMode = "create" | "update";

export type SaleScheduleCsvPreviewRow = {
  lineNumber: number;
  row: SaleScheduleCsvRow;
  mode?: SaleScheduleCsvRowMode;
  result:
    | { ok: true; value: SaleEvent }
    | { ok: false; errors: string[] };
};

export type SaleScheduleCsvPreview = {
  fileErrors: string[];
  rows: SaleScheduleCsvPreviewRow[];
  validEvents: SaleEvent[];
  validCount: number;
  skippedCount: number;
  // CSV内で同一IDに解決され、1件へ統合された行数（validCount - validEvents.length）。
  duplicateCount: number;
};
