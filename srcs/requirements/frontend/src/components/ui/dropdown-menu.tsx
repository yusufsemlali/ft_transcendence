"use client";

import * as React from "react";
import { Menu } from "@base-ui/react/menu";
import { cn } from "@/lib/utils";

const glassPanelStyle: React.CSSProperties = {
  background: "oklch(0.16 0.01 260 / 0.85)",
  backdropFilter: "blur(40px) saturate(1.8)",
  WebkitBackdropFilter: "blur(40px) saturate(1.8)",
  border: "1px solid oklch(1 0 0 / 0.1)",
  boxShadow: `
    0 0 0 1px oklch(1 0 0 / 0.05),
    0 12px 30px -10px rgba(0, 0, 0, 0.6),
    0 4px 10px -5px rgba(0, 0, 0, 0.3)
  `,
};

function DropdownMenu({ modal = false, ...props }: React.ComponentProps<typeof Menu.Root>) {
  return <Menu.Root data-slot="dropdown-menu" modal={modal} {...props} />;
}

function DropdownMenuTrigger({ className, ...props }: React.ComponentProps<typeof Menu.Trigger>) {
  return (
    <Menu.Trigger
      data-slot="dropdown-menu-trigger"
      className={cn(className)}
      {...props}
    />
  );
}

function DropdownMenuContent({
  align = "start",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  className,
  ...props
}: React.ComponentProps<typeof Menu.Popup> &
  Pick<React.ComponentProps<typeof Menu.Positioner>, "align" | "alignOffset" | "side" | "sideOffset">) {
  return (
    <Menu.Portal>
      <Menu.Positioner
        className="isolate z-[10000] outline-none"
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
      >
        <Menu.Popup
          data-slot="dropdown-menu-content"
          className={cn(
            "relative isolate z-[10000] max-h-[min(32rem,90vh)] min-w-[14rem] w-(--anchor-width) origin-(--transform-origin) overflow-x-hidden overflow-y-auto p-1.5",
            "rounded-[var(--radius-lg)]",
            "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
            className
          )}
          style={glassPanelStyle}
          {...props}
        />
      </Menu.Positioner>
    </Menu.Portal>
  );
}

function DropdownMenuGroup({ className, ...props }: React.ComponentProps<typeof Menu.Group>) {
  return (
    <Menu.Group data-slot="dropdown-menu-group" className={cn(className)} {...props} />
  );
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof Menu.GroupLabel> & { inset?: boolean }) {
  return (
    <Menu.GroupLabel
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "px-3 py-2 text-[10px] font-bold tracking-[0.1em] text-white/30 h-8 flex items-center uppercase data-inset:pl-10",
        className
      )}
      {...props}
    />
  );
}

const itemBase =
  "relative flex cursor-pointer items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-[13px] font-medium outline-none transition-all duration-200 select-none " +
  "text-white/70 data-[highlighted]:bg-white/10 data-[highlighted]:text-white " +
  "data-[disabled]:pointer-events-none data-[disabled]:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-[1.1rem] [&_svg]:opacity-40 data-[highlighted]:[&_svg]:opacity-100";

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof Menu.Item> & {
  inset?: boolean;
  variant?: "default" | "destructive";
}) {
  return (
    <Menu.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        itemBase,
        "data-inset:pl-10",
        variant === "destructive" &&
          "text-red-400 data-[highlighted]:bg-red-500/15 data-[highlighted]:text-red-400",
        className
      )}
      {...props}
    />
  );
}

function DropdownMenuSeparator({ className, ...props }: React.ComponentProps<typeof Menu.Separator>) {
  return (
    <Menu.Separator
      data-slot="dropdown-menu-separator"
      className={cn("-mx-1.5 my-1.5 h-px bg-white/[0.06]", className)}
      {...props}
    />
  );
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "ml-auto text-xs tracking-widest text-[oklch(0.55_0_0)] opacity-80",
        className
      )}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
};
