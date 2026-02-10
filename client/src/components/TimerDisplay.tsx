import { cn } from "@/lib/utils";

interface TimerDisplayProps {
  seconds: number;
  className?: string;
  variant?: "default" | "danger" | "warning";
}

export function TimerDisplay({ seconds, className, variant = "default" }: TimerDisplayProps) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  
  const formattedMins = String(mins).padStart(2, '0');
  const formattedSecs = String(secs).padStart(2, '0');

  const variants = {
    default: "text-foreground",
    danger: "text-destructive animate-pulse",
    warning: "text-secondary",
  };

  return (
    <div className={cn("font-mono font-bold tracking-tighter tabular-nums", variants[variant], className)}>
      <span className="bg-background/50 px-2 rounded">{formattedMins}</span>
      <span className="animate-pulse">:</span>
      <span className="bg-background/50 px-2 rounded">{formattedSecs}</span>
    </div>
  );
}
