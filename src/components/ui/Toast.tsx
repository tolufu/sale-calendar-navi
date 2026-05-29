"use client";

import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

type ToastProps = {
  message: string;
  onClose: () => void;
  variant?: "success" | "error";
};

export function Toast({ message, onClose, variant = "success" }: ToastProps) {
  const Icon = variant === "error" ? AlertCircle : CheckCircle2;

  return (
    <div className="fixed bottom-24 right-4 z-50 flex max-w-sm items-center gap-3 rounded-lg border border-line bg-white px-4 py-3 text-sm shadow-soft md:bottom-4">
      <Icon className={variant === "error" ? "h-5 w-5 text-rakuten" : "h-5 w-5 text-accent"} aria-hidden />
      <p className="flex-1 text-ink">{message}</p>
      <Button type="button" variant="ghost" className="min-h-8 px-2" onClick={onClose} aria-label="閉じる">
        <X className="h-4 w-4" aria-hidden />
      </Button>
    </div>
  );
}
