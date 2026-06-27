import React, { useState } from 'react';
import { GROUP_COLORS } from '@/shared/data';
import PredictionPanel from '@/features/predictions/components/PredictionPanel';

interface GroupsViewProps {
  groups: any[];
  matches?: any[];
}

export default function GroupsView({ groups, matches = [] }: GroupsViewProps) {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedGroupMatch, setSelectedGroupMatch] = useState<any>(null);

  const renderGroupTable = (g: any, isSelected: boolean = false) => {
    const groupLetter = g.name.replace('Grupo ', '').trim();
    const color = GROUP_COLORS[groupLetter] || '#000000';

    return (
      <div 
        key={g.name} 
        onClick={() => !isSelected && setSelectedGroup(g.name)}
        className={`bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${
          isSelected ? 'shadow-[0_20px_50px_rgba(0,0,0,0.3)] scale-100 ring-2 ring-primary border-transparent' : 'hover:-translate-y-1 hover:shadow-lg hover:border-primary/50 cursor-pointer'
        }`}
      >
        <div className="px-5 py-4 flex items-center justify-between border-b border-outline-variant/30 relative overflow-hidden group-hover:bg-primary/5 transition-colors">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none"></div>
          <span className="font-bebas text-2xl tracking-wide uppercase relative z-10" style={{ color }}>{g.name}</span>
          {!isSelected && (
            <span className="text-[10px] font-bold text-on-surface-variant tracking-wider uppercase">Click para Ver Partidos</span>
          )}
        </div>
        <div className="flex-1 overflow-x-auto custom-scrollbar bg-gradient-to-b from-surface-container-lowest to-surface-container/20">
          <table className="w-full text-xs min-w-[340px]">
            <thead>
              <tr className="text-on-primary-container/60 uppercase font-bold text-[9px] tracking-widest border-b border-outline-variant/10">
                <th className="px-4 py-3 text-left font-medium text-on-surface-variant">Equipo</th>
                <th className="px-1 py-3 text-center">PJ</th>
                <th className="px-1 py-3 text-center hidden sm:table-cell">G</th>
                <th className="px-1 py-3 text-center hidden sm:table-cell">E</th>
                <th className="px-1 py-3 text-center hidden sm:table-cell">P</th>
                <th className="px-1 py-3 text-center hidden lg:table-cell">GF</th>
                <th className="px-1 py-3 text-center hidden lg:table-cell">GC</th>
                <th className="px-1 py-3 text-center">GD</th>
                <th className="px-4 py-3 text-right">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {g.teams.map((t: any, i: number) => {
                const isQualified = i < 2;
                return (
                  <tr key={i} className={`hover:bg-surface-container/50 transition-colors ${isQualified ? 'bg-primary/[0.03]' : ''}`}>
                    <td className="px-4 py-3 flex items-center gap-2">
                      <span className="text-on-primary-container/40 font-bold w-4 text-[10px]">{i + 1}</span>
                      <img src={`https://flagcdn.com/16x12/${t.flag?.toLowerCase() || 'un'}.png`} alt={t.name} className="w-4 h-3 rounded-sm object-cover border border-outline-variant shadow-sm" />
                      <span className={`font-semibold truncate max-w-[100px] ${isQualified ? 'text-on-surface' : 'text-on-surface-variant'}`}>{t.name}</span>
                    </td>
                    <td className="px-1 py-3 text-center font-medium text-on-surface-variant">{t.pj}</td>
                    <td className="px-1 py-3 text-center text-on-surface-variant hidden sm:table-cell">{t.g}</td>
                    <td className="px-1 py-3 text-center text-on-surface-variant hidden sm:table-cell">{t.e}</td>
                    <td className="px-1 py-3 text-center text-on-surface-variant hidden sm:table-cell">{t.p}</td>
                    <td className="px-1 py-3 text-center text-on-surface-variant hidden lg:table-cell">{t.gf}</td>
                    <td className="px-1 py-3 text-center text-on-surface-variant hidden lg:table-cell">{t.gc}</td>
                    <td className={`px-1 py-3 text-center font-bold ${t.dg > 0 ? 'text-green-500' : t.dg < 0 ? 'text-red-400' : 'text-on-surface-variant'}`}>
                      {t.dg > 0 ? '+' : ''}{t.dg}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-[14px]" style={{ color: isQualified ? color : 'var(--color-on-surface-variant)' }}>
                      {t.pts}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderGroupMatches = (groupName: string) => {
    const groupMatches = matches.filter(m => m.group === groupName).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return (
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm p-6 overflow-hidden flex flex-col h-full relative">
        {/* Glassmorphic decorative blob */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
        
        <h3 className="font-bebas text-3xl text-on-surface mb-6 relative z-10 flex items-center gap-3">
          Partidos del Grupo
          <span className="text-xs font-sans font-bold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-widest">{groupMatches.length} Partidos</span>
        </h3>
        <div className="grid grid-cols-1 gap-4 relative z-10 overflow-y-auto custom-scrollbar max-h-[500px] pr-2">
          {groupMatches.map(m => {
            const isLive = m.status?.includes('vivo');
            const isSelected = selectedGroupMatch?.id === m.id;
            return (
              <div 
                key={m.id} 
                onClick={() => setSelectedGroupMatch(m)}
                className={`flex flex-col border cursor-pointer ${
                  isSelected 
                    ? 'border-primary bg-primary/[0.04] shadow-[0_4px_12px_rgba(0,0,0,0.05)] ring-1 ring-primary' 
                    : isLive 
                      ? 'border-error/50 bg-error/5 shadow-[0_0_15px_rgba(239,68,68,0.1)]' 
                      : 'border-outline-variant bg-surface-container hover:border-primary/40'
                } rounded-xl p-4 transition-all hover:scale-[1.02] hover:shadow-md`}
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{new Date(m.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
                  {isLive ? (
                    <span className="text-[9px] bg-error text-white px-2 py-0.5 rounded font-black animate-pulse-soft">EN VIVO</span>
                  ) : (
                    <span className="text-[9px] font-bold text-on-surface-variant uppercase bg-surface-container-high px-2 py-0.5 rounded">{m.status}</span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <img src={`https://flagcdn.com/20x15/${m.flag_a?.toLowerCase() || 'un'}.png`} alt={m.team_a} className="w-5 h-4 rounded-sm shadow-sm" />
                    <span className="font-bold text-sm truncate">{m.team_a}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-surface-container-lowest px-3 py-1.5 rounded-lg border border-outline-variant/50 shadow-inner shrink-0">
                    <span className="font-bebas text-xl w-4 text-center">{m.score_a !== null ? m.score_a : '-'}</span>
                    <span className="text-on-surface-variant text-xs font-black">:</span>
                    <span className="font-bebas text-xl w-4 text-center">{m.score_b !== null ? m.score_b : '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                    <span className="font-bold text-sm truncate">{m.team_b}</span>
                    <img src={`https://flagcdn.com/20x15/${m.flag_b?.toLowerCase() || 'un'}.png`} alt={m.team_b} className="w-5 h-4 rounded-sm shadow-sm" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const selectedGroupData = groups.find(g => g.name === selectedGroup);

  return (
    <section className="space-y-10">
      {!selectedGroup && (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fade-in">
          <div>
            <h2 className="font-bebas text-5xl text-primary leading-none uppercase drop-shadow-sm">Fase de Grupos</h2>
            <p className="text-on-surface-variant text-sm mt-1 font-medium">12 Grupos · 48 Equipos · Haz clic en un grupo para ver detalles</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-surface-container border border-outline-variant rounded-xl px-4 py-2 flex flex-col items-center shadow-sm">
              <span className="text-xl font-bebas text-primary leading-none">24</span>
              <span className="text-[8px] font-bold uppercase tracking-widest text-on-surface-variant">PJ</span>
            </div>
            <div className="bg-surface-container border border-outline-variant rounded-xl px-4 py-2 flex flex-col items-center shadow-sm">
              <span className="text-xl font-bebas text-primary leading-none">56</span>
              <span className="text-[8px] font-bold uppercase tracking-widest text-on-surface-variant">Goles</span>
            </div>
          </div>
        </div>
      )}

      <div className={`transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] relative`}>
        {selectedGroup ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-slide-in-up">
            {/* Column 1: Stands Card */}
            <div className="lg:col-span-4 h-fit lg:sticky lg:top-24">
              {renderGroupTable(selectedGroupData, true)}
            </div>
            
            {/* Column 2: Matches Card with Volver Button */}
            <div className="lg:col-span-5 flex flex-col">
              <div className="flex justify-start mb-4">
                <button 
                  onClick={() => { setSelectedGroup(null); setSelectedGroupMatch(null); }}
                  className="text-xs font-bold bg-surface-container text-on-surface hover:bg-primary hover:text-white px-4 py-2 border border-outline-variant rounded-xl transition-all uppercase tracking-widest shadow-sm flex items-center gap-1.5 cursor-pointer animate-fade-in"
                >
                  <span className="material-symbols-outlined text-sm font-bold normal-case">arrow_back</span>
                  Volver
                </button>
              </div>
              {renderGroupMatches(selectedGroup)}
            </div>

            {/* Column 3: Predictions Card */}
            <div className="lg:col-span-3 h-fit lg:sticky lg:top-24">
              {selectedGroupMatch ? (
                <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden flex flex-col animate-gsap-fade">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/50 bg-surface-container/50">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest font-bebas flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse-soft"></span>
                      Análisis Predictivo
                    </span>
                    <button
                      onClick={() => setSelectedGroupMatch(null)}
                      className="text-on-surface-variant hover:text-primary transition-all w-6 h-6 flex items-center justify-center rounded-full hover:bg-surface-container-high"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="overflow-y-auto no-scrollbar max-h-[70vh]">
                    <PredictionPanel selectedMatch={selectedGroupMatch} liveScore={null} layoutMode="sidebar" />
                  </div>
                </div>
              ) : (
                <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm p-6 h-full flex flex-col items-center justify-center text-center text-on-surface-variant min-h-[350px]">
                  <span className="material-symbols-outlined text-4xl text-primary/40 mb-3 animate-pulse-soft">analytics</span>
                  <p className="text-sm font-semibold">Análisis Predictivo</p>
                  <p className="text-xs text-on-surface-variant/60 mt-1 max-w-[200px] leading-relaxed">
                    Haz clic en cualquier partido del grupo para abrir el análisis estocástico aquí.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in group-grid">
            {groups.map((g) => renderGroupTable(g, false))}
          </div>
        )}
      </div>
    </section>
  );
}
