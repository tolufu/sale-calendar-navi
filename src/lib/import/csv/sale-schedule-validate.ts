import { parseHttpsUrl, sanitizeCsvCell } from "@/lib/import/csv/validate";
import {
  SALE_SCHEDULE_CSV_COLUMNS,
  type SaleScheduleCsvPreview,
  type SaleScheduleCsvPreviewRow,
  type SaleScheduleCsvRow
} from "@/lib/import/csv/sale-schedule-schema";
import type { Merchant, SaleEvent, SaleEventConfidence } from "@/lib/repositories/types";
import { createSaleEventId, parseJstDateTime } from "@/lib/sales/admin";

const IMPORT_DESCRIPTION = "手動CSVで登録したセール日程です。購入前にリンク先で最新条件を確認してください。";

export function validateSaleScheduleCsv(
  content: string,
  merchants: Merchant[],
  existingEvents: SaleEvent[] = []
): SaleScheduleCsvPreview {
  const parsed = parseCsvRows(content.replace(/^\uFEFF/, ""));
  if (parsed.error) {
    return createPreview([parsed.error], []);
  }
  const rows = parsed.rows;
  const dataRows = rows.filter(({ cells }) => !isSkippedRow(cells));
  if (dataRows.length === 0) {
    return createPreview(["CSVヘッダーがありません。"], []);
  }

  const [header, ...body] = dataRows;
  const normalizedHeader = header.cells.map((cell) => sanitizeCsvCell(cell));
  if (!isExpectedHeader(normalizedHeader)) {
    return createPreview([`CSVヘッダーは ${SALE_SCHEDULE_CSV_COLUMNS.join(",")} の順で指定してください。`], []);
  }

  const previewRows = body.map(({ lineNumber, cells }) => {
    const row = toCsvRow(cells);
    return {
      lineNumber,
      row,
      result: cells.length === SALE_SCHEDULE_CSV_COLUMNS.length
        ? validateSaleScheduleCsvRow(row, merchants)
        : { ok: false as const, errors: [`列数は${SALE_SCHEDULE_CSV_COLUMNS.length}列で指定してください。`] }
    };
  });
  return createPreview([], reconcileExistingIds(previewRows, existingEvents));
}

export function validateSaleScheduleCsvRow(
  row: SaleScheduleCsvRow,
  merchants: Merchant[]
): SaleScheduleCsvPreviewRow["result"] {
  const errors: string[] = [];
  const merchantId = sanitizeCsvCell(row.merchantId);
  const title = sanitizeCsvCell(row.title);
  const saleType = sanitizeCsvCell(row.saleType);
  const confidence = sanitizeCsvCell(row.confidence) || "confirmed";
  const note = sanitizeCsvCell(row.note);
  const merchant = merchants.find((item) => item.merchantId === merchantId);

  if (!merchant || !merchant.isActive) errors.push("有効なmerchantIdを指定してください。");
  if (!title) errors.push("titleは必須です。");
  if (!saleType) errors.push("saleTypeは必須です。");

  const startAt = parseJstDateTime(sanitizeCsvCell(row.startAt));
  const endAt = parseJstDateTime(sanitizeCsvCell(row.endAt));
  if (!startAt) errors.push("startAtはJST YYYY-MM-DD HH:mm形式で指定してください。");
  if (!endAt) errors.push("endAtはJST YYYY-MM-DD HH:mm形式で指定してください。");
  if (startAt && endAt && startAt > endAt) errors.push("endAtはstartAt以降にしてください。");

  if (confidence !== "confirmed" && confidence !== "estimated") {
    errors.push("confidenceはconfirmedまたはestimatedを指定してください。");
  }
  const sourceUrl = parseHttpsUrl(sanitizeCsvCell(row.sourceUrl), "sourceUrl", errors);

  if (errors.length > 0 || !startAt || !endAt || (confidence !== "confirmed" && confidence !== "estimated")) {
    return { ok: false, errors };
  }

  const event: SaleEvent = {
    id: createSaleEventId(merchantId, saleType, startAt),
    merchantId,
    title,
    saleType,
    startAt,
    endAt,
    confidence: confidence as SaleEventConfidence,
    sourceUrl,
    description: IMPORT_DESCRIPTION,
    confidenceNote: note || undefined
  };
  return { ok: true, value: event };
}

