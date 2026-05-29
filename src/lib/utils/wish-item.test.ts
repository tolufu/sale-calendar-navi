import { describe, expect, it } from "vitest";
import type { WishItem } from "@/lib/repositories/types";
import { migrateWishItem, syncWishItemMirrors } from "@/lib/utils/wish-item";

const baseV1Item: WishItem = {
  id: "wish-1",
  userId: "user-1",
  title: "イヤホン",
  productUrl: "https://item.rakuten.co.jp/shop/item",
  merchantId: "rakuten",
  desiredPrice: 12000,
  actualPriceMemo: "ポイント込みで確認",
  targetSaleEventId: null,
  placeholderKey: "red-bag",
  note: null,
  createdAt: "2026-05-01T00:00:00.000Z",
  updatedAt: "2026-05-01T00:00:00.000Z"
};

describe("migrateWishItem", () => {
  it("v1形式の欲しいものをv2候補形式へ移行する", () => {
    const migrated = migrateWishItem(baseV1Item);

    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.candidates).toHaveLength(1);
    expect(migrated.candidates?.[0]).toMatchObject({
      merchantId: "rakuten",
      originalUrl: "https://item.rakuten.co.jp/shop/item",
      affiliateUrl: null,
      priceMemo: "ポイント込みで確認",
      imageSource: "placeholder"
    });
    expect(migrated.referenceLinks).toEqual([]);
  });

  it("不足した内訳フィールドをnullで補完し、冪等に移行する", () => {
    const migrated = migrateWishItem({
      ...baseV1Item,
      schemaVersion: 2,
      candidates: [
        {
          merchantId: "rakuten",
          originalUrl: "https://item.rakuten.co.jp/shop/item",
          affiliateUrl: "https://item.rakuten.co.jp/shop/item?scid=af_link_dummy",
          breakdown: { productPrice: 10000, shippingFee: null, couponDiscount: null, grantedPoints: null, pointRate: null },
          priceMemo: null,
          lastCheckedAt: "2026-05-02T00:00:00.000Z",
          imageSource: "placeholder"
        }
      ]
    });

    expect(migrated.productUrl).toBe("https://item.rakuten.co.jp/shop/item?scid=af_link_dummy");
    expect(migrated.lastCheckedAt).toBe("2026-05-02T00:00:00.000Z");
    expect(migrateWishItem(migrated)).toEqual(migrated);
  });

  it("移行時に負の希望価格と不正な参考リンクを破棄する", () => {
    const migrated = migrateWishItem({
      ...baseV1Item,
      desiredPrice: -1,
      referenceLinks: [
        {
          id: "valid",
          kind: "maker",
          label: " メーカー公式 ",
          url: "https://example.com/product"
        },
        {
          id: "invalid-url",
          kind: "other",
          label: "不正URL",
          url: "javascript:alert(1)"
        },
        {
          id: "empty-label",
          kind: "kakaku",
          label: " ",
          url: "https://example.com/no-label"
        }
      ]
    });

    expect(migrated.desiredPrice).toBeNull();
    expect(migrated.referenceLinks).toEqual([
      {
        id: "valid",
        kind: "maker",
        label: "メーカー公式",
        url: "https://example.com/product"
      }
    ]);
  });
});

describe("syncWishItemMirrors", () => {
  it("主候補から既存ミラーフィールドと参考リンクを保存する", () => {
    const synced = syncWishItemMirrors({
      ...baseV1Item,
      candidates: [
        {
          merchantId: "rakuten",
          originalUrl: "https://item.rakuten.co.jp/shop/item",
          affiliateUrl: "https://item.rakuten.co.jp/shop/item?scid=af_link_dummy",
          breakdown: { productPrice: 10000, shippingFee: 0, couponDiscount: 1000, grantedPoints: 500, pointRate: 1 },
          priceMemo: "更新メモ",
          lastCheckedAt: "2026-05-03T00:00:00.000Z",
          imageSource: "placeholder"
        }
      ],
      referenceLinks: [
        {
          id: "ref-1",
          kind: "maker",
          label: "メーカー公式",
          url: "https://example.com/product"
        }
      ]
    });

    expect(synced.productUrl).toBe("https://item.rakuten.co.jp/shop/item?scid=af_link_dummy");
    expect(synced.actualPriceMemo).toBe("更新メモ");
    expect(synced.referenceLinks).toHaveLength(1);
  });

  it("楽天API由来の画像URLとimageSourceを保存する", () => {
    const synced = syncWishItemMirrors({
      ...baseV1Item,
      candidates: [
        {
          merchantId: "rakuten",
          originalUrl: "https://item.rakuten.co.jp/shop/item",
          affiliateUrl: "https://hb.afl.rakuten.co.jp/hgc/example",
          breakdown: { productPrice: 10000, shippingFee: null, couponDiscount: null, grantedPoints: null, pointRate: null },
          priceMemo: null,
          lastCheckedAt: "2026-05-03T00:00:00.000Z",
          imageSource: "rakuten_api",
          imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/shop/item.jpg"
        }
      ]
    });

    expect(synced.candidates?.[0]).toMatchObject({
      imageSource: "rakuten_api",
      imageUrl: "https://thumbnail.image.rakuten.co.jp/@0_mall/shop/item.jpg"
    });
  });
});
