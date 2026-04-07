"use client";

import * as React from "react";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
      className={cn("scroll-my-1 p-1", className)}
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
        "data-[open=true]:border-[var(--primary)] data-[open=true]:ring-1 data-[open=true]:ring-[var(--primary)]/20 data-[open=true]:shadow-[0_0_15px_rgba(var(--theme-color-rgb,var(--primary)),0.15)]",
        className
      )}
      style={{ padding: "8px 12px", minHeight: "36px" }}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon
        render={
          <span className="material-symbols-outlined shrink-0 text-[18px] opacity-40 transition-transform duration-300 data-[state=open]:rotate-180 pointer-events-none">
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
  sideOffset = 4,
  align = "start",
  alignOffset = 0,
  alignItemWithTrigger = false, // Set to false to behave like typical dropdown dropdowns
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
        className="isolate z-[9999]"
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          data-align-trigger={alignItemWithTrigger}
          className={cn(
            "relative isolate z-[9999] max-h-[300px] w-(--anchor-width) min-w-[var(--anchor-width)] origin-(--transform-origin) overflow-y-auto rounded-md shadow-md p-1",
            "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
            className
          )}
          style={{
            background: "oklch(0.15 0 0 / 0.97)",
            backdropFilter: "blur(24px) saturate(1.2)",
            WebkitBackdropFilter: "blur(24px) saturate(1.2)",
            border: "1px solid oklch(1 0 0 / 0.1)",
            boxShadow: "0 16px 48px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(0, 0, 0, 0.2)",
          }}
          {...props}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.List className="space-y-0.5">{children}</SelectPrimitive.List>
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
      className={cn("px-2 py-1.5 text-xs font-semibold text-[oklch(0.8_0_0)]", className)}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  ...props
}: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2 text-sm outline-none transition-all duration-150 select-none",
        "text-[oklch(0.8_0_0)] hover:bg-white/10 hover:text-white",
        "data-[highlighted]:bg-white/10 data-[highlighted]:text-white", // Base UI highlighted state
        "data-[selected]:bg-[var(--primary)] data-[selected]:text-white data-[selected]:font-semibold data-[selected]:shadow-sm", // Selected state
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="flex-1 truncate">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator
        render={
          <span className="material-symbols-outlined text-[16px] shrink-0 pointer-events-none">
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
      className={cn("pointer-events-none -mx-1 my-1 h-px bg-[oklch(1_0_0/0.1)]", className)}
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
        "flex cursor-default items-center justify-center py-1 bg-[oklch(0.15_0_0/0.97)] text-[var(--text-muted)] hover:text-white transition-colors",
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
        "flex cursor-default items-center justify-center py-1 bg-[oklch(0.15_0_0/0.97)] text-[var(--text-muted)] hover:text-white transition-colors",
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
