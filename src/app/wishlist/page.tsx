import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { WishlistList } from "@/features/wishlist/WishlistList";

export default function WishlistPage() {
  return (
    <>
      <PageHeader title="欲しいもの一覧" description="商品URLと希望価格、実質価格メモを確認します。" action={<Link href="/wishlist/new"><Button>登録する</Button></Link>} />
      <WishlistList />
    </>
  );
}
