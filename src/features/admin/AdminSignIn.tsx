"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageHeader } from "@/components/ui/PageHeader";
import { signInAdmin } from "@/lib/firebase/admin";
import { isFirebaseConfigured } from "@/lib/firebase/client";

export function AdminSignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await signInAdmin(email, password);
      router.replace("/admin");
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "サインインに失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="管理者サインイン" description="管理者allowlistに登録済みのFirebase Authアカウントでサインインします。" />
      {!isFirebaseConfigured ? (
        <ErrorState
          title="Firebaseが未設定です"
          message="管理者コンソールを利用するには、Firebase Web設定を環境変数へ登録してください。公開画面はローカルモードで利用できます。"
        />
      ) : (
        <Card>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-semibold text-ink">メールアドレス</span>
              <input
                className="mt-1 w-full rounded-btn border border-line bg-white px-3 py-2 text-sm text-ink"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-ink">パスワード</span>
              <input
                className="mt-1 w-full rounded-btn border border-line bg-white px-3 py-2 text-sm text-ink"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "確認中..." : "サインイン"}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
