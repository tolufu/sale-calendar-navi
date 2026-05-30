import { NextResponse } from "next/server";
import { merchants } from "@/data/merchants";
import { createRakutenProductSearchProvider } from "@/lib/product-search/rakuten";
import { searchMerchantProducts } from "@/lib/providers/product-search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const merchant = merchants.find((item) => item.merchantId === "rakuten");
  if (!merchant) {
    return NextResponse.json({ candidates: [], message: "楽天の設定が見つかりません。" }, { status: 503 });
  }
  const provider = createRakutenProductSearchProvider();
  const result = await searchMerchantProducts(merchant, provider, { query, limit: 5 });

  return NextResponse.json(result);
}
