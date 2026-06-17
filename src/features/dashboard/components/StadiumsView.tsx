import React, { useState } from 'react';
import { STADIUMS } from '@/shared/data';

interface StadiumsViewProps {
  matches?: any[];
}

export default function StadiumsView({ matches = [] }: StadiumsViewProps) {
  const [filter, setFilter] = useState('all');
  const [selectedStadium, setSelectedStadium] = useState<string | null>(null);

  const list = filter === 'all' ? STADIUMS : STADIUMS.filter(s => s.cnt === filter);
  const badges: Record<string, string> = {
    final: 'bg-primary text-white',
    semi: 'bg-secondary text-white',
    inaug: 'bg-green-600 text-white'
  };

  const getStadiumMatches = (stadiumName: string) => {
    return matches.filter(m => m.stadium === stadiumName).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  return (
    <section className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="font-bebas text-5xl text-primary leading-none uppercase drop-shadow-sm">Sedes y Estadios</h2>
          <p className="text-on-surface-variant text-sm mt-1 font-medium">16 ciudades anfitrionas preparadas para la historia</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'usa', label: '🇺🇸 USA' },
            { id: 'can', label: '🇨🇦 CAN' },
            { id: 'mex', label: '🇲🇽 MEX' }
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => { setFilter(btn.id); setSelectedStadium(null); }}
              className={`px-5 py-2 rounded-full text-xs font-bold uppercase border transition-all ${
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {list.map((s, idx) => {
          const isSelected = selectedStadium === s.n;
          return (
            <div 
              key={idx} 
              onClick={() => setSelectedStadium(isSelected ? null : s.n)}
              className={`cursor-pointer bg-surface-container-lowest border ${isSelected ? 'border-primary shadow-[0_0_20px_rgba(37,99,235,0.2)] scale-[1.02]' : 'border-outline-variant'} rounded-2xl overflow-hidden flex flex-col h-full group hover:shadow-lg transition-all duration-300 transform`}
            >
              <div className="p-5 flex-1 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-surface-container-low to-surface-container/10 group-hover:bg-primary/5 transition-colors duration-500"></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bebas text-2xl text-primary leading-tight">{s.n}</h3>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase mt-0.5">{s.city}</p>
                    </div>
                    <span className="text-3xl drop-shadow-sm">{s.f}</span>
                  </div>
                  <div className="flex items-end justify-between mt-8">
                    <div>
                      <div className="text-[9px] font-bold text-on-primary-container/60 uppercase tracking-widest mb-1">Capacidad</div>
                      <div className="font-bebas text-2xl text-on-surface">{s.cap.toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] font-bold text-on-primary-container/60 uppercase tracking-widest mb-1">Partidos</div>
                      <div className="font-bebas text-2xl text-on-surface">{s.m}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="h-1 bg-surface-container">
                <div className="h-full bg-primary transition-all duration-1000 ease-out" style={{ width: `${Math.round((s.cap / 91000) * 100)}%` }}></div>
              </div>
              {s.badge && (
                <div className={`px-5 py-2 text-[9px] font-black uppercase tracking-widest text-center ${badges[s.badge]}`}>
                  {s.badge === 'final' ? '⭐ Final 2026' : s.badge}
                </div>
              )}
              <div className={`px-5 py-3 border-t border-outline-variant/30 bg-surface-container/20 text-center text-xs font-bold uppercase tracking-widest transition-colors ${isSelected ? 'text-primary' : 'text-on-surface-variant group-hover:text-primary'}`}>
                {isSelected ? 'Ocultar Partidos' : 'Ver Partidos'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Stadium Matches Glassmorphic Container */}
      {selectedStadium && (
        <div className="mt-8 animate-slide-in-up">
          <div className="bg-surface-container-lowest/80 backdrop-blur-xl border border-primary/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
            
            <div className="flex items-center justify-between mb-8 relative z-10 border-b border-outline-variant/30 pb-4">
              <div>
                <h3 className="font-bebas text-4xl text-primary">Partidos en {selectedStadium}</h3>
                <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mt-1">Calendario Oficial</p>
              </div>
              <button 
                onClick={() => setSelectedStadium(null)}
                className="bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-error w-10 h-10 rounded-full flex items-center justify-center transition-all"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
              {getStadiumMatches(selectedStadium).length === 0 ? (
                <div className="col-span-full py-12 text-center text-on-surface-variant font-bold uppercase tracking-widest text-sm bg-surface-container/30 rounded-2xl border border-outline-variant/50 border-dashed">
                  No hay partidos asignados todavía
                </div>
              ) : (
                getStadiumMatches(selectedStadium).map(m => {
                  const isLive = m.status?.includes('vivo');
                  const isFinished = m.status?.includes('Finalizado') || m.status?.includes('Simulado');
                  return (
                    <div key={m.id} className={`flex flex-col border ${isLive ? 'border-error/50 bg-error/5 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-outline-variant/50 bg-surface-container-lowest/50'} rounded-xl p-5 transition-all hover:scale-[1.02] hover:shadow-md backdrop-blur-md`}>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{new Date(m.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        {isLive ? (
                          <span className="text-[9px] bg-error text-white px-2 py-0.5 rounded font-black animate-pulse-soft">EN VIVO</span>
                        ) : (
                          <span className="text-[9px] font-bold text-on-surface-variant uppercase bg-surface-container-high px-2 py-0.5 rounded">{m.status}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 flex-1">
                          <img src={`https://flagcdn.com/20x15/${m.flag_a?.toLowerCase() || 'un'}.png`} alt={m.team_a} className="w-5 h-4 rounded-sm shadow-sm" />
                          <span className="font-bold text-sm truncate">{m.team_a}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-surface-container-lowest px-3 py-1.5 rounded-lg border border-outline-variant/50 shadow-inner">
                          <span className="font-bebas text-xl w-4 text-center">{m.score_a !== null ? m.score_a : '-'}</span>
                          <span className="text-on-surface-variant text-xs font-black">:</span>
                          <span className="font-bebas text-xl w-4 text-center">{m.score_b !== null ? m.score_b : '-'}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-1 justify-end">
                          <span className="font-bold text-sm truncate">{m.team_b}</span>
                          <img src={`https://flagcdn.com/20x15/${m.flag_b?.toLowerCase() || 'un'}.png`} alt={m.team_b} className="w-5 h-4 rounded-sm shadow-sm" />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
