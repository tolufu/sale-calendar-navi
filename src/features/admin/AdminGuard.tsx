"use client";

import { useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { usePathname, useRouter } from "next/navigation";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { isAdminUser } from "@/lib/firebase/admin";
import { getFirebaseClient } from "@/lib/firebase/client";

type GuardState = "loading" | "allowed" | "denied" | "error";

export function AdminGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<GuardState>("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    if (pathname === "/admin/sign-in") {
      setState("allowed");
      return;
    }

    const client = getFirebaseClient();
    if (!client) {
      setState("error");
      setError("Firebaseが未設定のため、管理者コンソールは利用できません。公開画面はローカルモードで利用できます。");
      return;
    }

    return onAuthStateChanged(client.auth, async (user) => {
      if (!user || user.isAnonymous) {
        router.replace("/admin/sign-in");
        return;
      }

      try {
        setState((await isAdminUser(user)) ? "allowed" : "denied");
      } catch {
        setState("error");
        setError("管理者権限を確認できませんでした。Firestoreの設定と通信状態を確認してください。");
      }
    });
  }, [pathname, router]);

  if (state === "loading") {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (state === "denied") {
    return (
      <ErrorState
        title="管理者権限がありません"
        message="このアカウントは管理者allowlistに登録されていません。"
      />
    );
  }

  if (state === "error") {
    return <ErrorState title="管理者コンソールを利用できません" message={error} />;
  }

  return children;
}
