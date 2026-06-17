import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';

interface MatchesWidgetProps {
  matches: any[];
  onMatchSelect: (match: any) => void;
  selectedMatchId?: string | null;
  // onScoreChange is no longer needed since manual group stage editing is disabled
}

export default function MatchesWidget({ matches, onMatchSelect, selectedMatchId }: MatchesWidgetProps) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('All');
  const listRef = useRef<HTMLDivElement>(null);

  const groupsList = ['All', ...Array.from(new Set(matches.map((m: any) => m.group))).sort()];

  const filteredMatches = matches.filter((match: any) => {
    if (groupFilter !== 'All' && match.group !== groupFilter) return false;
    if (statusFilter === 'live') return match.status.includes('vivo');
    if (statusFilter === 'played') return match.status.includes('Fin') || match.status.includes('Finalizado') || match.status.includes('Simulado');
    if (statusFilter === 'upcoming') return !match.status.includes('Fin') && !match.status.includes('Finalizado') && !match.status.includes('Simulado') && !match.status.includes('vivo');
    return true;
  });

  const categories = filteredMatches.reduce((acc: any, match: any) => {
    const key = match.category || 'Fase de Grupos';
    if (!acc[key]) acc[key] = [];
    acc[key].push(match);
    return acc;
  }, {});

  // GSAP animation on list change
  useEffect(() => {
    if (listRef.current) {
      const cards = listRef.current.querySelectorAll('.match-card-anim');
      if (cards.length > 0) {
        gsap.fromTo(cards,
          { opacity: 0, y: 15, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.04, ease: 'back.out(1.2)', overwrite: 'auto' }
        );
      }
    }
  }, [statusFilter, groupFilter, matches]);

  const renderStatusBadge = (status: string) => {
    let datePart = '';
    let statusClean = status;
    if (status.includes('|')) {
      const parts = status.split('|');
      statusClean = parts[0].trim();
      datePart = parts[1].trim();
    }

    if (statusClean.includes('vivo')) {
      return (
        <div className="flex flex-col items-end gap-1">
          {datePart && <span className="text-[10px] text-white/50">{datePart}</span>}
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-fifa-danger/15 text-fifa-danger border border-fifa-danger/30 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-fifa-danger animate-pulse-live shrink-0"></span>
            EN VIVO
          </span>
        </div>
      );
    }
    if (statusClean.includes('Fin') || statusClean.includes('Finalizado') || statusClean.includes('Simulado')) {
      const isSim = statusClean.includes('Simulado');
      return (
        <div className="flex flex-col items-end gap-1">
          {datePart && <span className="text-[10px] text-white/50">{datePart}</span>}
          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${isSim ? 'bg-fifa-accent/15 text-fifa-accent border-fifa-accent/30' : 'bg-fifa-success/15 text-fifa-success border-fifa-success/30'}`}>
            {isSim ? 'SIMULADO' : 'FIN'}
          </span>
        </div>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-white/5 border border-white/10 text-fifa-muted uppercase tracking-wider">
        {status.length > 20 ? status.slice(0, 18) + '…' : status}
      </span>
    );
  };

  return (
    <div className="w-full flex flex-col gap-5 font-rajdhani tilt-container">
      {/* Filter Bar */}
      <div className="flex flex-wrap gap-4 items-center justify-between glass-panel rounded-2xl p-4">
        <div className="flex bg-black/50 border border-white/5 rounded-xl p-1 shadow-inner">
          {[
            { id: 'upcoming', label: 'Próximos' },
            { id: 'live', label: '🔴 Vivo' },
            { id: 'played', label: 'Jugados' },
            { id: 'all', label: 'Todos' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${statusFilter === tab.id ? 'bg-fifa-primary text-white shadow-[0_0_15px_rgba(234,88,12,0.4)]' : 'text-fifa-muted hover:text-white hover:bg-white/5'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] text-fifa-muted font-bold uppercase tracking-widest">Filtrar:</span>
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-xs text-white font-semibold outline-none focus:border-fifa-primary transition-all duration-300 min-w-[150px] hover:border-white/20"
          >
            {groupsList.map((group: string) => (
              <option key={group} value={group} className="bg-[#0b0f17] text-white font-semibold py-1">
                {group === 'All' ? '🏆 Torneo Completo' : group}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Matches List Container */}
      <div ref={listRef}>
        {Object.keys(categories).length === 0 ? (
          <div className="text-center py-16 glass-panel border-dashed rounded-3xl text-fifa-muted text-sm tracking-wide flex flex-col items-center gap-3">
            <span className="text-3xl opacity-50">⚽</span>
            No hay partidos programados con este filtro.
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {Object.keys(categories).map((category, catIdx) => (
              <div key={catIdx} className="flex flex-col gap-3">
                <h3 className="text-[11px] font-bold text-fifa-muted tracking-widest uppercase pl-3 border-l-2 border-fifa-primary">
                  {category}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categories[category].map((match: any) => {
                    const isPlayed = match.score_a !== null && match.score_b !== null;
                    const isLive = match.status.includes('vivo');
                    const isSelected = match.id === selectedMatchId;

                    return (
                      <div
                        key={match.id}
                        onClick={() => onMatchSelect(match)}
                        className={`match-card match-card-anim tilt-card glass-panel glass-panel-hover rounded-2xl px-6 py-5 flex items-center gap-4 cursor-pointer relative overflow-hidden ${
                          isSelected
                            ? 'border-fifa-accent/50 bg-fifa-accent/10 shadow-[0_0_25px_rgba(249,115,22,0.15)]'
                            : isLive
                            ? 'border-fifa-danger/40 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                            : 'hover:border-fifa-primary/40'
                        }`}
                      >
                        {/* Selected Indicator Glow */}
                        {isSelected && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-fifa-accent shadow-[0_0_12px_#f97316]"></div>
                        )}

                        {/* Group / Round badge */}
                        <div className="hidden sm:flex flex-col items-center justify-center min-w-[55px] border-r border-white/5 pr-4">
                          <span className="text-[9px] text-fifa-accent font-bold uppercase tracking-wide">{match.group?.replace('Grupo ', 'Grp ')}</span>
                          <span className="text-[9px] text-fifa-muted mt-0.5">{match.round?.replace('Jornada ', 'J ')}</span>
                        </div>

                        {/* Team A */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <img
                            src={`https://flagcdn.com/24x18/${(match.flag_a || 'un').toLowerCase()}.png`}
                            alt={match.team_a}
                            className="rounded border border-white/10 w-6 h-4.5 object-cover shrink-0 shadow-sm"
                            onError={(e) => { e.currentTarget.src = 'https://flagcdn.com/24x18/un.png'; }}
                          />
                          <span className={`text-sm truncate ${isPlayed && match.score_a > match.score_b ? 'text-fifa-accent font-bold' : 'text-white/90 font-medium'}`}>
                            {match.team_a}
                          </span>
                        </div>

                        {/* Static Score Display (No Inputs) */}
                        <div className="flex flex-col items-center justify-center min-w-[75px] bg-black/30 rounded-xl py-1.5 px-2 border border-white/5">
                          {isLive ? (
                            <div className="flex items-center gap-2 font-bebas text-2xl text-fifa-danger tracking-wider">
                              <span>{match.score_a}</span>
                              <span className="animate-pulse-live text-xl mb-1">:</span>
                              <span>{match.score_b}</span>
                            </div>
                          ) : isPlayed ? (
                            <div className="flex items-center gap-2 font-bebas text-2xl tracking-wider">
                              <span className={match.score_a > match.score_b ? 'text-fifa-accent font-black' : 'text-white/70'}>{match.score_a}</span>
                              <span className="text-fifa-muted/30 text-lg mb-1">-</span>
                              <span className={match.score_b > match.score_a ? 'text-fifa-accent font-black' : 'text-white/70'}>{match.score_b}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 font-bebas text-xl text-white/30 tracking-wider">
                              <span>–</span>
                              <span className="text-sm mb-1 text-white/10">-</span>
                              <span>–</span>
                            </div>
                          )}
                        </div>

                        {/* Team B */}
                        <div className="flex items-center gap-3 flex-1 justify-end min-w-0">
                          <span className={`text-sm truncate text-right ${isPlayed && match.score_b > match.score_a ? 'text-fifa-accent font-bold' : 'text-white/90 font-medium'}`}>
                            {match.team_b}
                          </span>
                          <img
                            src={`https://flagcdn.com/24x18/${(match.flag_b || 'un').toLowerCase()}.png`}
                            alt={match.team_b}
                            className="rounded border border-white/10 w-6 h-4.5 object-cover shrink-0 shadow-sm"
                            onError={(e) => { e.currentTarget.src = 'https://flagcdn.com/24x18/un.png'; }}
                          />
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0 pl-3">{renderStatusBadge(match.status)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
