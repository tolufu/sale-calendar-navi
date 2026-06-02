import { AdminArticleForm } from "@/features/admin/articles/AdminArticleForm";

export default async function AdminEditArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <AdminArticleForm slug={slug} />;
}
