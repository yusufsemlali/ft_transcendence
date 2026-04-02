import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Card — the foundational container primitive.
 * Enforces consistent radius, glassmorphism, and padding.
 * 
 * Variants:
 * - default: Standard content padding
 * - sm: Compact for stats or lists
 * - glass: Extra transparency
 */
interface CardProps extends React.ComponentProps<"div"> {
  size?: "default" | "sm";
  variant?: "default" | "glass" | "ghost";
}

function Card({
  className,
  size = "default",
  variant = "default",
  ...props
}: CardProps) {
  return (
    <div
      data-slot="card"
      data-size={size}
      data-variant={variant}
      className={cn(
        "glass-card transition-all duration-300",
        size === "default" && "p-6 sm:p-8",
        size === "sm" && "p-4 sm:p-5",
        variant === "ghost" && "bg-transparent border-transparent shadow-none backdrop-blur-none",
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "flex flex-col gap-1.5 mb-6 @container",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "text-lg font-bold tracking-tight text-foreground",
        className,
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm font-medium", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "mt-6 flex items-center pt-6 border-t border-border/50",
        className,
      )}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardContent,
  CardDescription,
};
