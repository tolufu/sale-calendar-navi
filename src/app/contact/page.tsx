import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { buildPageMetadata } from "@/lib/utils/metadata";

export const metadata = buildPageMetadata({
  title: "お問い合わせ",
  description: "セールカレンダー比較ナビへの問い合わせ導線です。",
  path: "/contact"
});

export default function ContactPage() {
  return (
    <>
      <PageHeader title="お問い合わせ" description="問い合わせ送信は仮実装です。公開時に送信先を接続します。" />
      <Card>
        <form className="space-y-4">
          <label className="block text-sm font-semibold">
            メールアドレス
            <input type="email" className="mt-2 w-full rounded-md border border-line px-3 py-2" placeholder="name@example.com" />
          </label>
          <label className="block text-sm font-semibold">
            内容
            <textarea className="mt-2 min-h-36 w-full rounded-md border border-line px-3 py-2" placeholder="お問い合わせ内容" />
          </label>
          <button type="button" className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white">送信準備中</button>
        </form>
        <p className="mt-4 text-xs leading-6 text-muted">本サービスには広告・アフィリエイトリンクが含まれる可能性があります。</p>
      </Card>
    </>
  );
}
