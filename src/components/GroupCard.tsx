"use client";

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { TEAMS } from "@/data/worldcup2026";
import { SortableTeamRow } from "./SortableTeamRow";

interface Props {
  letter: string;
  teamIds: string[];
  onChange: (newOrder: string[]) => void;
}

export function GroupCard({ letter, teamIds, onChange }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = teamIds.indexOf(String(active.id));
    const newIndex = teamIds.indexOf(String(over.id));
    onChange(arrayMove(teamIds, oldIndex, newIndex));
  }

  return (
    <div className="rounded-2xl border border-pitch-500 bg-pitch-800 p-3 shadow-card">
      <h3 className="mb-2.5 text-center text-xs font-bold uppercase tracking-widest text-neon-500">
        Grupo {letter}
      </h3>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={teamIds} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-1.5">
            {teamIds.map((id, index) => {
              const team = TEAMS[id];
              return (
                <SortableTeamRow
                  key={id}
                  id={id}
                  name={team?.name ?? id}
                  flag={team?.flag ?? "🏳"}
                  position={index + 1}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
