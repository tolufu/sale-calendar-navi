import { describe, expect, it } from "vitest";
import { merchants } from "@/data/merchants";
import {
  buildMerchant,
  createMerchantFormValues,
  validateMerchantForm
} from "@/lib/merchants/admin";

describe("merchant admin form", () => {
  it("新規ECを正規化して構築する", () => {
    const values = {
      ...createMerchantFormValues(),
      merchantId: "sample-shop",
      name: " サンプルEC ",
      colorToken: "sample",
      urlHosts: "SHOP.EXAMPLE.COM, shop.example.com",
      sortOrder: "40"
    };
    expect(validateMerchantForm(values, merchants)).toEqual({});
    expect(buildMerchant(values)).toMatchObject({
      merchantId: "sample-shop",
      name: "サンプルEC",
      urlHosts: ["shop.example.com"],
      sortOrder: 40
    });
  });

  it("重複merchantId、外部画像用プレースホルダー、URL形式を拒否する", () => {
    const values = {
      ...createMerchantFormValues(),
      merchantId: "rakuten",
      name: "重複",
      colorToken: "sample",
      placeholderKey: "https://example.com/image.jpg",
      urlHosts: "https://example.com/path"
    };
    expect(validateMerchantForm(values, merchants)).toMatchObject({
      merchantId: "同じmerchantIdがすでに存在します。",
      placeholderKey: "登録済みのプレースホルダーを選択してください。",
      urlHosts: "URLホストはスキームやパスを含めず、カンマ区切りで指定してください。"
    });
  });

  it("公式APIなしの価格候補取得を拒否する", () => {
    const values = {
      ...createMerchantFormValues(),
      merchantId: "sample-shop",
      name: "サンプルEC",
      colorToken: "sample",
      supportsApi: false,
      supportsPriceAutoFetch: true
    };
    expect(validateMerchantForm(values, merchants)).toMatchObject({
      supportsPriceAutoFetch: "価格自動取得には公式API対応が必要です。"
    });
  });

  it("アフィリエイト対応なしの変換有効化を拒否する", () => {
    const values = {
      ...createMerchantFormValues(),
      merchantId: "sample-shop",
      name: "サンプルEC",
      colorToken: "sample",
      affiliateProvider: "sample",
      supportsAffiliate: false,
      affiliateEnabled: true
    };
    expect(validateMerchantForm(values, merchants)).toMatchObject({
      affiliateEnabled: "変換を有効にする場合はアフィリエイト対応も有効にしてください。"
    });
  });
});
