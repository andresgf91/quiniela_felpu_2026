"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Team = {
  id: string;
  nameEs: string;
  flagEmoji: string;
};

type Match = {
  id: number;
  groupCode: string | null;
  kickoffUtc: string;
  homeTeam: Team | null;
  awayTeam: Team | null;
  locked: boolean;
  canPredict: boolean;
  prediction: { homeScore: number; awayScore: number } | null;
};

type SaveState = "idle" | "saving" | "saved" | "error";

export function PredictionCard({
  match,
  onSaved,
  autoFocusAway,
  onAdvance,
}: {
  match: Match;
  onSaved?: () => void;
  autoFocusAway?: boolean;
  onAdvance?: () => void;
}) {
  const [home, setHome] = useState(
    match.prediction?.homeScore?.toString() ?? "",
  );
  const [away, setAway] = useState(
    match.prediction?.awayScore?.toString() ?? "",
  );
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const awayRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const mutation = useMutation({
    mutationFn: async (scores: { homeScore: number; awayScore: number }) => {
      const res = await fetch(`/api/predictions/${match.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scores),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Error al guardar");
      }
      return res.json();
    },
    onMutate: () => setSaveState("saving"),
    onSuccess: () => {
      setSaveState("saved");
      onSaved?.();
      setTimeout(() => setSaveState("idle"), 2000);
    },
    onError: () => setSaveState("error"),
  });

  useEffect(() => {
    if (autoFocusAway) awayRef.current?.focus();
  }, [autoFocusAway]);

  function scheduleSave(h: string, a: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (match.locked || !match.canPredict) return;
    if (h === "" || a === "") return;

    debounceRef.current = setTimeout(() => {
      const homeScore = parseInt(h, 10);
      const awayScore = parseInt(a, 10);
      if (isNaN(homeScore) || isNaN(awayScore)) return;
      if (homeScore < 0 || homeScore > 20 || awayScore < 0 || awayScore > 20)
        return;
      mutation.mutate({ homeScore, awayScore });
    }, 600);
  }

  function handleHomeChange(val: string) {
    if (!/^\d{0,2}$/.test(val)) return;
    setHome(val);
    scheduleSave(val, away);
    if (val.length >= 1 && parseInt(val, 10) <= 20) awayRef.current?.focus();
  }

  function handleAwayChange(val: string) {
    if (!/^\d{0,2}$/.test(val)) return;
    setAway(val);
    scheduleSave(home, val);
    if (val.length >= 1) onAdvance?.();
  }

  const kickoff = format(new Date(match.kickoffUtc), "d MMM, HH:mm", {
    locale: es,
  });

  return (
    <div className="glass-card p-4">
      <div className="mb-3 flex items-center justify-between text-xs text-white/60">
        <span>Grupo {match.groupCode}</span>
        <span>{kickoff}</span>
        <span>
          {match.locked ? "🔒 CERRADO" : "🔓 ABIERTO"}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 text-center">
          <div className="text-2xl">{match.homeTeam?.flagEmoji}</div>
          <div className="text-xs font-medium">{match.homeTeam?.nameEs}</div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            inputMode="numeric"
            className="input-score"
            value={home}
            disabled={match.locked || !match.canPredict}
            onChange={(e) => handleHomeChange(e.target.value)}
            aria-label="Goles local"
          />
          <span className="text-white/40">-</span>
          <input
            ref={awayRef}
            type="text"
            inputMode="numeric"
            className="input-score"
            value={away}
            disabled={match.locked || !match.canPredict}
            onChange={(e) => handleAwayChange(e.target.value)}
            aria-label="Goles visitante"
          />
        </div>
        <div className="flex-1 text-center">
          <div className="text-2xl">{match.awayTeam?.flagEmoji}</div>
          <div className="text-xs font-medium">{match.awayTeam?.nameEs}</div>
        </div>
      </div>
      <div className="mt-2 text-center text-xs">
        {saveState === "saving" && (
          <span className="text-white/50">Guardando...</span>
        )}
        {saveState === "saved" && (
          <span className="text-green-400">✓ Guardado</span>
        )}
        {saveState === "error" && (
          <button
            type="button"
            className="text-red-400"
            onClick={() => scheduleSave(home, away)}
          >
            ⚠ Reintentar
          </button>
        )}
      </div>
    </div>
  );
}
