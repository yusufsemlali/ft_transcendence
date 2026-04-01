import { cn } from "@/lib/utils";

type Gap = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * Stack — automatic vertical spacing between children.
 *
 * Replaces all manual margin-top / margin-bottom usage.
 * Spacing is controlled by the `gap` prop, mapped to --space-* tokens.
 *
 *   <Stack>            → 16px between children (md, default)
 *   <Stack gap="lg">   → 24px between children
 *   <Stack gap="sm">   → 8px between children
 */
export function Stack({
  children,
  gap = "md",
  className,
  ...props
}: {
  children: React.ReactNode;
  gap?: Gap;
  className?: string;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "className">) {
  return (
    <div className={cn("stack", `stack-${gap}`, className)} {...props}>
      {children}
    </div>
  );
}
