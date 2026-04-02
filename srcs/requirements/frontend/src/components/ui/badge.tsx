import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outline" | "secondary" | "destructive" | "success";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-primary text-primary-foreground",
    outline: "border border-border text-foreground",
    secondary: "bg-muted text-muted-foreground",
    destructive: "bg-destructive text-destructive-foreground",
    success: "bg-green-500/20 text-green-400 border border-green-500/30",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest transition-colors",
        {
          "bg-primary text-primary-foreground": variant === "default",
          "border border-border text-foreground": variant === "outline",
          "bg-muted text-muted-foreground": variant === "secondary",
          "bg-destructive text-destructive-foreground": variant === "destructive",
          "bg-green-500/20 text-green-400 border border-green-500/30": variant === "success",
        },
        className
      )}
      {...props}
    />
  );
}