type ParsedCsvRow = {
  lineNumber: number;
  cells: string[];
};

function createPreview(fileErrors: string[], rows: SaleScheduleCsvPreviewRow[]): SaleScheduleCsvPreview {
  const validRows = rows.flatMap((row) => row.result.ok ? [row.result.value] : []);
  const validEvents = [...new Map(validRows.map((event) => [event.id, event])).values()];
  return {
    fileErrors,
    rows,
    validEvents,
    validCount: validRows.length,
    skippedCount: rows.length - validRows.length,
    duplicateCount: validRows.length - validEvents.length
  };
}

function reconcileExistingIds(rows: SaleScheduleCsvPreviewRow[], existingEvents: SaleEvent[]): SaleScheduleCsvPreviewRow[] {
  const existingEventsById = new Map(existingEvents.map((event) => [event.id, event]));
  const existingIdByStableKey = new Map(
    existingEvents.map((event) => [createSaleEventId(event.merchantId, event.saleType, event.startAt), event.id])
  );
  const existingIdsByStartKey = new Map<string, string[]>();
  existingEvents.forEach((event) => {
    const key = `${event.merchantId}|${new Date(event.startAt).getTime()}`;
    existingIdsByStartKey.set(key, [...(existingIdsByStartKey.get(key) ?? []), event.id]);
  });

  return rows.map((row) => {
    if (!row.result.ok) {
      return row;
    }

    const startKey = `${row.result.value.merchantId}|${new Date(row.result.value.startAt).getTime()}`;
    const sameStartIds = existingIdsByStartKey.get(startKey) ?? [];
    const existingId = existingIdByStableKey.get(row.result.value.id)
      ?? (sameStartIds.length === 1 ? sameStartIds[0] : undefined);
    const existingEvent = existingId ? existingEventsById.get(existingId) : undefined;

    if (!existingId || !existingEvent) {
      return { ...row, mode: "create" as const };
    }

    return {
      ...row,
      mode: "update" as const,
      result: {
        ok: true,
        value: {
          ...existingEvent,
          ...row.result.value,
          id: existingId,
          saleType: existingEvent.saleType,
          description: existingEvent.description,
          strategyMemo: existingEvent.strategyMemo
        }
      }
    };
  });
}

function isSkippedRow(cells: string[]): boolean {
  return cells.every((cell) => !cell.trim()) || cells[0]?.trim().startsWith("#");
}

function isExpectedHeader(header: string[]): boolean {
  return header.length === SALE_SCHEDULE_CSV_COLUMNS.length
    && SALE_SCHEDULE_CSV_COLUMNS.every((column, index) => header[index] === column);
}

function toCsvRow(cells: string[]): SaleScheduleCsvRow {
  return Object.fromEntries(
    SALE_SCHEDULE_CSV_COLUMNS.map((column, index) => [column, cells[index] ?? ""])
  ) as SaleScheduleCsvRow;
}

function parseCsvRows(content: string): { rows: ParsedCsvRow[]; error?: string } {
  const rows: ParsedCsvRow[] = [];
  let cells: string[] = [];
  let cell = "";
  let inQuotes = false;
  let rowLineNumber = 1;
  let lineNumber = 1;

  function pushCell() {
    cells.push(cell);
    cell = "";
  }

  function pushRow() {
    pushCell();
    rows.push({ lineNumber: rowLineNumber, cells });
    cells = [];
    rowLineNumber = lineNumber + 1;
  }

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];
    const next = content[index + 1];

    if (character === "\"") {
      if (inQuotes && next === "\"") {
        cell += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (character === "," && !inQuotes) {
      pushCell();
      continue;
    }
    if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && next === "\n") {
        index += 1;
      }
      pushRow();
      lineNumber += 1;
      continue;
    }

    cell += character;
    if (character === "\n") {
      lineNumber += 1;
    }
  }

  if (cell || cells.length > 0) {
    pushRow();
  }
  return inQuotes ? { rows: [], error: "CSVの引用符が閉じられていません。" } : { rows };
}
