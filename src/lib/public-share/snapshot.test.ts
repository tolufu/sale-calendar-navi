import { describe, expect, it } from "vitest";
import { merchants } from "@/data/merchants";
import { createDefaultPublicShareSetting, createPublicShareSnapshot } from "@/lib/public-share/snapshot";
import type { WishItem } from "@/lib/repositories/types";

const wishItem: WishItem = {
  id: "private-item-id",
  userId: "anonymous-private-user",
  title: "商品 https://private.example/item user_anon_123 非公開メモ",
  productUrl: "https://private.example/item",
  merchantId: "rakuten",
  desiredPrice: 5000,
  actualPriceMemo: "外部には出さない",
  targetSaleEventId: null,
  placeholderKey: "red-bag",
  note: "外部には出さない",
  createdAt: "2026-05-30T00:00:00.000Z",
  updatedAt: "2026-05-30T00:00:00.000Z"
};

describe("public share snapshot", () => {
  it("公開共有はデフォルトで無効", () => {
    const setting = createDefaultPublicShareSetting();
    expect(setting.enabled).toBe(false);
    expect(createPublicShareSnapshot(setting, [wishItem], merchants, "share-token")).toBeNull();
  });

  it("明示的に有効化した場合だけ安全な公開項目へ射影する", () => {
    const snapshot = createPublicShareSnapshot(
      { enabled: true, expiresAt: null },
      [wishItem],
      merchants,
      "share-token",
      "2026-05-30T00:00:00.000Z"
    );

    expect(snapshot).toEqual({
      shareId: "share-token",
      createdAt: "2026-05-30T00:00:00.000Z",
      expiresAt: null,
      revoked: false,
      items: [
        {
          title: "商品",
          merchantName: "楽天",
          desiredPrice: 5000,
          placeholderImageType: "red-bag"
        }
      ]
    });
    expect(JSON.stringify(snapshot)).not.toContain("private-item-id");
    expect(JSON.stringify(snapshot)).not.toContain("anonymous-private-user");
    expect(JSON.stringify(snapshot)).not.toContain("private.example");
  });
});
