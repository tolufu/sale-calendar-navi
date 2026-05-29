import type { Article } from "@/lib/repositories/types";

export const articles: Article[] = [
  {
    slug: "monthly-sale-prep",
    title: "6月セール前に見直す買い物メモの作り方",
    description: "月別セール前に、商品URL、希望価格、実質価格メモを整理するための基本手順です。",
    body: "6月の大型セール前は、欲しいもののURL、希望価格、ポイントやクーポンのメモを分けて残しておくと、当日の確認が短くなります。\n\n価格は外部サイトから自動取得せず、自分で確認した内容をメモとして残します。条件が変わることもあるため、購入前には各サイトで最新情報を確認します。\n\n買うか迷う商品ほど、希望価格と実質価格メモを分けておくと比較しやすくなります。",
    ogImage: "/images/placeholders/og-sale-calendar.svg",
    tags: ["月別まとめ", "買い物メモ"],
    publishedAt: "2026-05-29T00:00:00+09:00",
    relatedSlugs: ["sale-strategy-basics", "amazon-rakuten-compare"]
  },
  {
    slug: "sale-strategy-basics",
    title: "セール攻略は希望価格と条件メモから始める",
    description: "セール攻略で見落としやすい予算、必要性、ポイント条件のメモ方法を整理します。",
    body: "セール攻略で最初に決めたいのは、買う理由と希望価格です。割引率だけで判断せず、普段の必要度や買い替え時期も一緒に書いておきます。\n\nポイントやクーポンは条件が変わるため、メモには確認日を添えると後から見直しやすくなります。\n\nこのアプリでは価格を保証せず、ユーザー自身が確認したメモを比較の材料として扱います。",
    ogImage: "/images/placeholders/og-sale-calendar.svg",
    tags: ["攻略", "希望価格"],
    publishedAt: "2026-05-28T00:00:00+09:00",
    relatedSlugs: ["monthly-sale-prep", "effective-price-note"]
  },
  {
    slug: "amazon-rakuten-compare",
    title: "Amazonと楽天の見方をメモで分ける",
    description: "Amazonと楽天のセール確認時に、比較しやすいメモ項目を分ける考え方です。",
    body: "Amazonと楽天では、確認したい条件が異なります。商品ページのURL、希望価格、送料、ポイント、クーポンの見方を同じ欄に混ぜずに残すと、あとで読み返しやすくなります。\n\n楽天はアフィリエイト変換に対応する場合がありますが、価格や在庫を自動取得するものではありません。\n\nどちらのECでも、購入前には公式サイト上の最新条件を確認してください。",
    ogImage: "/images/placeholders/og-sale-calendar.svg",
    tags: ["Amazon", "楽天", "比較"],
    publishedAt: "2026-05-27T00:00:00+09:00",
    relatedSlugs: ["monthly-sale-prep", "rakuten-affiliate-note"]
  },
  {
    slug: "rakuten-affiliate-note",
    title: "楽天リンク変換でできることと注意点",
    description: "楽天アフィリエイト変換はリンク管理の補助であり、価格取得ではないことを整理します。",
    body: "楽天リンク変換は、ユーザーが入力したURLをアフィリエイトリンクとして扱えるようにするための補助です。\n\n変換しても商品画像、価格、在庫、レビューを自動取得するわけではありません。希望価格や実質価格メモは、ユーザー自身が確認した内容として保存します。\n\nリンクの扱いは今後の運用ポリシーに合わせて変更できるよう、merchantIdとmerchantsマスタを基準に管理します。",
    ogImage: "/images/placeholders/og-sale-calendar.svg",
    tags: ["楽天", "アフィリエイト"],
    publishedAt: "2026-05-26T00:00:00+09:00",
    relatedSlugs: ["amazon-rakuten-compare", "effective-price-note"]
  },
  {
    slug: "effective-price-note",
    title: "実質価格メモを安全に残すコツ",
    description: "ポイントやクーポンを含む実質価格メモを、保証表現なしで扱うためのチェック項目です。",
    body: "実質価格メモは、商品価格、送料、クーポン、付与ポイントを分けて残すと見直しやすくなります。\n\nただしポイント条件や上限は変わることがあります。メモは購入判断の補助であり、最終的な金額を保証するものではありません。\n\n共有するときは、保存URL、匿名ID、非公開メモを含めず、一般的な気づきだけに留めると安全です。",
    ogImage: "/images/placeholders/og-sale-calendar.svg",
    tags: ["実質価格", "共有"],
    publishedAt: "2026-05-25T00:00:00+09:00",
    relatedSlugs: ["sale-strategy-basics", "amazon-rakuten-compare"]
  }
];
