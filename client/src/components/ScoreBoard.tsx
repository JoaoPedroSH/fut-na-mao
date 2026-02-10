import { cn } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ScoreBoardProps {
  score: number;
  onIncrement: () => void;
  onDecrement: () => void;
  teamName: string;
  colorClass: string;
  readonly?: boolean;
}

export function ScoreBoard({ score, onIncrement, onDecrement, teamName, colorClass, readonly }: ScoreBoardProps) {
  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <h3 className={cn("text-2xl sm:text-3xl font-bold uppercase tracking-widest text-center", colorClass)}>
        {teamName}
      </h3>
      
      <div className="relative group">
        <div className={cn(
          "w-32 h-32 sm:w-48 sm:h-48 rounded-3xl flex items-center justify-center",
          "bg-white dark:bg-zinc-900 border-4 shadow-2xl transition-all",
          colorClass.replace("text-", "border-")
        )}>
          <AnimatePresence mode="popLayout">
            <motion.span 
              key={score}
              initial={{ scale: 0.5, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 1.5, opacity: 0, y: -20 }}
              className={cn("text-8xl sm:text-9xl font-display font-bold score-digit", colorClass)}
            >
              {score}
            </motion.span>
          </AnimatePresence>
        </div>

        {!readonly && (
          <div className="flex justify-between w-full mt-4 gap-4">
            <button 
              onClick={onDecrement}
              disabled={score <= 0}
              className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-muted hover:border-destructive hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-30"
            >
              <Minus className="w-6 h-6" />
            </button>
            <button 
              onClick={onIncrement}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform",
                colorClass.replace("text-", "bg-")
              )}
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
