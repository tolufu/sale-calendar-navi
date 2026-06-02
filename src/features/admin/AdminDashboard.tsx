"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { signOutAdmin } from "@/lib/firebase/admin";
import { getFirestoreSeedState, seedFirestoreStaticData } from "@/lib/repositories/firestore";

type DashboardState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "success";
      canSeed: boolean;
      counts: {
        articles: number;
        merchants: number;
        sales: number;
      };
    };

export function AdminDashboard() {
  const router = useRouter();
  const [state, setState] = useState<DashboardState>({ status: "loading" });
  const [isSeeding, setIsSeeding] = useState(false);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const seedState = await getFirestoreSeedState();
      setState({ status: "success", ...seedState });
    } catch {
      setState({ status: "error", message: "Firestoreの登録件数を取得できませんでした。" });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSeed() {
    setIsSeeding(true);
    try {
      await seedFirestoreStaticData();
      await load();
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "静的データを投入できませんでした。"
      });
    } finally {
      setIsSeeding(false);
    }
  }

  async function handleSignOut() {
    await signOutAdmin();
    router.replace("/admin/sign-in");
  }

  return (
    <div>
      <PageHeader
        title="管理者コンソール"
        description="記事とセール日程を運営用画面から管理します。初期投入後の編集機能は段階的に追加します。"
        action={<Button variant="secondary" onClick={handleSignOut}>サインアウト</Button>}
      />

      {state.status === "loading" ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((item) => <Skeleton key={item} className="h-28" />)}
        </div>
      ) : null}

      {state.status === "error" ? <ErrorState message={state.message} onRetry={() => void load()} /> : null}

      {state.status === "success" ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <CountCard label="記事" count={state.counts.articles} />
            <CountCard label="セール日程" count={state.counts.sales} />
            <CountCard label="ECマスタ" count={state.counts.merchants} />
          </div>

          <Card>
            <h2 className="text-lg font-bold text-ink">Firestore初期投入</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Firestoreが空の場合に限り、静的データを投入できます。投入後は再実行できません。
            </p>
            <Button className="mt-4" onClick={handleSeed} disabled={!state.canSeed || isSeeding}>
              {isSeeding ? "投入中..." : "静的データをFirestoreへ投入"}
            </Button>
            {!state.canSeed ? <p className="mt-3 text-sm text-muted">既存データがあるため、初期投入は無効です。</p> : null}
          </Card>

          <Card>
            <h2 className="text-lg font-bold text-ink">管理メニュー</h2>
            <p className="mt-2 text-sm text-muted">記事とセール日程の作成・編集、手動CSVによるセール日程の一括登録を利用できます。</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link className="rounded-btn bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accentDark" href="/admin/articles">
                記事管理
              </Link>
              <Link className="rounded-btn bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accentDark" href="/admin/sales">
                セール日程管理
              </Link>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function CountCard({ label, count }: { label: string; count: number }) {
  return (
    <Card>
      <p className="text-sm font-semibold text-muted">{label}</p>
      <p className="mt-2 text-3xl font-bold text-ink">{count}</p>
    </Card>
  );
}
