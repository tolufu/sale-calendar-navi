import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
});

test("参考リンク未入力の基本フォームを保存できる", async ({ page }) => {
  await page.goto("/wishlist/new");

  await page.getByLabel("商品名").fill("E2E テスト商品");
  await page.getByLabel("商品URL").fill("https://item.rakuten.co.jp/shop/e2e-item");
  await page.getByLabel("希望価格").fill("12000");
  await page.getByRole("button", { name: "保存する" }).click();

  await expect(page).toHaveURL(/\/wishlist$/);
  await expect(page.getByText("E2E テスト商品")).toBeVisible();
  await expect(page.getByText("希望価格: ￥12,000")).toBeVisible();
});

test("詳細フォームで比較候補と参考リンクを保存できる", async ({ page }) => {
  await page.goto("/wishlist/new");

  await page.getByLabel("商品名").fill("比較候補テスト商品");
  await page.getByLabel("商品URL").fill("https://www.amazon.co.jp/dp/B0E2ETEST01");
  await page.getByLabel("希望価格").fill("15000");
  await page.getByRole("button", { name: "詳細入力を開く" }).click();
  await page.getByLabel("商品価格", { exact: true }).fill("16000");
  await page.getByLabel("送料", { exact: true }).fill("0");
  await page.getByLabel("クーポン値引き", { exact: true }).fill("1000");
  await page.getByLabel("付与ポイント", { exact: true }).fill("500");
  await page.getByLabel("ポイント換算率", { exact: true }).fill("1");
  await page.getByLabel("実質価格メモ").fill("主候補メモ");

  await page.getByRole("button", { name: "比較候補を追加" }).click();
  const candidate = page.getByTestId("candidate-draft").last();
  await candidate.getByLabel("候補EC").selectOption("rakuten");
  await candidate.getByLabel("候補URL").fill("https://item.rakuten.co.jp/shop/e2e-compare");
  await candidate.getByLabel("候補商品価格").fill("14800");
  await candidate.getByLabel("候補送料").fill("0");
  await candidate.getByLabel("候補クーポン値引き").fill("0");
  await candidate.getByLabel("候補付与ポイント").fill("1000");
  await candidate.getByLabel("候補ポイント換算率").fill("1");

  await page.locator('input[placeholder="https://..."]').last().fill("https://example.com/reference");
  await page.getByRole("button", { name: "保存する" }).click();

  await expect(page).toHaveURL(/\/wishlist$/);
  await expect(page.getByText("比較候補テスト商品")).toBeVisible();
  await expect(page.getByText("差額目安:")).toBeVisible();
  await expect(page.getByText("参考リンク 1件")).toBeVisible();
});
