import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { buildPageMetadata } from "@/lib/utils/metadata";

export const metadata = buildPageMetadata({
  title: "お問い合わせ",
  description: "セールカレンダー比較ナビへの問い合わせ導線です。",
  path: "/contact"
});

export default function ContactPage() {
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

  return (
    <>
      <PageHeader title="お問い合わせ" description="ご意見、ご質問、削除依頼を受け付けています。" />
      <Card>
        <p className="text-sm leading-7 text-ink">
          お問い合わせはメールで受け付けています。ボタンを押すと、お使いのメールアプリが開きます。
          削除依頼の場合は、対象データと確認に必要な情報を本文に記載してください。
        </p>
        {contactEmail ? (
          <a
            href={`mailto:${contactEmail}?subject=${encodeURIComponent("セールカレンダー比較ナビへのお問い合わせ")}`}
            className="mt-4 inline-flex rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white"
          >
            メールで問い合わせる
          </a>
        ) : (
          <p className="mt-4 rounded-md border border-line bg-slate-50 px-4 py-3 text-sm leading-6 text-muted">
            お問い合わせ窓口を設定中です。公開環境の管理者は
            <code className="mx-1">NEXT_PUBLIC_CONTACT_EMAIL</code>
            を設定してください。
          </p>
        )}
        <p className="mt-4 text-xs leading-6 text-muted">本サービスには広告・アフィリエイトリンクが含まれる可能性があります。</p>
      </Card>
    </>
  );
}
