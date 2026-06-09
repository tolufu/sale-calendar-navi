import { describe, expect, it } from "vitest";
import {
  isExpectedCsvHeader,
  isSkippedCsvRow,
  parseCsvRows,
  stripBom,
  toCsvRecord
} from "@/lib/import/csv/parse";

const COLUMNS = ["a", "b", "c"] as const;

describe("shared CSV parser", () => {
  it("引用符内のカンマ・改行・エスケープとCRLFを解析する", () => {
    const { rows, error } = parseCsvRows("a,b,c\r\n\"x,1\",\"y\ny\",\"z\"\"z\"");
    expect(error).toBeUndefined();
    expect(rows).toHaveLength(2);
    expect(rows[1].cells).toEqual(["x,1", "y\ny", "z\"z"]);
  });

  it("未閉じ引用符をエラーにする", () => {
    expect(parseCsvRows("a,b,c\n\"open,1,2").error).toBe("CSVの引用符が閉じられていません。");
  });

  it("BOM除去・空行/コメント判定・ヘッダー一致・レコード化", () => {
    expect(stripBom("﻿a,b,c")).toBe("a,b,c");
    expect(isSkippedCsvRow(["", "  ", ""])).toBe(true);
    expect(isSkippedCsvRow(["# memo", "", ""])).toBe(true);
    expect(isSkippedCsvRow(["a", "", ""])).toBe(false);
    expect(isExpectedCsvHeader(["a", "b", "c"], COLUMNS)).toBe(true);
    expect(isExpectedCsvHeader(["a", "c", "b"], COLUMNS)).toBe(false);
    expect(toCsvRecord(["1", "2"], COLUMNS)).toEqual({ a: "1", b: "2", c: "" });
  });
});
