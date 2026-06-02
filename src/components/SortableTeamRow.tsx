"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

interface Props {
  id: string;
  name: string;
  flag: string;
  position: number;
  status?: "qualified" | "eliminated";
  badge?: string;
}

const borderByStatus: Record<string, string> = {
  qualified: "border-brand-600",
  eliminated: "border-pitch-500",
  default: "border-pitch-500",
};

const bgByStatus: Record<string, string> = {
  qualified: "bg-pitch-700",
  eliminated: "bg-pitch-800",
  default: "bg-pitch-700",
};

const nameByStatus: Record<string, string> = {
  qualified: "text-pitch-50",
  eliminated: "text-pitch-300",
  default: "text-pitch-100",
};

export function SortableTeamRow({ id, name, flag, position, status, badge }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const key = status ?? "default";

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 rounded-xl border ${borderByStatus[key]} ${bgByStatus[key]} px-3 py-2.5 select-none transition-shadow ${
        isDragging ? "opacity-40 shadow-xl" : "shadow-sm"
      }`}
    >
      <span className="w-4 shrink-0 text-center text-xs font-bold text-pitch-400">
        {position}
      </span>
      <span className="text-lg leading-none">{flag}</span>
      <span className={`flex-1 text-sm font-medium ${nameByStatus[key]}`}>{name}</span>
      {badge && (
        <span className="shrink-0 rounded bg-pitch-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-pitch-200">
          {badge}
        </span>
      )}
      <button
        className="shrink-0 cursor-grab touch-none text-pitch-400 active:cursor-grabbing"
        aria-label={`Arrastar ${name}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} />
      </button>
    </div>
  );
}
