import { PageHeader } from "@/components/ui/PageHeader";
import { ArticleList } from "@/features/articles/ArticleList";
import { buildPageMetadata } from "@/lib/utils/metadata";

export const metadata = buildPageMetadata({
  title: "記事一覧",
  description: "月別セールまとめ、セール攻略、Amazonと楽天の比較メモを読めます。",
  path: "/articles"
});

// 管理コンソールの公開記事をサーバー描画へ反映するため、定期的に再生成する。
export const revalidate = 300;

export default function ArticlesPage() {
  return (
    <>
      <PageHeader title="記事" description="セール前の買い物メモ整理に役立つ記事を掲載します。" />
      <ArticleList />
    </>
  );
}
