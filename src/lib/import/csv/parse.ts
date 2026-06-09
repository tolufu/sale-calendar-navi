// セール日程CSV / 商品フィードCSV で共有する低レベルCSVパーサ。
// RFC4180準拠の最小実装（引用符・エスケープ・CRLF対応）。各バリデータが列定義を渡して使う。

export type ParsedCsvRow = {
  lineNumber: number;
  cells: string[];
};

export function stripBom(content: string): string {
  return content.replace(/^﻿/, "");
}

// 空行と `#` で始まるコメント行を取込対象外と判定する。
export function isSkippedCsvRow(cells: string[]): boolean {
  return cells.every((cell) => !cell.trim()) || (cells[0]?.trim().startsWith("#") ?? false);
}

export function isExpectedCsvHeader(header: string[], columns: readonly string[]): boolean {
  return header.length === columns.length
    && columns.every((column, index) => header[index] === column);
}

export function toCsvRecord<Column extends string>(
  cells: string[],
  columns: readonly Column[]
): Record<Column, string> {
  return Object.fromEntries(
    columns.map((column, index) => [column, cells[index] ?? ""])
  ) as Record<Column, string>;
}

export function parseCsvRows(content: string): { rows: ParsedCsvRow[]; error?: string } {
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
