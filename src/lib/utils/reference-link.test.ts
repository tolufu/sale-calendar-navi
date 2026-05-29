import { describe, expect, it } from "vitest";
import { parseReferenceLinks, type ReferenceLinkDraft } from "@/lib/utils/reference-link";

function draft(overrides: Partial<ReferenceLinkDraft>): ReferenceLinkDraft {
  return {
    id: "ref-1",
    kind: "kakaku",
    label: "価格比較メモ",
    url: "https://example.com/item",
    ...overrides
  };
}

describe("parseReferenceLinks", () => {
  it("URLが空の行はラベルがあっても保存対象から外す", () => {
    expect(parseReferenceLinks([draft({ url: "" })])).toEqual([]);
  });

  it("httpとhttpsのURLを許可して正規化する", () => {
    expect(parseReferenceLinks([
      draft({ id: "https", url: "https://example.com/item?b=2" }),
      draft({ id: "http", url: "http://example.com/item" })
    ])).toEqual([
      { id: "https", kind: "kakaku", label: "価格比較メモ", url: "https://example.com/item?b=2" },
      { id: "http", kind: "kakaku", label: "価格比較メモ", url: "http://example.com/item" }
    ]);
  });

  it("javascriptなどの不正プロトコルを拒否する", () => {
    expect(() => parseReferenceLinks([draft({ url: "javascript:alert(1)" })])).toThrow(
      "参考リンクは http または https のURLで入力してください。"
    );
  });

  it("URLがある行で表示名が空なら拒否する", () => {
    expect(() => parseReferenceLinks([draft({ label: " ", url: "https://example.com/item" })])).toThrow(
      "参考リンクの表示名を入力してください。"
    );
  });

  it("6件目は上限エラーにする", () => {
    const drafts = Array.from({ length: 6 }, (_, index) => draft({
      id: `ref-${index}`,
      url: `https://example.com/item-${index}`
    }));

    expect(() => parseReferenceLinks(drafts)).toThrow("参考リンクは5件まで登録できます。");
  });
});
