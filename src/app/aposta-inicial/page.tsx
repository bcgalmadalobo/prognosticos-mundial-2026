"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { BracketView } from "@/components/BracketView";
import { GroupCard } from "@/components/GroupCard";
import { Protected } from "@/components/Protected";
import { ThirdPlaceRankingCard } from "@/components/ThirdPlaceRankingCard";
import { applyChoice, deriveRoundTeams, resolveBracket } from "@/lib/bracket";
import { getAppSettings, getInitialPrediction } from "@/lib/db";
import { auth } from "@/lib/firebase";
import { GROUP_LETTERS, GROUPS, TEAMS } from "@/data/worldcup2026";
import { useAuth } from "@/context/AuthContext";
import type { InitialPrediction } from "@/types";

const DRAFT_KEY = "initialPredictionDraft.v1";
const DEFAULT_DEADLINE_UTC = "2026-06-11T18:00:00.000Z";

// ── Compatibility guard ───────────────────────────────────────────────────────

function isGroupOrdersCompatible(groupOrders: Record<string, string[]>): boolean {
  for (const letter of GROUP_LETTERS) {
    const stored = groupOrders[letter];
    const canonical = GROUPS[letter];
    if (!stored || stored.length !== canonical.length) return false;
    const storedSet = new Set(stored);
    if (!canonical.every((id) => storedSet.has(id))) return false;
    if (!stored.every((id) => !!TEAMS[id])) return false;
  }
  return true;
}

// ── Types ────────────────────────────────────────────────────────────────────

type PageMode = "editing" | "summary";

interface Awards {
  topScorer: string;
  bestPlayer: string;
  bestYoungPlayer: string;
  bestGoalkeeper: string;
}

const EMPTY_AWARDS: Awards = {
  topScorer: "",
  bestPlayer: "",
  bestYoungPlayer: "",
  bestGoalkeeper: "",
};

interface DraftData {
  version: number;
  groupOrders: Record<string, string[]>;
  thirdPlaceRanking: string[];
  bracketChoices: Record<string, string | null>;
  awards: Awards;
  savedAt: string;
}

// ── Draft helpers ─────────────────────────────────────────────────────────────

function deriveThirds(groupOrders: Record<string, string[]>): string[] {
  return GROUP_LETTERS.map((g) => groupOrders[g]?.[2]).filter(
    (id): id is string => !!id,
  );
}

function mergeThirdPlace(current: string[], derived: string[]): string[] {
  const derivedSet = new Set(derived);
  const currentSet = new Set(current);
  const kept = current.filter((id) => derivedSet.has(id));
  const added = derived.filter((id) => !currentSet.has(id));
  return [...kept, ...added];
}

function loadDraft(): {
  groupOrders: Record<string, string[]>;
  thirdPlaceRanking: string[];
  bracketChoices: Record<string, string | null>;
  awards: Awards;
  discarded: boolean;
} {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) {
      const groups = structuredClone(GROUPS);
      return {
        groupOrders: groups,
        thirdPlaceRanking: deriveThirds(groups),
        bracketChoices: {},
        awards: { ...EMPTY_AWARDS },
        discarded: false,
      };
    }
    const parsed = JSON.parse(raw) as Partial<DraftData>;
    const groupOrders = parsed.groupOrders ?? structuredClone(GROUPS);

    if (!isGroupOrdersCompatible(groupOrders)) {
      localStorage.removeItem(DRAFT_KEY);
      const groups = structuredClone(GROUPS);
      return {
        groupOrders: groups,
        thirdPlaceRanking: deriveThirds(groups),
        bracketChoices: {},
        awards: { ...EMPTY_AWARDS },
        discarded: true,
      };
    }

    const version = parsed.version ?? 0;
    const thirdPlaceRanking =
      !parsed.thirdPlaceRanking || version < 2
        ? deriveThirds(groupOrders)
        : parsed.thirdPlaceRanking;
    const bracketChoices =
      version >= 3 && parsed.bracketChoices ? parsed.bracketChoices : {};
    const awards =
      version >= 4 && parsed.awards ? parsed.awards : { ...EMPTY_AWARDS };
    return { groupOrders, thirdPlaceRanking, bracketChoices, awards, discarded: false };
  } catch {
    const groups = structuredClone(GROUPS);
    return {
      groupOrders: groups,
      thirdPlaceRanking: deriveThirds(groups),
      bracketChoices: {},
      awards: { ...EMPTY_AWARDS },
      discarded: false,
    };
  }
}

