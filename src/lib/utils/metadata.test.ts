import { describe, expect, it } from "vitest";
import { buildPageMetadata, truncateDescription } from "@/lib/utils/metadata";

describe("metadata helpers", () => {
  it("canonical と OGP を設定する", () => {
    const metadata = buildPageMetadata({ title: "記事", description: "説明", path: "/articles/test" });
    expect(metadata.alternates).toEqual({ canonical: "/articles/test" });
    expect(metadata.openGraph).toMatchObject({ title: "記事", description: "説明", url: "/articles/test" });
  });

  it("description を短く整形する", () => {
    expect(truncateDescription("a\n b  c d", 5)).toBe("a b …");
  });
});
