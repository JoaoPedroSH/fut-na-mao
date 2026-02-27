import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface TimerDisplayProps {
  seconds: number;
  className?: string;
  variant?: "default" | "danger" | "warning";
  phase?: 'setup' | 'playing' | 'paused' | 'finished';
  serverTimer?: {
    startTime: number | null;
    durationAtStart: number;
    isRunning: boolean;
  };
}

export function TimerDisplay({ 
  seconds: initialSeconds, 
  className, 
  variant = "default",
  phase,
  serverTimer
}: TimerDisplayProps) {
  const [displaySeconds, setDisplaySeconds] = useState(initialSeconds);
  
  useEffect(() => {
    if (phase === 'playing' && serverTimer?.isRunning && serverTimer.startTime) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - serverTimer.startTime!) / 1000);
        setDisplaySeconds(Math.max(0, serverTimer.durationAtStart - elapsed));
      }, 100);
      return () => clearInterval(interval);
    } else {
      setDisplaySeconds(initialSeconds);
    }
  }, [initialSeconds, phase, serverTimer]);

  const mins = Math.floor(displaySeconds / 60);
  const secs = displaySeconds % 60;
  
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
