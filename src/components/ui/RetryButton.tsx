import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";

type RetryButtonProps = {
  onRetry: () => void;
};

export function RetryButton({ onRetry }: RetryButtonProps) {
  return (
    <Button type="button" variant="secondary" onClick={onRetry}>
      <RotateCcw className="mr-2 h-4 w-4" aria-hidden />
      再試行
    </Button>
  );
}
