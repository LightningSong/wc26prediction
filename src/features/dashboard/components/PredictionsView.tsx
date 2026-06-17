import React, { useState } from 'react';

interface PredictionsViewProps {
  isLocked?: boolean;
  bracketData?: any;
  simulationStats?: any;
  groupsData?: any[];
  matchesData?: any[];
}

export default function PredictionsView({ 
  isLocked = true, 
  bracketData, 
  simulationStats,
  groupsData,
  matchesData
}: PredictionsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const getTeamFlag = (teamName: string): string => {
    if (!teamName) return 'un';
    
    // Scan groups
    if (groupsData) {
      for (const group of groupsData) {
        const team = group.teams?.find((t: any) => t.name === teamName);
        if (team && team.flag && team.flag !== 'un') return team.flag;
      }
    }
    
    // Scan bracket
    if (bracketData) {
      for (const round of Object.keys(bracketData)) {
        for (const m of bracketData[round]) {
          if (m.team_a === teamName && m.flag_a && m.flag_a !== 'un') return m.flag_a;
          if (m.team_b === teamName && m.flag_b && m.flag_b !== 'un') return m.flag_b;
        }
      }
    }
    
    // Scan matches
    if (matchesData) {
      for (const m of matchesData) {
        if (m.team_a === teamName && m.flag_a && m.flag_a !== 'un') return m.flag_a;
        if (m.team_b === teamName && m.flag_b && m.flag_b !== 'un') return m.flag_b;
      }
    }
    
    return 'un';
  };

  const getSortedStats = () => {
    if (!simulationStats) return [];
    
    const teamsArray = Object.entries(simulationStats).map(([name, stats]: [string, any]) => ({
      name,
      champion: stats.champion || 0,
      finalist: stats.finalist || 0,
      semifinalist: stats.semifinalist || 0,
      flag: getTeamFlag(name)
    }));
    
    return teamsArray.sort((a, b) => {
      if (b.champion !== a.champion) return b.champion - a.champion;
      if (b.finalist !== a.finalist) return b.finalist - a.finalist;
      if (b.semifinalist !== a.semifinalist) return b.semifinalist - a.semifinalist;
      return a.name.localeCompare(b.name);
    });
  };

  const getPodium = () => {
    if (!bracketData || !bracketData.final || !bracketData.third_place) return null;
    const finalMatch = bracketData.final[0];
    const thirdMatch = bracketData.third_place[0];
    
    if (finalMatch.score_a === null || finalMatch.score_b === null) return null;

    let champion = { name: "A definir", flag: "un" };
    let runnerUp = { name: "A definir", flag: "un" };
    let third = { name: "A definir", flag: "un" };

    if (finalMatch.score_a > finalMatch.score_b) {
      champion = { name: finalMatch.team_a, flag: finalMatch.flag_a };
      runnerUp = { name: finalMatch.team_b, flag: finalMatch.flag_b };
    } else if (finalMatch.score_b > finalMatch.score_a) {
      champion = { name: finalMatch.team_b, flag: finalMatch.flag_b };
      runnerUp = { name: finalMatch.team_a, flag: finalMatch.flag_a };
    } else if (finalMatch.penalty_winner) {
      champion = { name: finalMatch.penalty_winner, flag: finalMatch.penalty_winner === finalMatch.team_a ? finalMatch.flag_a : finalMatch.flag_b };
      runnerUp = { name: finalMatch.penalty_winner === finalMatch.team_a ? finalMatch.team_b : finalMatch.team_a, flag: finalMatch.penalty_winner === finalMatch.team_a ? finalMatch.flag_b : finalMatch.flag_a };
    }

    if (thirdMatch && thirdMatch.score_a !== null && thirdMatch.score_b !== null) {
      if (thirdMatch.score_a > thirdMatch.score_b) {
        third = { name: thirdMatch.team_a, flag: thirdMatch.flag_a };
      } else if (thirdMatch.score_b > thirdMatch.score_a) {
        third = { name: thirdMatch.team_b, flag: thirdMatch.flag_b };
      } else if (thirdMatch.penalty_winner) {
        third = { name: thirdMatch.penalty_winner, flag: thirdMatch.penalty_winner === thirdMatch.team_a ? thirdMatch.flag_a : thirdMatch.flag_b };
      }
    }

    return { champion, runnerUp, third };
  };

  const sortedStats = getSortedStats();
  const filteredStats = sortedStats.filter(team => 
    team.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const podium = getPodium();

  return (
    <section className="space-y-10 relative">
      <div className="text-center max-w-xl mx-auto">
        <h2 className="font-bebas text-5xl text-primary leading-none uppercase drop-shadow-sm">Análisis y Predicciones</h2>
        <p className="text-on-surface-variant text-sm mt-1 font-medium">Estadísticas avanzadas tras simular todos los encuentros</p>
      </div>

      <div className="relative">
        {/* Locked Overlay */}
        {isLocked && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-surface-container-lowest/40 backdrop-blur-md rounded-3xl border border-outline-variant/30">
            <div className="bg-surface-container-highest border border-outline-variant/50 shadow-2xl rounded-2xl p-8 max-w-md text-center transform animate-slide-in-up">
              <span className="material-symbols-outlined text-5xl text-primary mb-4 opacity-80">lock</span>
              <h3 className="font-bebas text-3xl text-on-surface mb-2 tracking-wide uppercase">Sección Bloqueada</h3>
              <p className="text-sm text-on-surface-variant font-medium">
                Esta sección de predicciones requiere que la simulación del torneo esté completa.
                <br/><br/>
                Usa el botón <strong className="text-primary uppercase tracking-widest text-xs">Simular Todo</strong> en la parte superior para generar los resultados predictivos de la Copa Mundial 2026.
              </p>
            </div>
          </div>
        )}

        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 ${isLocked ? 'pointer-events-none opacity-50 blur-sm select-none transition-all duration-700' : 'animate-fade-in'}`}>
          
          {/* Monte Carlo Simulation of Simulations results */}
          <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant shadow-sm lg:col-span-3 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 border-b border-outline-variant/20 pb-4 relative z-10">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-base text-primary normal-case">casino</span>
                  Simulación Monte Carlo (Estadísticas de Avance)
                </h3>
                <p className="text-[11px] text-on-surface-variant font-medium">
                  Porcentaje de probabilidad calculado tras 250 simulaciones stocásticas basadas en el rendimiento real.
                </p>
              </div>
              
              {/* Search input */}
              <div className="relative w-full md:w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">search</span>
                <input 
                  type="text" 
                  placeholder="Buscar país..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 text-xs bg-surface-container border border-outline-variant rounded-xl focus:outline-none focus:border-primary text-on-surface placeholder:text-on-surface-variant/60"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* List scroll container */}
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
              {filteredStats.length > 0 ? (
                filteredStats.map((team, idx) => (
                  <div 
                    key={team.name} 
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-surface-container/20 border border-outline-variant/30 rounded-2xl hover:bg-surface-container/40 transition-all gap-4"
                  >
                    {/* Team Profile */}
                    <div className="flex items-center gap-3 min-w-[180px]">
                      <span className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center font-bebas text-xs text-on-surface-variant font-bold">
                        #{idx + 1}
                      </span>
                      <img 
                        src={`https://flagcdn.com/32x24/${team.flag.toLowerCase()}.png`} 
                        alt={team.name} 
                        className="w-7 h-5 rounded shadow-sm object-cover border border-outline-variant/30"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://flagcdn.com/32x24/un.png";
                        }}
                      />
                      <span className="font-bebas text-lg tracking-wider text-on-surface uppercase truncate max-w-[120px]">
                        {team.name}
                      </span>
                    </div>

                    {/* Progress bars */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
                      {/* Semifinalist Progress */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight">
                          <span className="text-on-surface-variant/80">Semifinalista</span>
                          <span className="text-sky-500 font-semibold">{team.semifinalist}%</span>
                        </div>
                        <div className="h-2 bg-surface-container rounded-full overflow-hidden shadow-inner">
                          <div 
                            className="h-full rounded-full transition-all duration-1000 bg-sky-500/80 relative" 
                            style={{ width: `${team.semifinalist}%` }}
                          >
                            <div className="absolute inset-0 bg-white/10 animate-pulse-soft"></div>
                          </div>
                        </div>
                      </div>

                      {/* Finalist Progress */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight">
                          <span className="text-on-surface-variant/80">Finalista</span>
                          <span className="text-purple-500 font-semibold">{team.finalist}%</span>
                        </div>
                        <div className="h-2 bg-surface-container rounded-full overflow-hidden shadow-inner">
                          <div 
                            className="h-full rounded-full transition-all duration-1000 bg-purple-500/80 relative" 
                            style={{ width: `${team.finalist}%` }}
                          >
                            <div className="absolute inset-0 bg-white/10 animate-pulse-soft"></div>
                          </div>
                        </div>
                      </div>

                      {/* Champion Progress */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight">
                          <span className="text-on-surface-variant/80">Campeón</span>
                          <span className="text-yellow-600 dark:text-yellow-400 font-semibold">{team.champion}%</span>
                        </div>
                        <div className="h-2 bg-surface-container rounded-full overflow-hidden shadow-inner">
                          <div 
                            className="h-full rounded-full transition-all duration-1000 bg-yellow-500 relative" 
                            style={{ width: `${team.champion}%` }}
                          >
                            <div className="absolute inset-0 bg-white/20 animate-pulse-soft"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-on-surface-variant text-sm font-medium">
                  No se encontraron países que coincidan con la búsqueda.
                </div>
              )}
            </div>
          </div>

          {/* Podio Predicho / Resultado */}
          <div className="bg-surface-container-lowest p-8 rounded-3xl border border-primary/20 shadow-lg lg:col-span-3 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent"></div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-12 text-center relative z-10">Podio del Torneo</h3>
            <div className="flex items-end justify-center gap-4 md:gap-12 py-4 relative z-10">
              {/* 2nd Place */}
              <div className="flex flex-col items-center gap-3 w-32 transform hover:-translate-y-2 transition-transform">
                <img src={`https://flagcdn.com/48x36/${podium?.runnerUp?.flag?.toLowerCase() || 'un'}.png`} alt={podium?.runnerUp?.name || 'A definir'} className="w-12 h-9 rounded shadow-sm object-cover border border-outline-variant/30" />
                <span className="text-[10px] font-bold uppercase text-on-surface-variant truncate w-full text-center">{podium?.runnerUp?.name || 'A definir'}</span>
                <div className="w-full bg-gradient-to-t from-surface-container-high to-surface-container h-32 rounded-t-2xl flex items-center justify-center font-bebas text-4xl text-on-surface-variant/50 border border-outline-variant/30 shadow-inner">
                  2
                </div>
              </div>
              
              {/* 1st Place */}
              <div className="flex flex-col items-center gap-3 w-40 z-10 transform hover:-translate-y-2 transition-transform">
                <div className="relative">
                  <div className="absolute -inset-4 bg-yellow-500/20 rounded-full blur-xl animate-pulse-soft"></div>
                  <img src={`https://flagcdn.com/64x48/${podium?.champion?.flag?.toLowerCase() || 'un'}.png`} alt={podium?.champion?.name || 'A definir'} className="w-16 h-12 rounded shadow-md relative z-10 border-2 border-yellow-400 object-cover" />
                </div>
                <span className="text-xs font-black uppercase text-on-surface truncate w-full text-center tracking-wider">{podium?.champion?.name || 'A definir'}</span>
                <div className="w-full bg-gradient-to-t from-yellow-500 to-yellow-400 h-48 rounded-t-2xl flex items-start justify-center pt-8 font-bebas text-6xl text-white shadow-[0_-10px_30px_rgba(234,179,8,0.3)] border border-yellow-300">
                  <span className="drop-shadow-md">1</span>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="flex flex-col items-center gap-3 w-32 transform hover:-translate-y-2 transition-transform">
                <img src={`https://flagcdn.com/48x36/${podium?.third?.flag?.toLowerCase() || 'un'}.png`} alt={podium?.third?.name || 'A definir'} className="w-12 h-9 rounded shadow-sm object-cover border border-outline-variant/30" />
                <span className="text-[10px] font-bold uppercase text-on-surface-variant truncate w-full text-center">{podium?.third?.name || 'A definir'}</span>
                <div className="w-full bg-gradient-to-t from-surface-container-high to-surface-container h-24 rounded-t-2xl flex items-center justify-center font-bebas text-4xl text-on-surface-variant/50 border border-outline-variant/30 shadow-inner">
                  3
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
