import type { Merchant } from "@/lib/repositories/types";
import {
  isExpectedCsvHeader,
  isSkippedCsvRow,
  parseCsvRows,
  stripBom,
  toCsvRecord
} from "@/lib/import/csv/parse";
import {
  PRODUCT_FEED_CSV_COLUMNS,
  type ProductFeedCsvPreview,
  type ProductFeedCsvPreviewRow,
  type ProductFeedCsvRow,
  type ProductFeedCsvValidationResult
} from "@/lib/import/csv/schema";

const CSV_FORMULA_PREFIX = /^[=+\-@\t\r]/;

export type CsvValidationResult = ProductFeedCsvValidationResult;

export function sanitizeCsvCell(value: string): string {
  const trimmed = value.trim();
  return CSV_FORMULA_PREFIX.test(trimmed) ? `'${trimmed}` : trimmed;
}

export function parseHttpsUrl(value: string, label: string, errors: string[]): string | null {
  if (!value) {
    return null;
  }
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:") {
      errors.push(`${label}はhttps URLのみ指定できます。`);
      return null;
    }
    return parsed.toString();
  } catch {
    errors.push(`${label}のURL形式を確認してください。`);
    return null;
  }
}

function isAllowedImageUrl(url: string, allowedImageHosts: string[]): boolean {
  const hostname = new URL(url).hostname.toLowerCase();
  return allowedImageHosts.some((host) => {
    const normalizedHost = host.toLowerCase();
    return hostname === normalizedHost || hostname.endsWith(`.${normalizedHost}`);
  });
}

export function validateProductFeedCsvRow(
  row: ProductFeedCsvRow,
  merchants: Merchant[],
  allowedImageHosts: string[] = []
): CsvValidationResult {
  const errors: string[] = [];
  const merchantId = sanitizeCsvCell(row.merchantId);
  const merchant = merchants.find((item) => item.merchantId === merchantId);

  if (!merchant || !merchant.isActive) {
    errors.push("有効なmerchantIdを指定してください。");
  } else if (merchant.integrationStatus !== "available") {
    errors.push("未連携ECの商品フィードは取り込めません。");
  }

  const externalId = sanitizeCsvCell(row.externalId);
  const title = sanitizeCsvCell(row.title);
  if (!externalId) {
    errors.push("externalIdは必須です。");
  }
  if (!title) {
    errors.push("titleは必須です。");
  }

  const productUrl = parseHttpsUrl(sanitizeCsvCell(row.productUrl), "productUrl", errors);
  if (!productUrl) {
    errors.push("productUrlは必須です。");
  }
  const affiliateUrl = parseHttpsUrl(sanitizeCsvCell(row.affiliateUrl), "affiliateUrl", errors);
  const parsedImageUrl = parseHttpsUrl(sanitizeCsvCell(row.imageUrl), "imageUrl", errors);
  const imageUrl = parsedImageUrl && isAllowedImageUrl(parsedImageUrl, allowedImageHosts) ? parsedImageUrl : null;
  if (parsedImageUrl && !imageUrl) {
    errors.push("imageUrlのホストは許可されていません。");
  }

  if (errors.length || !productUrl) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      merchantId,
      externalId,
      title,
      productUrl,
      affiliateUrl,
      imageUrl,
      priceMemo: sanitizeCsvCell(row.priceMemo) || null
    }
  };
}

export function validateProductFeedCsv(
  content: string,
  merchants: Merchant[],
  allowedImageHosts: string[] = []
): ProductFeedCsvPreview {
  const parsed = parseCsvRows(stripBom(content));
  if (parsed.error) {
    return createPreview([parsed.error], []);
  }
  const dataRows = parsed.rows.filter(({ cells }) => !isSkippedCsvRow(cells));
  if (dataRows.length === 0) {
    return createPreview(["CSVヘッダーがありません。"], []);
  }

  const [header, ...body] = dataRows;
  const normalizedHeader = header.cells.map((cell) => sanitizeCsvCell(cell));
  if (!isExpectedCsvHeader(normalizedHeader, PRODUCT_FEED_CSV_COLUMNS)) {
    return createPreview([`CSVヘッダーは ${PRODUCT_FEED_CSV_COLUMNS.join(",")} の順で指定してください。`], []);
  }

  const rows = body.map(({ lineNumber, cells }) => {
    const row = toCsvRecord(cells, PRODUCT_FEED_CSV_COLUMNS);
    return {
      lineNumber,
      row,
      result: cells.length === PRODUCT_FEED_CSV_COLUMNS.length
        ? validateProductFeedCsvRow(row, merchants, allowedImageHosts)
        : { ok: false as const, errors: [`列数は${PRODUCT_FEED_CSV_COLUMNS.length}列で指定してください。`] }
    };
  });
  return createPreview([], rows);
}

function createPreview(fileErrors: string[], rows: ProductFeedCsvPreviewRow[]): ProductFeedCsvPreview {
  const validRows = rows.flatMap((row) => row.result.ok ? [row.result.value] : []);
  const deduplicatedRows = [...new Map(validRows.map((row) => [`${row.merchantId}|${row.externalId}`, row])).values()];
  return {
    fileErrors,
    rows,
    validRows: deduplicatedRows,
    validCount: validRows.length,
    skippedCount: rows.length - validRows.length,
    duplicateCount: validRows.length - deduplicatedRows.length
  };
}
