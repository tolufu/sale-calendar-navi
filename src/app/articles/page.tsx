import { PageHeader } from "@/components/ui/PageHeader";
import { ArticleList } from "@/features/articles/ArticleList";

export default function ArticlesPage() {
  return (
    <>
      <PageHeader title="記事" description="セール前の買い物メモ整理に役立つ記事を掲載します。" />
      <ArticleList />
    </>
  );
}
