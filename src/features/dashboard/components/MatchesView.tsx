import React from 'react';

const getMatchTime = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch (e) {
    return "";
  }
};

interface MatchesViewProps {
  matches: any[];
  onScoreChange: (matchId: string, team: 'a' | 'b', value: string) => void;
  onMatchSelect: (match: any) => void;
  selectedMatchId?: string;
}

export default function MatchesView({ matches, onScoreChange, onMatchSelect, selectedMatchId }: MatchesViewProps) {
  const [filter, setFilter] = React.useState('all');

  const sortedMatches = React.useMemo(() => {
    return [...matches].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [matches]);

  const filteredMatches = filter === 'all' 
    ? sortedMatches
    : sortedMatches.filter(m => filter === 'finished' ? m.status?.includes('Finalizado') || m.status?.includes('Simulado') : m.status?.includes('vivo'));

  const byD: Record<string, typeof matches> = {};
  
  if (filter === 'all') {
    const todayMatches: any[] = [];
    const tomorrowMatches: any[] = [];
    const yesterdayMatches: any[] = [];
    const otherMatches: any[] = [];
    
    filteredMatches.forEach(m => {
      if (m.status?.includes("Hoy") || m.status?.includes("En vivo")) {
        todayMatches.push(m);
      } else if (m.status?.includes("Mañana")) {
        tomorrowMatches.push(m);
      } else if (m.status?.includes("Ayer")) {
        yesterdayMatches.push(m);
      } else {
        otherMatches.push(m);
      }
    });

    if (todayMatches.length > 0) {
      const hasLive = todayMatches.some(m => m.status?.includes("vivo"));
      const header = hasLive ? "🔴 EN VIVO" : "HOY";
      byD[header] = todayMatches;
    }
    if (tomorrowMatches.length > 0) {
      byD["MAÑANA"] = tomorrowMatches;
    }
    if (yesterdayMatches.length > 0) {
      byD["AYER"] = yesterdayMatches;
    }

    otherMatches.forEach(m => {
      const category = m.category || "Fase de Grupos";
      if (!byD[category]) byD[category] = [];
      byD[category].push(m);
    });
  } else {
    filteredMatches.forEach(m => {
      let category = m.category || "Fase de Grupos";
      if (m.status?.includes('vivo')) {
        category = "🔴 EN VIVO";
      }
      if (!byD[category]) byD[category] = [];
      byD[category].push(m);
    });
  }

  const sortedDates = Object.keys(byD).sort((a, b) => {
    const priorities: Record<string, number> = {
      "🔴 EN VIVO": 1,
      "HOY": 2,
      "MAÑANA": 3,
      "AYER": 4
    };
    
    const aPriority = priorities[a] || 999;
    const bPriority = priorities[b] || 999;
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    
    return Object.keys(byD).indexOf(a) - Object.keys(byD).indexOf(b);
  });

  return (
    <section className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="font-bebas text-5xl text-primary leading-none">Calendario</h2>
          <p className="text-on-surface-variant text-sm mt-1">Todos los encuentros de la fase de grupos</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'live', label: 'En Vivo' },
            { id: 'finished', label: 'Finalizados/Simulados' },
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setFilter(btn.id)}
              className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest border transition-all ${
                filter === btn.id
                  ? 'border-primary bg-primary text-white'
                  : 'border-outline-variant hover:bg-surface-container text-on-surface-variant'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-12">
        {Object.keys(byD).length === 0 ? (
          <div className="text-center py-20 text-on-primary-container/40 uppercase font-bold tracking-widest text-xs">
            No hay partidos para mostrar
          </div>
        ) : (
          sortedDates.map((date, index) => {
            const ms = byD[date];
            return (
            <div key={index} className="space-y-4">
              <div className="text-[10px] font-black tracking-widest text-on-surface-variant border-b border-outline-variant/50 pb-2 uppercase">
                {date}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {ms.map((m) => {
                  const isHoyOrManana = date === "HOY" || date === "🔴 EN VIVO" || date === "MAÑANA";
                  const live = m.status?.includes('vivo');
                  const finished = m.status?.includes('Finalizado') || m.status?.includes('Simulado');
                  const isSelected = selectedMatchId === m.id;
                  
                  return (
                    <div
                      key={m.id}
                      onClick={() => onMatchSelect(m)}
                      className={`cursor-pointer bg-surface-container-lowest border ${
                        isSelected 
                          ? 'border-primary shadow-[0_0_15px_rgba(37,99,235,0.2)]'
                          : live 
                            ? 'border-error shadow-md' 
                            : 'border-outline-variant hover:border-primary/50'
                      } p-4 rounded-2xl flex flex-col transition-all`}
                    >
                      {/* Teams and Scores */}
                      <div className="flex-1 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img src={`https://flagcdn.com/24x18/${m.flag_a?.toLowerCase() || 'un'}.png`} alt={m.team_a} className="w-6 h-4 rounded-sm object-cover border border-outline-variant" />
                            <span className="font-bold text-sm truncate">{m.team_a}</span>
                          </div>
                          <div className="w-10 h-8 rounded-lg bg-surface-container text-center font-bebas text-xl flex items-center justify-center border border-outline-variant/50">
                            {m.score_a !== null ? m.score_a : '-'}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img src={`https://flagcdn.com/24x18/${m.flag_b?.toLowerCase() || 'un'}.png`} alt={m.team_b} className="w-6 h-4 rounded-sm object-cover border border-outline-variant" />
                            <span className="font-bold text-sm truncate">{m.team_b}</span>
                          </div>
                          <div className="w-10 h-8 rounded-lg bg-surface-container text-center font-bebas text-xl flex items-center justify-center border border-outline-variant/50">
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
                            <span className="text-[10px] bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded font-bold uppercase">
                              {isHoyOrManana ? "Finalizado" : m.status}
                            </span>
                          ) : (
                            <span className="text-[10px] text-on-primary-container/40 uppercase font-bold">
                              {isHoyOrManana ? "Próximamente" : m.status}
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
