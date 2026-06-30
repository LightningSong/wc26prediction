import React from 'react';

const getMatchTime = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch (e) {
    return "";
  }
};

const getDiffDaysLocal = (matchDateStr: string) => {
  const matchDate = new Date(matchDateStr);
  const now = new Date();
  
  // Normalizar a medianoche local
  const matchZero = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate());
  const nowZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Diferencia en días enteros
  return Math.round((matchZero.getTime() - nowZero.getTime()) / (1000 * 60 * 60 * 24));
};

const isTbd = (name: string) => !name || name === 'A definir' || name.startsWith('1°') || name.startsWith('2°') || name.startsWith('3°');

interface MatchesViewProps {
  matches: any[];
  onScoreChange: (matchId: string, team: 'a' | 'b', value: string) => void;
  onMatchSelect: (match: any) => void;
  selectedMatchId?: string;
}

export default function MatchesView({ matches, onScoreChange, onMatchSelect, selectedMatchId }: MatchesViewProps) {
  const [filter, setFilter] = React.useState('all'); // 'all' (Todos), 'groups' (Grupos), 'knockout' (Eliminatorias)

  // 1. Group matches based on the filter
  const groupedMatches = React.useMemo(() => {
    const matchesToProcess = matches.filter(m => {
      if (filter === 'groups') {
        return m.round === 'Fase de Grupos';
      }
      if (filter === 'knockout') {
        return m.round !== 'Fase de Grupos';
      }
      return true; // 'all'
    });

    const groups: Record<string, any[]> = {};
    
    // Sort matches chronologically within their day
    const sorted = [...matchesToProcess].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sorted.forEach(m => {
      const diff = getDiffDaysLocal(m.date);
      let key = "";
      if (diff === 0) {
        key = "HOY";
      } else if (diff === 1) {
        key = "MAÑANA";
      } else if (diff === -1) {
        key = "AYER";
      } else {
        const matchDate = new Date(m.date);
        key = matchDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(m);
    });

    return groups;
  }, [matches, filter]);

  // 2. Sort the date keys in the specific order requested
  const sortedDateKeys = React.useMemo(() => {
    const keys = Object.keys(groupedMatches);
    
    const getKeyInfo = (key: string) => {
      const groupMatches = groupedMatches[key];
      if (!groupMatches || groupMatches.length === 0) {
        return { isSpecial: false, priority: 999, diff: 0, time: 0 };
      }
      
      const firstMatch = groupMatches[0];
      const diff = getDiffDaysLocal(firstMatch.date);
      const time = new Date(firstMatch.date).getTime();
      
      if (key === "HOY") {
        return { isSpecial: true, priority: 1, diff, time };
      }
      if (key === "MAÑANA") {
        return { isSpecial: true, priority: 2, diff, time };
      }
      if (key === "AYER") {
        return { isSpecial: true, priority: 3, diff, time };
      }
      
      return { isSpecial: false, priority: 99, diff, time };
    };

    return keys.sort((a, b) => {
      const infoA = getKeyInfo(a);
      const infoB = getKeyInfo(b);
      
      if (infoA.isSpecial || infoB.isSpecial) {
        const priorityA = infoA.isSpecial ? infoA.priority : 999;
        const priorityB = infoB.isSpecial ? infoB.priority : 999;
        return priorityA - priorityB;
      }
      
      const isPastA = infoA.diff < 0;
      const isPastB = infoB.diff < 0;
      
      if (isPastA && isPastB) {
        return infoB.time - infoA.time; // Past matches: descending (most recent first)
      }
      
      if (!isPastA && !isPastB) {
        return infoA.time - infoB.time; // Future matches: ascending (closest first)
      }
      
      return isPastA ? -1 : 1; // Past matches come before far future matches
    });
  }, [groupedMatches]);

  return (
    <section className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="font-bebas text-5xl text-primary leading-none">Calendario</h2>
          <p className="text-on-surface-variant text-sm mt-1">
            {filter === 'groups' ? 'Todos los encuentros de la fase de grupos' : 
             filter === 'knockout' ? 'Todos los encuentros de las eliminatorias' : 
             'Todos los encuentros del mundial'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'groups', label: 'Grupos' },
            { id: 'knockout', label: 'Eliminatorias' },
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setFilter(btn.id)}
              className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest border transition-all ${
                filter === btn.id
                  ? 'border-primary bg-primary text-white shadow-md'
                  : 'border-outline-variant hover:bg-surface-container text-on-surface-variant'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-12">
        {sortedDateKeys.length === 0 ? (
          <div className="text-center py-20 text-on-primary-container/40 uppercase font-bold tracking-widest text-xs">
            No hay partidos para mostrar
          </div>
        ) : (
          sortedDateKeys.map((date, index) => {
            const ms = groupedMatches[date];
            return (
              <div key={index} className="space-y-4">
                <div className="text-[10px] font-black tracking-widest text-on-surface-variant border-b border-outline-variant/50 pb-2 uppercase flex items-center justify-between">
                  <span>{date}</span>
                  {date === "HOY" && ms.some(m => m.status?.includes('vivo')) && (
                    <span className="w-2.5 h-2.5 rounded-full bg-error animate-pulse-soft"></span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {ms.map((m) => {
                    const isHoyOrManana = date === "HOY" || date === "MAÑANA";
                    const live = m.status?.includes('vivo');
                    const finished = m.status?.includes('Finalizado') || m.status?.includes('Simulado');
                    const isSelected = selectedMatchId === m.id;
                    const teamAIsTbd = isTbd(m.team_a);
                    const teamBIsTbd = isTbd(m.team_b);
                    
                    return (
                      <div
                        key={m.id}
                        onClick={() => onMatchSelect(m)}
                        className={`cursor-pointer bg-surface-container-lowest border ${
                          isSelected 
                            ? 'border-primary shadow-[0_0_15px_rgba(37,99,235,0.2)] scale-[1.01]'
                            : live 
                              ? 'border-error shadow-md' 
                              : 'border-outline-variant hover:border-primary/50'
                        } p-4 rounded-2xl flex flex-col transition-all`}
                      >
                        {/* Round stage tag for knockout matches */}
                        {m.round && m.round !== "Fase de Grupos" && (
                          <div className="mb-2.5 flex items-center justify-between">
                            <span className="text-[8px] font-black tracking-wider uppercase bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded">
                              {m.round}
                            </span>
                            {m.group && (
                              <span className="text-[8px] font-bold text-on-surface-variant/60 uppercase">
                                {m.group}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Teams and Scores */}
                        <div className="flex-1 flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              {teamAIsTbd ? (
                                <div className="w-6 h-4.5 bg-surface-container rounded-sm shrink-0 flex items-center justify-center text-[8px] text-on-surface-variant font-bold border border-outline-variant">?</div>
                              ) : (
                                <img 
                                  src={`https://flagcdn.com/24x18/${m.flag_a?.toLowerCase() || 'un'}.png`} 
                                  alt={m.team_a} 
                                  className="w-6 h-4 rounded-sm object-cover border border-outline-variant shrink-0" 
                                />
                              )}
                              <span className={`text-sm truncate ${teamAIsTbd ? 'text-on-surface-variant italic font-medium' : 'font-bold'}`}>
                                {m.team_a}
                              </span>
                            </div>
                            <div className="w-10 h-8 rounded-lg bg-surface-container text-center font-bebas text-xl flex items-center justify-center border border-outline-variant/50 shrink-0">
                              {m.score_a !== null ? m.score_a : '-'}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              {teamBIsTbd ? (
                                <div className="w-6 h-4.5 bg-surface-container rounded-sm shrink-0 flex items-center justify-center text-[8px] text-on-surface-variant font-bold border border-outline-variant">?</div>
                              ) : (
                                <img 
                                  src={`https://flagcdn.com/24x18/${m.flag_b?.toLowerCase() || 'un'}.png`} 
                                  alt={m.team_b} 
                                  className="w-6 h-4 rounded-sm object-cover border border-outline-variant shrink-0" 
                                />
                              )}
                              <span className={`text-sm truncate ${teamBIsTbd ? 'text-on-surface-variant italic font-medium' : 'font-bold'}`}>
                                {m.team_b}
                              </span>
                            </div>
                            <div className="w-10 h-8 rounded-lg bg-surface-container text-center font-bebas text-xl flex items-center justify-center border border-outline-variant/50 shrink-0">
                              {m.score_b !== null ? m.score_b : '-'}
                            </div>
                          </div>
                        </div>

                        {/* Status footer */}
                        <div className="mt-4 pt-3 border-t border-outline-variant/30 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {live ? (
                              <span className="text-[10px] bg-error text-white px-2 py-0.5 rounded font-black animate-pulse-soft">
                                EN VIVO
                              </span>
                            ) : finished ? (
                              <>
                                <span className="text-[10px] bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded font-bold uppercase">
                                  {isHoyOrManana ? "Finalizado" : m.status?.split(" | ")?.[0] || "Finalizado"}
                                </span>
                                {m.score_a !== null && m.score_b !== null && m.score_a === m.score_b && m.round !== "Fase de Grupos" && (
                                  <span className="text-[10px] bg-fifa-accent/15 text-fifa-accent border border-fifa-accent/30 px-2 py-0.5 rounded font-black shadow-[0_0_8px_rgba(0,229,255,0.1)]">
                                    PEN: {m.penalties_score || (m.penalty_winner ? (m.penalty_winner === m.team_a ? "5-4" : "4-5") : "A definir")}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-[10px] text-on-primary-container/40 uppercase font-bold">
                                {isHoyOrManana ? "Próximamente" : m.status?.split(", ")?.[0] || "Próximamente"}
                              </span>
                            )}
                            
                            {isHoyOrManana && (
                              <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-black">
                                {getMatchTime(m.date)}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-bold text-on-surface-variant uppercase truncate max-w-[120px]">
                            {m.stadium || m.venue}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
