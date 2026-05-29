"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toast } from "@/components/ui/Toast";
import { getAnonymousUserId } from "@/lib/firebase/auth";
import { getRepositories } from "@/lib/repositories";

export function NotificationSettings() {
  const [userId, setUserId] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [leadDays, setLeadDays] = useState(2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const uid = await getAnonymousUserId();
      const setting = await getRepositories().notifications.get(uid);
      setUserId(uid);
      setEnabled(setting.enabled);
      setLeadDays(setting.leadDays);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "通知設定を読み込めませんでした。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    await getRepositories().notifications.save({ userId, enabled, leadDays, perMerchant: null });
    setToast("通知設定を保存しました。");
  }

  if (loading) return <Skeleton className="h-72 w-full" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold">通知</p>
          <p className="mt-1 text-sm text-muted">セール前の見直しタイミングを保存します。</p>
        </div>
        <input type="checkbox" className="h-5 w-5" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} aria-label="通知を有効化" />
      </div>
      <label className="mt-6 block text-sm font-semibold" htmlFor="leadDays">何日前に確認するか</label>
      <input id="leadDays" type="number" min="0" max="30" className="mt-2 w-32 rounded-md border border-line px-3 py-2" value={leadDays} onChange={(event) => setLeadDays(Number(event.target.value))} />
      <div className="mt-6">
        <Button onClick={() => void save()}>保存する</Button>
      </div>
      {toast ? <Toast message={toast} onClose={() => setToast(null)} /> : null}
    </Card>
  );
}
