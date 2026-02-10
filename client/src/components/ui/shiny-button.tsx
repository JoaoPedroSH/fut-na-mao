import { cn } from "@/lib/utils";
import React from "react";
import { motion } from "framer-motion";

interface ShinyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg" | "xl";
}

export const ShinyButton = React.forwardRef<HTMLButtonElement, ShinyButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    
    const variants = {
      primary: "bg-primary text-primary-foreground shadow-primary/30",
      secondary: "bg-secondary text-secondary-foreground shadow-secondary/30",
      danger: "bg-destructive text-destructive-foreground shadow-destructive/30",
      ghost: "bg-transparent text-foreground hover:bg-muted/50 shadow-none border border-border/50",
    };

    const sizes = {
      sm: "text-sm px-3 py-1.5 rounded-md",
      md: "text-base px-5 py-2.5 rounded-lg",
      lg: "text-lg px-8 py-4 rounded-xl font-bold uppercase tracking-wider",
      xl: "text-2xl px-10 py-6 rounded-2xl font-black uppercase tracking-widest",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98, y: 0 }}
        className={cn(
          "relative overflow-hidden transition-all duration-300 shadow-lg font-display",
          variants[variant],
          sizes[size],
          "disabled:opacity-50 disabled:pointer-events-none",
          className
        )}
        {...props}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
        
        {variant !== 'ghost' && (
          <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0" />
        )}
      </motion.button>
    );
  }
);
ShinyButton.displayName = "ShinyButton";
