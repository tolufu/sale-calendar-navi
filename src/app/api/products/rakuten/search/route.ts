import { NextResponse } from "next/server";
import { createRakutenProductSearchProvider } from "@/lib/product-search/rakuten";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const provider = createRakutenProductSearchProvider();
  const result = await provider.search({ query, limit: 5 });

  return NextResponse.json(result);
}
