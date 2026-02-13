import { Player } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { X, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PlayerCardProps {
  player: Player;
  onRemove: () => void;
  className?: string;
}

export function PlayerCard({ player, onRemove, className }: PlayerCardProps) {
  return (
    <div className={cn(
      "bg-background rounded-xl p-3 border border-border flex items-center justify-between group hover:border-primary/50 transition-all shadow-sm",
      className
    )}>
      <div className="flex items-center gap-3 overflow-hidden">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0",
          player.isGoalkeeper ? 'bg-secondary text-secondary-foreground' : 'bg-primary/10 text-primary'
        )}>
          {player.isGoalkeeper ? <Shield className="w-4 h-4" /> : player.name.charAt(0)}
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="font-bold truncate text-sm">{player.name}</span>
          {player.isGoalkeeper && (
            <Badge variant="secondary" className="w-fit h-4 text-[10px] px-1 py-0 uppercase">Goleiro</Badge>
          )}
        </div>
      </div>
      
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-muted-foreground hover:text-destructive"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
