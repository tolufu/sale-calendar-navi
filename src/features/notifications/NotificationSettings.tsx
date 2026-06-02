"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toast } from "@/components/ui/Toast";
import { saleEvents } from "@/data/sales";
import { getAnonymousUserId } from "@/lib/firebase/auth";
import { getRepositories } from "@/lib/repositories";
import type { Merchant, NotificationSetting, WishItem } from "@/lib/repositories/types";
import { defaultNotificationSetting, isValidNotificationEmail } from "@/lib/services/notifications";
import { generateUpcomingSaleReminders, reminderTimingLabels, type ReminderTiming } from "@/lib/utils/reminders";

export function NotificationSettings() {
  const [userId, setUserId] = useState("");
  const [setting, setSetting] = useState<NotificationSetting | null>(null);
  const [wishlist, setWishlist] = useState<WishItem[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const uid = await getAnonymousUserId();
      const repositories = getRepositories();
      const [savedSetting, wishItems, merchantItems] = await Promise.all([
        repositories.notifications.get(uid),
        repositories.wishlist.list(uid),
        repositories.merchants.list()
      ]);
      setUserId(uid);
      setSetting(savedSetting);
      setWishlist(wishItems);
      setMerchants(merchantItems);
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
    if (!setting) return;
    const email = setting.email?.trim() ?? "";
    if (email && !isValidNotificationEmail(email)) {
      setEmailError("メールアドレスの形式を確認してください。");
      return;
    }
    setEmailError(null);
    await getRepositories().notifications.save(setting);
    setToast("通知設定を保存しました。");
  }

  if (loading) return <Skeleton className="h-72 w-full" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  const current = setting ?? defaultNotificationSetting(userId);
  const reminders = generateUpcomingSaleReminders({
    wishlist,
    saleEvents,
    now: new Date(),
    setting: current
  });

  function updateSetting(patch: Partial<NotificationSetting>) {
    setSetting((previous) => ({ ...(previous ?? defaultNotificationSetting(userId)), ...patch }));
  }

  function updateTiming(timing: ReminderTiming, enabled: boolean) {
    updateSetting({ timings: { ...current.timings, [timing]: enabled } });
  }

  function updateMerchant(merchantId: string, enabled: boolean) {
    updateSetting({ perMerchant: { ...(current.perMerchant ?? {}), [merchantId]: enabled } });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold">通知</p>
            <p className="mt-1 text-sm text-muted">実メール送信はまだ行わず、将来の配信基盤に渡す設定だけ保存します。</p>
          </div>
          <input type="checkbox" className="h-5 w-5" checked={current.enabled} onChange={(event) => updateSetting({ enabled: event.target.checked })} aria-label="通知を有効化" />
        </div>

        <label className="mt-6 block text-sm font-semibold" htmlFor="email">メールアドレス（任意）</label>
        <input
          id="email"
          type="email"
          className="mt-2 w-full rounded-md border border-line px-3 py-2"
          value={current.email ?? ""}
          onChange={(event) => {
            const email = event.target.value;
            updateSetting({ email: email || null });
            if (!email || isValidNotificationEmail(email)) {
              setEmailError(null);
            }
          }}
          placeholder="name@example.com"
          aria-describedby={emailError ? "email-error" : undefined}
          aria-invalid={emailError ? "true" : "false"}
        />
        {emailError ? <p id="email-error" className="mt-2 text-sm font-semibold text-red-700">{emailError}</p> : null}

        <fieldset className="mt-6">
          <legend className="text-sm font-semibold">通知タイミング</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {(Object.keys(reminderTimingLabels) as ReminderTiming[]).map((timing) => (
              <label key={timing} className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm">
                <input type="checkbox" checked={current.timings[timing]} onChange={(event) => updateTiming(timing, event.target.checked)} />
                {reminderTimingLabels[timing]}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="text-sm font-semibold">対象EC</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {merchants.map((merchant) => (
              <label key={merchant.merchantId} className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={current.perMerchant?.[merchant.merchantId] ?? true}
                  onChange={(event) => updateMerchant(merchant.merchantId, event.target.checked)}
                />
                {merchant.name}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-6 rounded-md border border-line bg-surface p-3 text-xs leading-6 text-muted">
          配信停止URL用トークン: <span className="break-all font-mono">{current.unsubscribeToken}</span>
        </div>

        <div className="mt-6">
          <Button onClick={() => void save()}>保存する</Button>
        </div>
      </Card>
      <Card>
        <h2 className="font-bold">通知予定</h2>
        {reminders.length === 0 ? (
          <p className="mt-3 text-sm leading-6 text-muted">現在の欲しいものとセール予定からは通知候補がありません。</p>
        ) : (
          <div className="mt-3 space-y-3">
            {reminders.map((reminder) => (
              <div key={reminder.id} className="rounded-md border border-line bg-surface p-3 text-sm">
                <p className="font-semibold">{reminder.wishTitle}</p>
                <p className="mt-1 text-muted">{reminder.saleTitle} / {reminderTimingLabels[reminder.timing]}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
      {toast ? <Toast message={toast} onClose={() => setToast(null)} /> : null}
    </div>
  );
}
