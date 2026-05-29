import { Suspense } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { WishlistForm } from "@/features/wishlist/WishlistForm";

export default function NewWishlistPage() {
  return (
    <>
      <PageHeader title="欲しいもの登録" description="価格は手入力メモとして保存します。外部サイトから価格や画像を取得しません。" />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <WishlistForm />
      </Suspense>
    </>
  );
}
