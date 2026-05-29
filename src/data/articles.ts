import type { Article } from "@/lib/repositories/types";

export const articles: Article[] = [
  {
    slug: "monthly-sale-prep",
    title: "セール前に見直す買い物メモの作り方",
    body: "欲しいもののURL、希望価格、ポイントやクーポンのメモを分けて残しておくと、セール当日の確認が短くなります。\n\n価格は外部サイトから自動取得せず、自分で確認した内容をメモとして残します。条件が変わることもあるため、購入前には各サイトで最新情報を確認します。\n\n買うか迷う商品ほど、希望価格と実質価格メモを分けておくと比較しやすくなります。",
    ogImage: "/images/placeholders/og-sale-calendar.svg",
    tags: ["準備", "買い物メモ"],
    publishedAt: "2026-05-29T00:00:00+09:00"
  }
];