function persistDraft(
  groupOrders: Record<string, string[]>,
  thirdPlaceRanking: string[],
  bracketChoices: Record<string, string | null>,
  awards: Awards,
) {
  const data: DraftData = {
    version: 4,
    groupOrders,
    thirdPlaceRanking,
    bracketChoices,
    awards,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
}

// ── Deadline display helper ───────────────────────────────────────────────────

function formatDeadlineDisplay(d: Date): string {
  try {
    const day = d.toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Europe/Lisbon",
    });
    const time = d.toLocaleTimeString("pt-PT", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Lisbon",
    });
    return `${day} às ${time}`;
  } catch {
    return "11/06/2026 às 19:00";
  }
}

// ── Summary (read-only) ───────────────────────────────────────────────────────

function SummaryTeam({ teamId }: { teamId?: string | null }) {
  if (!teamId) return <span className="text-pitch-400">—</span>;
  const team = TEAMS[teamId];
  return (
    <span className="flex items-center gap-1.5 text-sm font-medium text-pitch-50">
      {team?.flag && <span>{team.flag}</span>}
      <span>{team?.name ?? teamId}</span>
    </span>
  );
}

function PredictionSummary({
  prediction,
  isLocked,
  isClosed,
  onEdit,
  deadlineDisplay,
}: {
  prediction: InitialPrediction;
  isLocked: boolean;
  isClosed: boolean;
  onEdit: () => void;
  deadlineDisplay: string;
}) {
  const standings = [
    { label: "Campeão", teamId: prediction.winner },
    { label: "Vice-campeão", teamId: prediction.runnerUp },
    { label: "3.º Lugar", teamId: prediction.thirdPlace },
    { label: "4.º Lugar", teamId: prediction.fourthPlace },
  ];

  const awardRows = [
    { label: "Melhor Marcador", value: prediction.topScorer },
    { label: "Melhor Jogador", value: prediction.bestPlayer },
    { label: "Melhor Jogador Jovem", value: prediction.bestYoungPlayer },
    { label: "Melhor Guarda-Redes", value: prediction.bestGoalkeeper },
  ];

  const lockedMessage = isClosed
    ? "A aposta inicial está temporariamente fechada pelo administrador."
    : "A tua aposta está guardada. Boa sorte!";

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      {isLocked ? (
        <div className="mb-6 rounded-2xl border border-neon-500/30 bg-pitch-700 p-5 text-center">
          <p className="text-lg font-bold text-neon-400">Aposta fechada</p>
          <p className="mt-1 text-sm text-pitch-300">{lockedMessage}</p>
        </div>
      ) : (
        <div className="mb-6 rounded-2xl border border-pitch-500 bg-pitch-700 p-5">
          <p className="text-base font-bold text-pitch-50">Aposta guardada</p>
          <p className="mt-1 text-sm text-pitch-300">
            Podes editar a tua aposta até{" "}
            <strong className="text-pitch-50">{deadlineDisplay}</strong>.
          </p>
          <Button
            type="button"
            onClick={onEdit}
            className="mt-3 px-4 py-2 text-sm"
          >
            Editar aposta
          </Button>
        </div>
      )}

      <div className="mb-4 rounded-2xl border border-pitch-500 bg-pitch-800 p-5 shadow-card">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-pitch-400">
          Fase Final
        </h2>
        <div className="space-y-3">
          {standings.map(({ label, teamId }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-sm text-pitch-300">{label}</span>
              <SummaryTeam teamId={teamId} />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-pitch-500 bg-pitch-800 p-5 shadow-card">
        <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-pitch-400">
          Prémios Individuais
        </h2>
        <div className="space-y-3">
          {awardRows.map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-sm text-pitch-300">{label}</span>
              <span className="text-sm font-medium text-pitch-50">
                {value || "—"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

// ── Award fields config ───────────────────────────────────────────────────────

const AWARD_FIELDS: {
  key: keyof Awards;
  label: string;
  placeholder: string;
}[] = [
  {
    key: "topScorer",
    label: "Melhor Marcador (Bota de Ouro)",
    placeholder: "Ex: Mbappé",
  },
  {
    key: "bestPlayer",
    label: "Melhor Jogador (Bola de Ouro)",
    placeholder: "Ex: Vinicius Jr.",
  },
  {
    key: "bestYoungPlayer",
    label: "Melhor Jogador Jovem",
    placeholder: "Ex: Yamal",
  },
  {
    key: "bestGoalkeeper",
    label: "Melhor Guarda-Redes",
    placeholder: "Ex: Courtois",
  },
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ApostaInicialPage() {
  const { user } = useAuth();

  const [groupOrders, setGroupOrders] = useState<Record<string, string[]>>(
    () => structuredClone(GROUPS),
  );
  const [thirdPlaceRanking, setThirdPlaceRanking] = useState<string[]>(
    () => deriveThirds(structuredClone(GROUPS)),
  );
  const [bracketChoices, setBracketChoices] = useState<
    Record<string, string | null>
  >({});
  const [awards, setAwards] = useState<Awards>({ ...EMPTY_AWARDS });
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Deadline + prediction status state — starts with hardcoded defaults
  const [deadline, setDeadline] = useState<Date>(
    () => new Date(DEFAULT_DEADLINE_UTC),
  );
  const [initialPredictionStatus, setInitialPredictionStatus] = useState<"open" | "closed">("open");
  const isClosed = initialPredictionStatus === "closed";
  const isPastDeadline = useMemo(
    () => Date.now() >= deadline.getTime(),
    [deadline],
  );
  const isLocked = isClosed || isPastDeadline;
  const deadlineDisplay = useMemo(() => formatDeadlineDisplay(deadline), [deadline]);

  // Page / submission state
  const [pageMode, setPageMode] = useState<PageMode>("editing");
  const [existingPrediction, setExistingPrediction] =
    useState<InitialPrediction | null>(null);
  const [loadingPrediction, setLoadingPrediction] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [draftWasCleared, setDraftWasCleared] = useState(false);
  const [firestorePredictionIncompatible, setFirestorePredictionIncompatible] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  // Effect 1: Hydrate form from localStorage on mount (SSR-safe placeholder)
  useEffect(() => {
    const draft = loadDraft();
    setGroupOrders(draft.groupOrders);
    setThirdPlaceRanking(draft.thirdPlaceRanking);
    setBracketChoices(draft.bracketChoices);
    setAwards(draft.awards);
    if (draft.discarded) setDraftWasCleared(true);
    setHydrated(true);
  }, []);

  // Effect 2: Load deadline + existing prediction from Firestore
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoadingPrediction(true);

    Promise.all([
      getAppSettings().catch(() => null),
      getInitialPrediction(user.uid).catch(() => null),
    ])
      .then(([settings, pred]) => {
        if (cancelled) return;

        // Override deadline and status from Firestore if present
        if (settings?.initialPredictionDeadline) {
          const d = new Date(settings.initialPredictionDeadline);
          if (!isNaN(d.getTime())) setDeadline(d);
        }
        if (settings?.initialPredictionStatus) {
          setInitialPredictionStatus(settings.initialPredictionStatus);
        }

        if (pred) {
          if (!isGroupOrdersCompatible(pred.groupPositions ?? {})) {
            // Prediction has stale team IDs — flag it; do not load stale data into form
            setFirestorePredictionIncompatible(true);
            setExistingPrediction(pred);
            // pageMode stays "editing" so the user can resubmit with current teams
          } else {
            // Populate form state from Firestore prediction (overrides localStorage draft)
            setGroupOrders(pred.groupPositions ?? structuredClone(GROUPS));
            setThirdPlaceRanking(
              pred.thirdPlaceRanking ??
                deriveThirds(pred.groupPositions ?? structuredClone(GROUPS)),
            );
            setBracketChoices(pred.bracketChoices ?? {});
            setAwards({
              topScorer: pred.topScorer ?? "",
              bestPlayer: pred.bestPlayer ?? "",
              bestYoungPlayer: pred.bestYoungPlayer ?? "",
              bestGoalkeeper: pred.bestGoalkeeper ?? "",
            });
            setExistingPrediction(pred);
            setPageMode("summary");
          }
        }
      })
      .catch(() => {
        if (!cancelled && user?.hasSubmittedInitialPrediction) setFetchError(true);
      })
      .finally(() => {
        if (!cancelled) setLoadingPrediction(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  // Reconcile thirds ranking when group orders change
  useEffect(() => {
    if (!hydrated) return;
    const derived = deriveThirds(groupOrders);
    setThirdPlaceRanking((prev) => {
      const merged = mergeThirdPlace(prev, derived);
      const unchanged =
        merged.length === prev.length &&
        merged.every((id, i) => id === prev[i]);
      return unchanged ? prev : merged;
    });
  }, [groupOrders, hydrated]);

  // Auto-save draft only while in editing mode
  useEffect(() => {
    if (!hydrated) return;
    if (pageMode !== "editing") return;
    persistDraft(groupOrders, thirdPlaceRanking, bracketChoices, awards);
    setLastSaved(new Date());
  }, [groupOrders, thirdPlaceRanking, bracketChoices, awards, hydrated, pageMode]);

  // Bracket state and derived round teams
  const bracketState = useMemo(
    () => resolveBracket(groupOrders, thirdPlaceRanking, bracketChoices),
    [groupOrders, thirdPlaceRanking, bracketChoices],
  );
  const derived = useMemo(
    () => deriveRoundTeams(bracketState),
    [bracketState],
  );

  // Validation
  const validationErrors = useMemo(() => {
    const errs: string[] = [];

    for (const g of GROUP_LETTERS) {
      if (!groupOrders[g] || groupOrders[g].length < 4)
        errs.push(`Grupo ${g} incompleto.`);
    }
    if (thirdPlaceRanking.length !== 12)
      errs.push("Os 12 terceiros classificados devem estar definidos.");
    if (thirdPlaceRanking.slice(0, 8).length !== 8)
      errs.push("Os 8 melhores terceiros devem estar definidos.");
    if (bracketState.thirdAssignmentError)
      errs.push("Combinação de terceiros classificados inválida. Verifica o ranking dos terceiros.");
    if (derived.roundOf32Teams.length !== 32)
      errs.push("Bracket incompleto — 16-avos.");
    if (derived.roundOf16Teams.length !== 16)
      errs.push("Bracket incompleto — oitavos.");
    if (derived.quarterFinalTeams.length !== 8)
      errs.push("Bracket incompleto — quartos.");
    if (derived.semiFinalTeams.length !== 4)
      errs.push("Bracket incompleto — meias-finais.");
    if (derived.finalTeams.length !== 2)
      errs.push("Bracket incompleto — final.");
    if (!derived.winner) errs.push("Vencedor do torneio não escolhido.");
    if (!derived.runnerUp) errs.push("Finalista não determinado.");
    if (!derived.thirdPlace) errs.push("Jogo do 3.º lugar não concluído.");
    if (!derived.fourthPlace) errs.push("4.º lugar não determinado.");
    if (!awards.topScorer.trim()) errs.push("Melhor marcador em falta.");
    if (!awards.bestPlayer.trim()) errs.push("Melhor jogador em falta.");
    if (!awards.bestYoungPlayer.trim())
      errs.push("Melhor jogador jovem em falta.");
    if (!awards.bestGoalkeeper.trim())
      errs.push("Melhor guarda-redes em falta.");

    return errs;
  }, [groupOrders, thirdPlaceRanking, bracketState, derived, awards]);

  const isValid = validationErrors.length === 0;

  // Handlers
  const handleGroupChange = useCallback(
    (letter: string, newOrder: string[]) => {
      setGroupOrders((prev) => ({ ...prev, [letter]: newOrder }));
    },
    [],
  );

  const handleThirdPlaceChange = useCallback((newOrder: string[]) => {
    setThirdPlaceRanking(newOrder);
  }, []);

  const handleBracketChoice = useCallback(
    (matchId: string, winnerId: string) => {
      setBracketChoices((prev) => applyChoice(prev, matchId, winnerId));
    },
    [],
  );

  const handleAwardChange = useCallback(
    (key: keyof Awards, value: string) => {
      setAwards((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  function handleManualSave() {
    persistDraft(groupOrders, thirdPlaceRanking, bracketChoices, awards);
    setLastSaved(new Date());
  }

  async function handleSubmit() {
    if (!user || !isValid) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Sem sessão ativa. Faz login novamente.");

      const payload = {
        userId: user.uid,
        groupPositions: groupOrders,
        thirdPlaceRanking,
        qualifiedThirdPlacedTeams: thirdPlaceRanking.slice(0, 8),
        roundOf32Teams: derived.roundOf32Teams,
        roundOf16Teams: derived.roundOf16Teams,
        quarterFinalTeams: derived.quarterFinalTeams,
        semiFinalTeams: derived.semiFinalTeams,
        finalTeams: derived.finalTeams,
        winner: derived.winner!,
        runnerUp: derived.runnerUp!,
        thirdPlace: derived.thirdPlace,
        fourthPlace: derived.fourthPlace,
        topScorer: awards.topScorer.trim(),
        bestPlayer: awards.bestPlayer.trim(),
        bestYoungPlayer: awards.bestYoungPlayer.trim(),
        bestGoalkeeper: awards.bestGoalkeeper.trim(),
        bracketChoices,
      };

      const res = await fetch("/api/submit-initial-prediction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Erro ao submeter.");

      localStorage.removeItem(DRAFT_KEY);

      const updated: InitialPrediction = {
        userId: user.uid,
        groupPositions: groupOrders,
        thirdPlaceRanking,
        qualifiedThirdPlacedTeams: thirdPlaceRanking.slice(0, 8),
        roundOf32Teams: derived.roundOf32Teams,
        roundOf16Teams: derived.roundOf16Teams,
        quarterFinalTeams: derived.quarterFinalTeams,
        semiFinalTeams: derived.semiFinalTeams,
        finalTeams: derived.finalTeams,
        winner: derived.winner!,
        runnerUp: derived.runnerUp!,
        thirdPlace: derived.thirdPlace ?? undefined,
        fourthPlace: derived.fourthPlace ?? undefined,
        topScorer: awards.topScorer.trim(),
        bestPlayer: awards.bestPlayer.trim(),
        bestYoungPlayer: awards.bestYoungPlayer.trim(),
        bestGoalkeeper: awards.bestGoalkeeper.trim(),
        bracketChoices,
        locked: false,
        submittedAt: existingPrediction?.submittedAt,
      };

      setExistingPrediction(updated);
      setPageMode("summary");
      setShowConfirm(false);
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Erro ao submeter. Tenta novamente.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const thirdPlaceGroupOf = useMemo(() => {
    const map: Record<string, string> = {};
    GROUP_LETTERS.forEach((g) => {
      const thirdId = groupOrders[g]?.[2];
      if (thirdId) map[thirdId] = g;
    });
    return map;
  }, [groupOrders]);

  const savedLabel = lastSaved
    ? `Rascunho guardado às ${lastSaved.toLocaleTimeString("pt-PT", {
        hour: "2-digit",
        minute: "2-digit",
      })}`
    : "A guardar…";

  // ── Render ──────────────────────────────────────────────────────────────────

  if (fetchError) {
    return (
      <Protected>
        <main className="mx-auto max-w-2xl px-4 py-6">
          <div className="rounded-2xl border border-amber-500/30 bg-amber-900/10 p-5 text-center">
            <p className="text-base font-bold text-amber-400">Erro ao carregar aposta</p>
            <p className="mt-2 text-sm text-amber-300">
              Não foi possível carregar a tua aposta. Verifica a ligação à internet e{" "}
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="underline hover:text-amber-200"
              >
                recarrega a página
              </button>
              .
            </p>
          </div>
        </main>
      </Protected>
    );
  }

  if (loadingPrediction) {
    return (
      <Protected>
        <main className="p-6 text-sm text-pitch-300">A carregar...</main>
      </Protected>
    );
  }

  // Locked — closed by admin or past deadline
  if (isLocked) {
    if (existingPrediction && firestorePredictionIncompatible) {
      return (
        <Protected>
          <main className="mx-auto max-w-2xl px-4 py-6">
            <div className="rounded-2xl border border-red-800/30 bg-red-900/10 p-5 text-center">
              <p className="text-base font-bold text-red-400">Aposta desatualizada</p>
              <p className="mt-2 text-sm text-red-400">
                A tua aposta anterior contém seleções que já não participam neste Mundial. O prazo para resubmeter já terminou.
              </p>
            </div>
          </main>
        </Protected>
      );
    }
    if (existingPrediction) {
      return (
        <Protected>
          <PredictionSummary
            prediction={existingPrediction}
            isLocked={true}
            isClosed={isClosed}
            onEdit={() => {}}
            deadlineDisplay={deadlineDisplay}
          />
        </Protected>
      );
    }
    const noSubmitMessage = isClosed
      ? "A aposta inicial está temporariamente fechada pelo administrador."
      : "O prazo para submeter a aposta inicial terminou.";
    return (
      <Protected>
        <main className="mx-auto max-w-2xl px-4 py-6">
          <div className="rounded-2xl border border-pitch-500 bg-pitch-800 p-6 text-center">
            <p className="text-base font-bold text-pitch-100">
              {isClosed ? "Aposta fechada" : "Prazo terminado"}
            </p>
            <p className="mt-1 text-sm text-pitch-300">{noSubmitMessage}</p>
          </div>
        </main>
      </Protected>
    );
  }

  // Before deadline and open — summary mode (only for compatible predictions)
  if (pageMode === "summary" && existingPrediction && !firestorePredictionIncompatible) {
    return (
      <Protected>
        <PredictionSummary
          prediction={existingPrediction}
          isLocked={false}
          isClosed={false}
          onEdit={() => setPageMode("editing")}
          deadlineDisplay={deadlineDisplay}
        />
      </Protected>
    );
  }

  // Before deadline — editing mode
  return (
    <Protected>
      <main className="mx-auto max-w-5xl px-4 py-6">
        {/* Stale localStorage draft cleared */}
        {draftWasCleared && (
          <div className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
            O rascunho antigo foi limpo porque os dados das seleções foram atualizados.
          </div>
        )}

        {/* Incompatible Firestore prediction — prompt to resubmit */}
        {firestorePredictionIncompatible && (
          <div className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
            <strong>A tua aposta anterior contém seleções desatualizadas.</strong> Preenche e submete uma nova aposta com as seleções atuais.
          </div>
        )}

        {/* Deadline info banner */}
        <div className="mb-5 rounded-xl border border-neon-500/30 bg-pitch-700 px-4 py-3 text-sm text-neon-400">
          Podes editar a tua aposta até{" "}
          <strong className="text-pitch-50">{deadlineDisplay}</strong>.
        </div>

        {/* Page header */}
        <div className="mb-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-neon-500">
            Passo 1 de 4
          </p>
          <h1 className="text-2xl font-bold text-pitch-50">Fase de Grupos</h1>
        </div>
        <p className="mb-5 text-sm text-pitch-300">
          Arrasta as equipas para prever a classificação final de cada grupo.
        </p>

        {/* Draft status bar */}
        <div className="mb-5 flex items-center justify-between gap-4">
          <span className="text-xs text-pitch-300">{savedLabel}</span>
          <Button
            type="button"
            onClick={handleManualSave}
            className="px-4 py-2 text-sm"
          >
            Guardar rascunho
          </Button>
        </div>

        {/* Groups grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {GROUP_LETTERS.map((letter) => (
            <GroupCard
              key={letter}
              letter={letter}
              teamIds={groupOrders[letter] ?? GROUPS[letter]}
              onChange={(newOrder) => handleGroupChange(letter, newOrder)}
            />
          ))}
        </div>

        {/* Step 2: Third-place ranking */}
        <ThirdPlaceRankingCard
          teamIds={thirdPlaceRanking}
          groupOf={thirdPlaceGroupOf}
          onChange={handleThirdPlaceChange}
        />

        {/* Step 3: Bracket */}
        <BracketView state={bracketState} onChoice={handleBracketChoice} />

        {/* Step 4: Individual awards */}
        <section className="mt-8 rounded-2xl border border-pitch-500 bg-pitch-800 p-5 shadow-card">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-neon-500">
            Passo 4 de 4
          </p>
          <h2 className="mb-1 text-xl font-bold text-pitch-50">
            Prémios Individuais
          </h2>
          <p className="mb-5 text-sm text-pitch-300">
            Escreve o nome do jogador que acreditas que vai ganhar cada prémio.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {AWARD_FIELDS.map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="mb-1 block text-xs font-semibold text-pitch-200">
                  {label}
                </label>
                <input
                  type="text"
                  value={awards[key]}
                  onChange={(e) => handleAwardChange(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full rounded-lg border border-pitch-500 px-3 py-2 text-sm focus:border-neon-500 focus:outline-none focus:ring-1 focus:ring-neon-500"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Submit section */}
        <div className="mt-8 space-y-4">
          {!isValid && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="mb-2 text-xs font-semibold text-amber-400">
                Para submeter, completa:
              </p>
              <ul className="list-inside list-disc space-y-0.5 text-xs text-amber-400">
                {validationErrors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          {!showConfirm ? (
            <Button
              type="button"
              disabled={!isValid}
              onClick={() => setShowConfirm(true)}
              className="w-full py-3"
            >
              {existingPrediction ? "Guardar alterações" : "Submeter aposta"}
            </Button>
          ) : (
            <div className="rounded-2xl border border-pitch-500 bg-pitch-700 p-5">
              <h3 className="mb-1 text-sm font-bold text-pitch-50">
                {existingPrediction ? "Confirmar alterações" : "Confirmar aposta"}
              </h3>
              <p className="mb-4 text-xs text-pitch-300">
                As tuas escolhas serão guardadas. Podes ainda editar até{" "}
                <strong className="text-pitch-50">{deadlineDisplay}</strong>.
              </p>
              {submitError && (
                <p className="mb-3 text-xs font-semibold text-red-400">
                  {submitError}
                </p>
              )}
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 py-2.5"
                >
                  {submitting ? "A guardar…" : "Confirmar"}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirm(false);
                    setSubmitError(null);
                  }}
                  disabled={submitting}
                  className="flex-1 rounded-xl border border-pitch-500 bg-pitch-600 py-2.5 text-sm font-semibold text-pitch-200 hover:bg-pitch-500 disabled:opacity-60"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </Protected>
  );
}
