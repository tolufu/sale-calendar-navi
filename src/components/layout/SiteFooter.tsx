import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-line bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 text-sm leading-6 text-muted">
        <p>価格やポイント条件はユーザー入力メモとして扱います。外部サイトの価格・在庫はスクレイピングで取得しません。v2以降の商品画像は楽天公式API由来に限り出典付きで表示します。</p>
        <nav className="mt-3 flex flex-wrap gap-3">
          <Link href="/terms" className="hover:text-accent">利用規約</Link>
          <Link href="/privacy" className="hover:text-accent">プライバシー</Link>
          <Link href="/operator" className="hover:text-accent">運営者情報</Link>
          <Link href="/contact" className="hover:text-accent">お問い合わせ</Link>
        </nav>
      </div>
    </footer>
  );
}
