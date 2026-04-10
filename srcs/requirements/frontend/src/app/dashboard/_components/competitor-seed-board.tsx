"use client";

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

function SortableSeedRow({
    id,
    index,
    label,
    disabled,
}: {
    id: string;
    index: number;
    label: string;
    disabled?: boolean;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id,
        disabled,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 px-3 py-2.5",
                isDragging && "z-10 opacity-90 shadow-lg ring-1 ring-primary/30",
                disabled && "opacity-60",
            )}
        >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/15 font-mono text-xs font-bold text-primary">
                {index + 1}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{label}</span>
            <button
                type="button"
                className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground active:cursor-grabbing"
                {...attributes}
                {...listeners}
                disabled={disabled}
                aria-label="Drag to reorder seed"
            >
                <span className="material-symbols-outlined text-lg">drag_indicator</span>
            </button>
        </div>
    );
}

export function CompetitorSeedBoard({
    order,
    getLabel,
    disabled,
    onOrderChange,
}: {
    order: string[];
    getLabel: (id: string) => string;
    disabled?: boolean;
    onOrderChange: (next: string[]) => void;
}) {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = order.indexOf(String(active.id));
        const newIndex = order.indexOf(String(over.id));
        if (oldIndex < 0 || newIndex < 0) return;
        onOrderChange(arrayMove(order, oldIndex, newIndex));
    }

    if (order.length === 0) {
        return (
            <p className="text-xs text-muted-foreground">
                No ready competitors yet. Mark teams ready in the Lobby tab first.
            </p>
        );
    }

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={order} strategy={verticalListSortingStrategy} disabled={disabled}>
                <div className="flex flex-col gap-2">
                    {order.map((id, index) => (
                        <SortableSeedRow
                            key={id}
                            id={id}
                            index={index}
                            label={getLabel(id)}
                            disabled={disabled}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}
