import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { RetryButton } from "@/components/ui/RetryButton";

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ title = "読み込みに失敗しました", message, onRetry }: ErrorStateProps) {
  return (
    <Card className="border-red-200 bg-red-50">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" aria-hidden />
        <div>
          <p className="font-semibold text-red-950">{title}</p>
          <p className="mt-1 text-sm text-red-800">{message}</p>
          {onRetry ? <div className="mt-4"><RetryButton onRetry={onRetry} /></div> : null}
        </div>
      </div>
    </Card>
  );
}
