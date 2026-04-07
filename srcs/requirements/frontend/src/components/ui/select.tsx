"use client";

import * as React from "react";
import * as ReactDOM from "react-dom";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Context for state management ---
interface SelectContextProps {
  value: string;
  onValueChange: (value: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  selectedLabel: React.ReactNode;
  setSelectedLabel: (label: React.ReactNode) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

const SelectContext = React.createContext<SelectContextProps | undefined>(undefined);

function useSelect() {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error("Select components must be used within a <Select />");
  }
  return context;
}

// --- Root Component ---
export function Select({
  children,
  value,
  onValueChange,
  disabled = false,
}: {
  children: React.ReactNode;
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedLabel, setSelectedLabel] = React.useState<React.ReactNode>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <SelectContext.Provider value={{ value, onValueChange, isOpen, setIsOpen, selectedLabel, setSelectedLabel, triggerRef }}>
      <div ref={containerRef} className={cn("relative w-full", disabled && "opacity-50 pointer-events-none")}>
        {children}
      </div>
    </SelectContext.Provider>
  );
}

// --- Trigger ---
export function SelectTrigger({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { isOpen, setIsOpen, triggerRef } = useSelect();

  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={() => setIsOpen(!isOpen)}
      className={cn(
        "dashboard-input flex items-center justify-between gap-2 px-3 py-2 w-full text-left transition-all duration-200",
        isOpen && "border-[var(--primary)] ring-1 ring-[var(--primary)]/20 shadow-[0_0_15px_rgba(var(--theme-color-rgb,var(--primary)),0.15)]",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2 flex-1 truncate">
        {children}
      </div>
      <span
        className={cn(
          "material-symbols-outlined transform transition-transform duration-300 opacity-40 text-[18px] shrink-0",
          isOpen ? "rotate-180" : ""
        )}
      >
        expand_more
      </span>
    </button>
  );
}

// --- Value ---
export function SelectValue({
  placeholder,
  className,
}: {
  placeholder?: string;
  className?: string;
}) {
  const { selectedLabel } = useSelect();
  return (
    <span className={cn("truncate block", !selectedLabel && "opacity-50", className)}>
      {selectedLabel || placeholder}
    </span>
  );
}

// --- Content ---
export function SelectContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { isOpen, triggerRef } = useSelect();
  const [pos, setPos] = React.useState<{ top: number; left: number; width: number } | null>(null);

  React.useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 6, left: rect.left, width: rect.width });
    }
  }, [isOpen, triggerRef]);

  if (!isOpen || !pos) return null;

  return ReactDOM.createPortal(
    <div
      className={cn(
        "animate-in fade-in-0 zoom-in-95",
        className
      )}
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        width: pos.width,
        zIndex: 9999,
        maxHeight: "300px",
        overflowY: "auto",
        background: "oklch(0.15 0 0 / 0.97)",
        backdropFilter: "blur(24px) saturate(1.2)",
        WebkitBackdropFilter: "blur(24px) saturate(1.2)",
        border: "1px solid oklch(1 0 0 / 0.1)",
        borderRadius: "var(--radius)",
        boxShadow: "0 16px 48px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(0, 0, 0, 0.2)",
        padding: "4px",
      }}
    >
      <div className="space-y-0.5">
        {children}
      </div>
    </div>,
    document.body
  );
}

// --- Item ---
export function SelectItem({
  children,
  value,
  className,
}: {
  children: React.ReactNode;
  value: string;
  className?: string;
}) {
  const { value: selectedValue, onValueChange, setIsOpen, setSelectedLabel } = useSelect();
  const isSelected = selectedValue === value;

  // Sync label to trigger
  React.useEffect(() => {
    if (isSelected) {
      setSelectedLabel(children);
    }
  }, [isSelected, children, setSelectedLabel]);

  const handleSelect = () => {
    onValueChange(value);
    setIsOpen(false);
  };

  return (
    <div
      onClick={handleSelect}
      className={cn(
        "flex items-center justify-between gap-2 px-3 py-2 cursor-pointer transition-all duration-150 rounded-md text-sm",
        isSelected 
          ? "font-semibold shadow-sm" 
          : "hover:bg-white/10",
        className
      )}
      style={isSelected ? {
        backgroundColor: "var(--primary)",
        color: "#fff",
      } : {
        color: "oklch(0.8 0 0)",
      }}
    >
      <span className="truncate">{children}</span>
      {isSelected && (
        <span className="material-symbols-outlined text-[16px] shrink-0">check</span>
      )}
    </div>
  );
}

// --- Group & Label ---
export function SelectGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("py-1", className)}>{children}</div>;
}

export function SelectLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-40", className)}>
      {children}
    </div>
  );
}

// --- Separator ---
export function SelectSeparator({ className }: { className?: string }) {
  return <div className={cn("-mx-1 my-1 h-px bg-border/20", className)} />;
}

// --- Scroll Buttons (Static placeholders for our custom implementation) ---
export function SelectScrollUpButton() { return null; }
export function SelectScrollDownButton() { return null; }
