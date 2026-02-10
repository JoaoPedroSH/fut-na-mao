import { Player } from "@shared/schema";
import { cn } from "@/lib/utils";
import { User, X } from "lucide-react";

interface PlayerCardProps {
  player: Player;
  onRemove?: () => void;
  className?: string;
}

export function PlayerCard({ player, onRemove, className }: PlayerCardProps) {
  return (
    <div 
      className={cn(
        "flex items-center justify-between p-3 rounded-lg bg-white dark:bg-zinc-900 border border-border shadow-sm hover:shadow-md transition-all group",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
          <User className="w-4 h-4" />
        </div>
        <span className="font-medium font-body text-foreground truncate max-w-[120px] sm:max-w-[200px]">
          {player.name}
        </span>
      </div>
      
      {onRemove && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
