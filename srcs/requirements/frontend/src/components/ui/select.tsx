"use client";

import * as React from "react";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { cn } from "@/lib/utils";

function Select({
  children,
  value,
  onValueChange,
  ...props
}: Omit<React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root>, 'value' | 'onValueChange'> & {
  value?: string;
  onValueChange?: (value: string) => void;
}) {
  return (
    <SelectPrimitive.Root
      value={value}
      onValueChange={onValueChange ? ((val: unknown) => onValueChange(String(val))) : undefined}
      {...props}
    >
      {children}
    </SelectPrimitive.Root>
  );
}

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("p-[var(--space-xs)]", className)}
      {...props}
    />
  );
}

function SelectValue({ className, ...props }: SelectPrimitive.Value.Props) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cn("flex flex-1 text-left truncate", className)}
      {...props}
    />
  );
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: SelectPrimitive.Trigger.Props & {
  size?: "sm" | "default";
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "dashboard-input flex items-center justify-between gap-2 w-full text-left transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
        "data-[popup-open]:border-[var(--primary)] data-[popup-open]:ring-1 data-[popup-open]:ring-[var(--primary)]/20",
        className
      )}
      style={{ padding: "8px 12px", minHeight: "36px" }}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon
        render={
          <span className="material-symbols-outlined shrink-0 text-[18px] opacity-40 transition-transform duration-300 pointer-events-none">
            expand_more
          </span>
        }
      />
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  side = "bottom",
  sideOffset = 6,
  align = "start",
  alignOffset = 0,
  alignItemWithTrigger = false,
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<
    SelectPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger"
  >) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        alignItemWithTrigger={alignItemWithTrigger}
        className="isolate z-[10000]"
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          data-align-trigger={alignItemWithTrigger}
          className={cn(
            "select-popup relative isolate z-[10000] max-h-[min(24rem,90vh)] min-w-[var(--anchor-width)] origin-(--transform-origin) overflow-y-auto",
            "animate-in fade-in-0 zoom-in-95 data-[ending-style]:animate-out data-[ending-style]:fade-out-0 data-[ending-style]:zoom-out-95",
            className
          )}
          style={{
            padding: "var(--space-xs)",
            borderRadius: "var(--radius)",
            background: "linear-gradient(145deg, oklch(100% 0 0 / var(--glass-opacity)) 0%, oklch(100% 0 0 / calc(var(--glass-opacity) / 2)) 100%)",
            backdropFilter: "blur(var(--glass-blur)) saturate(1.6)",
            WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(1.6)",
            border: "1px solid var(--border-color)",
            boxShadow: "var(--shadow-glass)",
          }}
          {...props}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.List>{children}</SelectPrimitive.List>
          <SelectScrollDownButton />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({
  className,
  ...props
}: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={cn(className)}
      style={{
        padding: "var(--space-sm)",
        fontSize: "0.65rem",
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase" as const,
        color: "var(--text-muted)",
      }}
      {...props}
    />
  );
}

function extractLabel(children: React.ReactNode): string | undefined {
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  const parts: string[] = [];
  React.Children.forEach(children, (child) => {
    if (typeof child === "string") parts.push(child);
    else if (typeof child === "number") parts.push(String(child));
  });
  return parts.length > 0 ? parts.join("") : undefined;
}

function SelectItem({
  className,
  children,
  label: labelProp,
  ...props
}: SelectPrimitive.Item.Props) {
  const label = labelProp ?? extractLabel(children);
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      label={label}
      className={cn("select-item", className)}
      style={{
        position: "relative",
        display: "flex",
        width: "100%",
        boxSizing: "border-box",
        cursor: "pointer",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--space-sm)",
        borderRadius: "calc(var(--radius) / 1.5)",
        padding: "var(--space-sm) var(--space-sm)",
        fontSize: "0.875rem",
        fontWeight: 400,
        outline: "none",
        transition: "background var(--transition-speed), color var(--transition-speed)",
        userSelect: "none",
        color: "var(--text-secondary)",
      }}
      {...props}
    >
      <SelectPrimitive.ItemText className="flex-1 truncate">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator
        render={
          <span
            className="material-symbols-outlined shrink-0 pointer-events-none"
            style={{ fontSize: "16px", color: "var(--primary)" }}
          >
            check
          </span>
        }
      />
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({
  className,
  ...props
}: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn(className)}
      style={{
        pointerEvents: "none",
        margin: "var(--space-xs) calc(-1 * var(--space-xs))",
        height: "1px",
        background: "var(--border-color)",
      }}
      {...props}
    />
  );
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors",
        className
      )}
      {...props}
    >
      <span className="material-symbols-outlined text-[16px]">expand_less</span>
    </SelectPrimitive.ScrollUpArrow>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors",
        className
      )}
      {...props}
    >
      <span className="material-symbols-outlined text-[16px]">expand_more</span>
    </SelectPrimitive.ScrollDownArrow>
  );
}

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
