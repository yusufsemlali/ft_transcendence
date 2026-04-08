"use client";

import * as React from "react";
import { Menu } from "@base-ui/react/menu";
import { cn } from "@/lib/utils";

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
            "dropdown-menu-panel",
            className
          )}
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
      className={cn("dropdown-menu-label", inset && "dropdown-menu-label--inset", className)}
      {...props}
    />
  );
}

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
        "dropdown-menu-item",
        inset && "dropdown-menu-item--inset",
        variant === "destructive" && "dropdown-menu-item--destructive",
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
      className={cn("dropdown-menu-separator", className)}
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
      className={cn("dropdown-menu-shortcut", className)}
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
