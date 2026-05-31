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

const QUALIFIED_COUNT = 8;

interface Props {
  teamIds: string[];
  groupOf: Record<string, string>;
  onChange: (newOrder: string[]) => void;
}

export function ThirdPlaceRankingCard({ teamIds, groupOf, onChange }: Props) {
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

  const qualified = teamIds.slice(0, QUALIFIED_COUNT);
  const eliminated = teamIds.slice(QUALIFIED_COUNT);

  return (
    <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">
          Passo 2 de 4
        </p>
        <h2 className="text-xl font-bold text-slate-900">
          Melhores terceiros classificados
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Arrasta para ordenar os 12 terceiros. Os{" "}
          <span className="font-semibold text-emerald-700">8 primeiros</span>{" "}
          apuram-se para os oitavos de final.
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={teamIds} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-1.5">
            {/* Qualified zone label */}
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                Apurados — 8 equipas
              </span>
            </div>

            {qualified.map((id, index) => {
              const team = TEAMS[id];
              return (
                <SortableTeamRow
                  key={id}
                  id={id}
                  name={team?.name ?? id}
                  flag={team?.flag ?? "🏳"}
                  position={index + 1}
                  status="qualified"
                  badge={groupOf[id]}
                />
              );
            })}

            {/* Divider */}
            <div className="my-2 flex items-center gap-2">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-bold text-red-400">
                Eliminados — 4 equipas
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {eliminated.map((id, index) => {
              const team = TEAMS[id];
              return (
                <SortableTeamRow
                  key={id}
                  id={id}
                  name={team?.name ?? id}
                  flag={team?.flag ?? "🏳"}
                  position={QUALIFIED_COUNT + index + 1}
                  status="eliminated"
                  badge={groupOf[id]}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
