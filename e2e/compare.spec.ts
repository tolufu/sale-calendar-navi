import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/products/compare**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        query: "camera",
        results: [
          {
            merchantId: "ebay",
            configured: true,
            message: null,
            candidates: [
              {
                provider: "ebay",
                itemCode: "ebay-1",
                title: "E2E eBay Camera",
                itemUrl: "https://www.ebay.com/itm/1",
                affiliateUrl: null,
                imageUrl: "https://i.ebayimg.com/images/g/example/s-l500.jpg",
                imageSource: "ebay_api",
                price: 100,
                shippingFee: 10,
                points: null,
                currency: "USD",
                priceJpy: 15500,
                shippingFeeJpy: 1550,
                exchangeRateToJpy: 155,
                exchangeRateDate: "2026-06-02",
                inStock: true,
                shopName: "seller"
              }
            ]
          }
        ],
        exchangeMessages: []
      })
    });
  });
});

test("価格比較ページで外貨候補のJPY参考値を表示できる", async ({ page }) => {
  await page.goto("/compare");
  await page.getByLabel("商品URLまたはキーワード").fill("camera");
  await page.getByRole("button", { name: "参考価格を検索" }).click();

  await expect(page.getByText("E2E eBay Camera")).toBeVisible();
  await expect(page.getByText("画像出典: eBay Browse API")).toBeVisible();
  await expect(page.getByText("JPY参考: ￥17,050")).toBeVisible();
  await expect(page.getByRole("link", { name: "欲しいものに追加" })).toHaveAttribute("href", /productPrice=15500/);
});
