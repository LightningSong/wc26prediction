"use client";

import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";

interface PredictionData {
  match: string;
  team_a: string;
  team_b: string;
  flag_a: string;
  flag_b: string;
  rank_a: number;
  rank_b: number;
  xg_a: number;
  xg_b: number;
  global_probabilities: { win_a: number; draw: number; win_b: number };
  top_10: { score: string; score_a: number; score_b: number; prob: number }[];
  grid: (number | null)[][];
}

interface PredictionPanelProps {
  selectedMatch: any | null;
  liveScore?: { score_a: number | null; score_b: number | null; status: string } | null;
  layoutMode?: 'sidebar' | 'fullscreen' | 'mobile';
}

export default function PredictionPanel({ selectedMatch, liveScore, layoutMode = 'sidebar' }: PredictionPanelProps) {
  const [data, setData] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedMatch) {
      setData(null);
      return;
    }
    const teamA = selectedMatch.team_a;
    const teamB = selectedMatch.team_b;
    if (!teamA || !teamB || teamA === "A definir" || teamB === "A definir") {
      setData(null);
      return;
    }
    fetchPrediction(teamA, teamB);
  }, [selectedMatch]);

  const fetchPrediction = async (teamA: string, teamB: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/predict/${encodeURIComponent(teamA)}/${encodeURIComponent(teamB)}`);
      if (!res.ok) throw new Error("Error al obtener predicción");
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // GSAP animation when data loads
  useEffect(() => {
    if (data && !loading && panelRef.current) {
      // Fade and slide sections in
      gsap.fromTo(panelRef.current.querySelectorAll('.animate-gsap-fade'),
        { opacity: 0, y: 15, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.05, ease: "power2.out", overwrite: "auto" }
      );

      // Animate progress bar widths
      const bars = panelRef.current.querySelectorAll('.animate-gsap-bar');
      bars.forEach((bar) => {
        const targetWidth = bar.getAttribute('data-width') || '0%';
        gsap.fromTo(bar,
          { width: '0%' },
          { width: targetWidth, duration: 0.9, ease: "power3.out", delay: 0.1, overwrite: "auto" }
        );
      });
    }
  }, [data, loading]);

  // Empty state
  if (!selectedMatch) {
    return (
      <div className="prediction-panel flex flex-col items-center justify-center gap-4 py-20 px-6 text-center">
        <div className="text-5xl animate-bounce-slow">🧠</div>
        <p className="text-fifa-muted text-xs tracking-widest uppercase font-bold">
          Selecciona un partido para ver la predicción
        </p>
        <p className="text-white/30 text-[10px] max-w-[180px] tracking-wider uppercase font-semibold">
          Monte Carlo · Poisson · xG · Ranking FIFA
        </p>
      </div>
    );
  }

  // TBD teams
  if (selectedMatch.team_a === "A definir" || selectedMatch.team_b === "A definir") {
    return (
      <div className="prediction-panel flex flex-col items-center justify-center gap-4 py-20 px-6 text-center">
        <div className="text-4xl opacity-40 animate-pulse">⏳</div>
        <p className="text-fifa-muted text-xs font-bold uppercase tracking-wider">Equipos aún no definidos</p>
        <p className="text-fifa-muted/60 text-[10px] tracking-wide">La predicción estará disponible cuando se clasifiquen ambos equipos.</p>
      </div>
    );
  }

  return (
    <div ref={panelRef} className="prediction-panel flex flex-col gap-6 p-5 font-rajdhani">
      {/* Match Header */}
      <div className="flex flex-col gap-3 animate-gsap-fade">
        <div className="flex items-center justify-between gap-2">
          {selectedMatch.round && (
            <span className="text-[10px] text-fifa-primary bg-fifa-primary/10 border border-fifa-primary/20 rounded-full px-2.5 py-0.5 font-bold uppercase tracking-wider">
              {selectedMatch.round || selectedMatch.group}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 py-3 bg-black/30 border border-white/5 rounded-2xl px-3">
          {/* Team A */}
          <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
            <img
              src={`https://flagcdn.com/32x24/${(data?.flag_a || selectedMatch.flag_a || "un").toLowerCase()}.png`}
              alt={selectedMatch.team_a}
              className="rounded-md border border-white/10 w-10 h-7 object-cover shadow-lg"
              onError={(e) => { e.currentTarget.src = "https://flagcdn.com/32x24/un.png"; }}
            />
            <span className="text-[11px] font-bold text-white text-center leading-tight truncate w-full">{selectedMatch.team_a}</span>
            {data && <span className="text-[9px] text-fifa-muted font-bold">#{data.rank_a}</span>}
          </div>

          {/* VS or live score */}
          <div className="flex flex-col items-center gap-1 shrink-0 px-2">
            {liveScore && liveScore.score_a !== null ? (
              <>
                <div className="flex items-center gap-1.5 font-bebas text-3xl text-fifa-danger tracking-wider">
                  <span>{liveScore.score_a}</span>
                  <span className="animate-pulse-live text-xl">:</span>
                  <span>{liveScore.score_b}</span>
                </div>
                <span className="flex items-center gap-1 text-[8px] text-fifa-danger font-black uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-fifa-danger animate-pulse-live"></span>
                  {liveScore.status}
                </span>
              </>
            ) : selectedMatch.score_a !== null ? (
              <div className="flex items-center gap-1.5 font-bebas text-2xl text-white/60 tracking-wider">
                <span>{selectedMatch.score_a}</span>
                <span className="text-sm">-</span>
                <span>{selectedMatch.score_b}</span>
              </div>
            ) : (
              <span className="text-[10px] text-fifa-muted font-black uppercase tracking-widest bg-white/5 border border-white/5 px-2.5 py-0.5 rounded-full">VS</span>
            )}
          </div>

          {/* Team B */}
          <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
            <img
              src={`https://flagcdn.com/32x24/${(data?.flag_b || selectedMatch.flag_b || "un").toLowerCase()}.png`}
              alt={selectedMatch.team_b}
              className="rounded-md border border-white/10 w-10 h-7 object-cover shadow-lg"
              onError={(e) => { e.currentTarget.src = "https://flagcdn.com/32x24/un.png"; }}
            />
            <span className="text-[11px] font-bold text-white text-center leading-tight truncate w-full">{selectedMatch.team_b}</span>
            {data && <span className="text-[9px] text-fifa-muted font-bold">#{data.rank_b}</span>}
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center gap-3 py-12">
          <div className="w-10 h-10 border-2 border-fifa-primary border-t-transparent rounded-full animate-spin shadow-lg"></div>
          <span className="text-[9px] text-fifa-muted uppercase tracking-widest font-bold">Simulando 100,000 partidos...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-xs text-fifa-danger bg-fifa-danger/10 border border-fifa-danger/25 rounded-xl p-4 text-center">
          {error}
        </div>
      )}

      {/* Prediction Content */}
      {data && !loading && (
        <>
          {/* xG Bar */}
          <div className="flex flex-col gap-2 animate-gsap-fade">
            <span className="text-[10px] text-fifa-muted uppercase tracking-widest font-bold">Goles Esperados (xG)</span>
            <div className="flex items-center gap-3 bg-black/20 border border-white/5 p-3 rounded-2xl">
              <span className="text-xs font-black text-fifa-accent w-8 text-right">{data.xg_a.toFixed(2)}</span>
              <div className="flex-1 h-2.5 bg-black/60 border border-white/5 rounded-full overflow-hidden relative">
                <div
                  className="animate-gsap-bar h-full bg-gradient-to-r from-fifa-primary to-fifa-accent rounded-full absolute left-0 top-0"
                  data-width={`${(data.xg_a / (data.xg_a + data.xg_b)) * 100}%`}
                />
              </div>
              <span className="text-xs font-black text-fifa-secondary w-8">{data.xg_b.toFixed(2)}</span>
            </div>
          </div>

          {/* Monte Carlo probabilities */}
          <div className="flex flex-col gap-2.5 animate-gsap-fade">

            <div className="flex flex-col gap-2 bg-black/20 border border-white/5 p-4 rounded-2xl">
              {[
                { label: selectedMatch.team_a, value: data.global_probabilities.win_a, color: "from-fifa-primary to-pink-500", glow: "shadow-fifa-primary/20" },
                { label: "Empate", value: data.global_probabilities.draw, color: "from-white/20 to-white/10", glow: "shadow-white/5" },
                { label: selectedMatch.team_b, value: data.global_probabilities.win_b, color: "from-fifa-secondary to-blue-400", glow: "shadow-fifa-secondary/20" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-[10px] text-white/70 w-20 truncate font-semibold text-right">{item.label}</span>
                  <div className="flex-1 h-5.5 bg-black/60 border border-white/5 rounded-lg overflow-hidden relative">
                    <div
                      className={`animate-gsap-bar h-full bg-gradient-to-r ${item.color} rounded-lg shadow-sm ${item.glow}`}
                      data-width={`${item.value}%`}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white mix-blend-difference">
                      {item.value.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Goal Probability Matrix 7x7 */}
          <div className="flex flex-col gap-2.5 animate-gsap-fade">

            <div className="overflow-x-auto no-scrollbar bg-black/20 border border-white/5 p-4 rounded-2xl">
              <table className="text-center text-[9px] border-collapse w-full prob-matrix">
                <thead>
                  {/* Team B Name Header */}
                  <tr className="border-b border-white/5">
                    <th colSpan={2} className="border-r border-white/5"></th>
                    <th colSpan={7} className="text-center text-fifa-secondary uppercase tracking-widest font-black text-[9px] py-1">
                      {selectedMatch.team_b}
                    </th>
                  </tr>
                  <tr className="border-b border-white/5">
                    <th colSpan={2} className="w-8 h-6 text-[8px] text-fifa-muted font-bold p-0.5 border-r border-white/5"></th>
                    {[0, 1, 2, 3, 4, 5, 6].map((g) => (
                      <th key={g} className="w-8 h-6 text-[9.5px] text-fifa-secondary font-black p-0.5">
                        {g}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.grid.map((row, rIdx) => {
                    const rowMax = Math.max(...row.filter((v): v is number => v !== null));
                    return (
                      <tr key={rIdx} className="border-b border-white/5 last:border-0">
                        {/* Team A Vertical Name Column */}
                        {rIdx === 0 && (
                          <td 
                            rowSpan={7} 
                            className="text-center font-black text-[9px] text-fifa-primary uppercase tracking-widest border-r border-white/5 px-1 bg-white/5 align-middle select-none"
                            style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)', whiteSpace: 'nowrap' }}
                          >
                            {selectedMatch.team_a}
                          </td>
                        )}
                        <td className="text-[9.5px] text-fifa-primary font-black p-0.5 border-r border-white/5 w-6">{rIdx}</td>
                        {row.map((val, cIdx) => {
                          const prob = val ?? 0;
                          const isTop = prob > 5;
                          const isRowMax = prob === rowMax && prob > 0;
                          const intensity = Math.min(prob / 12, 1);
                          const bg = isTop
                            ? `rgba(255,0,127,${0.15 + intensity * 0.65})`
                            : `rgba(0,229,255,${0.03 + intensity * 0.3})`;
                          return (
                            <td
                              key={cIdx}
                              className={`w-8 h-6 p-0 text-[8.5px] font-black transition-all ${
                                isTop ? "text-white" : "text-fifa-muted/80"
                              } ${isRowMax ? "ring-1 ring-fifa-accent/40" : ""}`}
                              style={{ background: bg }}
                            >
                              {prob > 0 ? prob.toFixed(1) : ""}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top 10 Scenarios */}
          <div className="flex flex-col gap-2.5 animate-gsap-fade">
            <span className="text-[10px] text-fifa-muted uppercase tracking-widest font-bold">Top 10 Marcadores más Probables</span>
            <div className="grid grid-cols-2 gap-2 bg-black/20 border border-white/5 p-4 rounded-2xl">
              {data.top_10.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-all duration-300 ${
                    idx === 0
                      ? "border-fifa-accent/40 bg-fifa-accent/10 text-fifa-accent font-bold shadow-[0_0_10px_rgba(0,255,157,0.1)]"
                      : "border-white/5 bg-black/20 text-white/90 hover:border-white/10"
                  }`}
                >
                  <span className="font-bold font-bebas text-sm tracking-wide">{item.score}</span>
                  <span className={`text-[9.5px] font-black ${idx === 0 ? "text-fifa-accent" : "text-fifa-muted"}`}>
                    {item.prob.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Stochastic Roulette Overlay Component */}
          <div className="flex flex-col gap-2.5 animate-gsap-fade mt-2">
            <span className="text-[10px] text-fifa-muted uppercase tracking-widest font-bold">Decisión Estocástica (Poisson)</span>
            <div className="flex flex-col gap-4 bg-black/20 border border-white/5 p-4 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <span className="text-8xl">🎲</span>
              </div>
              
              {selectedMatch.score_a !== null ? (
                <>
                  <p className="text-[10px] text-fifa-muted font-semibold relative z-10 leading-relaxed">
                    El motor seleccionó el marcador <span className="text-fifa-accent font-black text-xs">{selectedMatch.score_a} - {selectedMatch.score_b}</span> basado en la distribución xG de {data.xg_a.toFixed(2)} vs {data.xg_b.toFixed(2)}. 
                    Aunque no siempre es el pico máximo, este resultado respeta el {(data.grid[selectedMatch.score_a]?.[selectedMatch.score_b] || 0).toFixed(1)}% de probabilidad asignada.
                  </p>
                  
                  <div className="flex items-center gap-2 mt-2 relative z-10">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-[9px] font-bold uppercase text-fifa-primary mb-1">
                        <span className="truncate max-w-[60px]">{selectedMatch.team_a}</span>
                        <span>Dado: {selectedMatch.score_a}</span>
                      </div>
                      <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                        <div className="h-full bg-fifa-primary rounded-full animate-pulse-soft" style={{ width: `${Math.min(100, (selectedMatch.score_a + 1) * 20)}%` }}></div>
                      </div>
                    </div>
                    
                    <div className="shrink-0 text-white/40 text-xs font-bebas px-2">VS</div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-[9px] font-bold uppercase text-fifa-secondary mb-1">
                        <span>Dado: {selectedMatch.score_b}</span>
                        <span className="truncate max-w-[60px] text-right">{selectedMatch.team_b}</span>
                      </div>
                      <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                        <div className="h-full bg-fifa-secondary rounded-full animate-pulse-soft" style={{ width: `${Math.min(100, (selectedMatch.score_b + 1) * 20)}%` }}></div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="relative z-10 flex flex-col items-center justify-center py-4 text-center">
                  <p className="text-[11px] text-fifa-muted font-semibold uppercase tracking-widest mb-1">Pendiente de simulación</p>
                  <p className="text-[9px] text-white/40 max-w-[200px]">Haz clic en "Simular Todo" para lanzar los dados estocásticos.</p>
                </div>
              )}
            </div>
          </div>
          
        </>
      )}
    </div>
  );
}
