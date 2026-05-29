import React from "react";
import { clsx } from "clsx";

type AdPlaceholderProps = {
  label?: string;
  slot?: string;
  className?: string;
};

export function AdPlaceholder({ label = "広告枠", slot = "ad-placeholder", className }: AdPlaceholderProps) {
  return (
    <aside className={clsx("rounded-lg border border-dashed border-line bg-white p-4 text-center text-sm text-muted", className)} data-ad-slot={slot}>
      <span className="block text-xs font-semibold uppercase tracking-wide text-muted">Advertisement</span>
      <span className="mt-1 block">{label}（審査前プレースホルダー）</span>
    </aside>
  );
}
