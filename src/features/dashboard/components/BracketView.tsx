import React, { useState, useEffect, useRef } from 'react';
import PredictionPanel from '@/features/predictions/components/PredictionPanel';

interface BracketViewProps {
  bracket: any;
  onAdvanceTeam: (matchId: string, winnerName: string, winnerFlag: string, loserName: string, loserFlag: string) => void;
  onBracketScoreChange: (matchId: string, team: 'a' | 'b', score: string) => void;
  onMatchSelect: (match: any) => void;
  selectedMatch?: any;
  liveScore?: any;
}

export default function BracketView({ bracket, onAdvanceTeam, onBracketScoreChange, onMatchSelect, selectedMatch, liveScore }: BracketViewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.85);

  useEffect(() => {
    if (!isFullscreen) return;
    const handleResize = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      
      const panelWidth = selectedMatch ? (window.innerWidth >= 1280 ? 420 : 360) : 0;
      const availableWidth = containerWidth - panelWidth - (selectedMatch ? 24 : 0);
      const availableHeight = containerHeight - 50; // padding/header offset
      
      const baseWidth = 2020;
      const baseHeight = 920;
      
      const scaleX = availableWidth / baseWidth;
      const scaleY = availableHeight / baseHeight;
      
      const newScale = Math.min(scaleX, scaleY);
      setScale(Math.max(0.35, Math.min(1.1, newScale)));
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    const timer = setTimeout(handleResize, 150);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [isFullscreen, selectedMatch]);

  if (!bracket) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isTbd = (name: string) => !name || name === 'A definir' || name.startsWith('1°') || name.startsWith('2°') || name.startsWith('3°');

  const formatMatchId = (id: string) => {
    if (!id) return '';
    const upper = id.toUpperCase();
    if (upper === 'FINAL') return 'FINAL';
    if (upper === 'THIRD_PLACE') return '3ER LUGAR';
    return upper.replace('_', ' #');
  };

  const handleTeamClick = (e: React.MouseEvent, match: any, clickedTeam: 'a' | 'b') => {
    e.stopPropagation();
    const teamA = match.team_a;
    const teamB = match.team_b;
    if (isTbd(teamA) || isTbd(teamB)) return;

    if (clickedTeam === 'a') {
      onAdvanceTeam(match.id, teamA, match.flag_a, teamB, match.flag_b);
    } else {
      onAdvanceTeam(match.id, teamB, match.flag_b, teamA, match.flag_a);
    }
    onMatchSelect(match);
  };

  const renderMatchBox = (match: any) => {
    const sa = match.score_a;
    const sb = match.score_b;
    const hasScore = sa !== null && sb !== null;
    const isSelected = match.id === selectedMatch?.id;

    let winnerA = false;
    let winnerB = false;

    if (hasScore) {
      if (sa > sb) winnerA = true;
      else if (sb > sa) winnerB = true;
      else if (match.penalty_winner) {
        winnerA = match.penalty_winner === match.team_a;
        winnerB = match.penalty_winner === match.team_b;
      }
    } else if (match.penalty_winner) {
      winnerA = match.penalty_winner === match.team_a;
      winnerB = match.penalty_winner === match.team_b;
    }

    const teamAIsTbd = isTbd(match.team_a);
    const teamBIsTbd = isTbd(match.team_b);
    const bothDefined = !teamAIsTbd && !teamBIsTbd;

    const renderTeam = (name: string, flag: string, isWinner: boolean, score: number | null, side: 'a' | 'b') => {
      const tdbd = isTbd(name);

      return (
        <div
          onClick={(e) => bothDefined && handleTeamClick(e, match, side)}
          className={`flex items-center justify-between px-2 py-1 rounded transition-all duration-200 ${
            bothDefined ? 'cursor-pointer hover:bg-surface-container group/team' : ''
          } ${isWinner ? 'bg-primary/5 border-l-2 border-primary' : 'border-l-2 border-transparent'}`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {tdbd ? (
              <div className="w-5 h-3.5 bg-surface-container rounded-sm shrink-0 flex items-center justify-center text-[7px] text-on-surface-variant font-bold border border-outline-variant">?</div>
            ) : (
              <img
                src={`https://flagcdn.com/16x12/${flag?.toLowerCase() || 'un'}.png`}
                alt={name}
                className="rounded-sm border border-outline-variant w-5 h-3.5 object-cover shrink-0 shadow-sm"
              />
            )}
            <span className={`text-[10px] sm:text-xs truncate font-semibold max-w-[80px] ${
              tdbd ? 'text-on-surface-variant italic' :
              isWinner ? 'text-primary font-bold' : 'text-on-surface'
            } ${bothDefined ? 'group-hover/team:text-primary' : ''}`}>
              {name}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            {bothDefined ? (
              <input
                type="number"
                min="0"
                placeholder="-"
                value={score !== null && score !== undefined ? score : ""}
                onChange={(e) => onBracketScoreChange(match.id, side, e.target.value)}
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded bg-surface-container-lowest border ${isWinner ? 'border-primary/50 text-primary' : 'border-outline-variant text-on-surface'} text-center text-[10px] sm:text-xs font-bold focus:border-primary outline-none focus:ring-1 focus:ring-primary/30 transition-all`}
              />
            ) : (
              <span className="text-[10px] text-on-surface-variant/50 font-bold px-1.5">–</span>
            )}
          </div>
        </div>
      );
    };

    return (
      <div
        onClick={() => onMatchSelect(match)}
        className={`bg-surface-container-lowest border rounded-xl flex flex-col justify-center transition-all cursor-pointer select-none w-40 sm:w-44 h-[90px] p-2 relative z-10 ${
          isSelected
            ? 'border-primary shadow-[0_0_15px_rgba(37,99,235,0.2)]'
            : bothDefined && !hasScore
            ? 'border-outline hover:border-primary/50'
            : hasScore
            ? 'border-green-500/30 bg-green-50/10'
            : 'border-outline-variant opacity-70'
        }`}
      >
        <div className="text-[8px] text-on-surface-variant font-bold border-b border-outline-variant/30 pb-1 mb-1.5 flex justify-between items-center tracking-widest uppercase px-1">
          <span className="text-primary">{formatMatchId(match.id)}</span>
          <span className="opacity-70">{match.date}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          {renderTeam(match.team_a, match.flag_a, winnerA, sa, 'a')}
          {renderTeam(match.team_b, match.flag_b, winnerB, sb, 'b')}
        </div>
        {hasScore && sa === sb && match.penalty_winner && (
          <div className="absolute -top-2 -right-2 text-[7px] text-center bg-primary text-white font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-md">
            Pen: {match.penalty_winner.substring(0, 3)}
          </div>
        )}
      </div>
    );
  };

  const getChampion = () => {
    const match = bracket.final?.[0];
    if (!match) return null;
    if (match.score_a !== null && match.score_b !== null) {
      if (match.score_a > match.score_b) return { name: match.team_a, flag: match.flag_a };
      if (match.score_b > match.score_a) return { name: match.team_b, flag: match.flag_b };
      if (match.penalty_winner) {
        return {
          name: match.penalty_winner,
          flag: match.penalty_winner === match.team_a ? match.flag_a : match.flag_b
        };
      }
    } else if (match.penalty_winner) {
      return {
        name: match.penalty_winner,
        flag: match.penalty_winner === match.team_a ? match.flag_a : match.flag_b
      };
    }
    return null;
  };

  const champion = getChampion();

  const H = 90; 
  const getRoundLayout = (roundIndex: number) => {
    const G0 = 16; 
    let topMargin = 0;
    let gap = G0;
    let slotSize = H + G0;
    
    for (let r = 1; r <= roundIndex; r++) {
      topMargin = topMargin + slotSize / 2;
      gap = 2 * slotSize - H;
      slotSize = H + gap;
    }
    
    return { topMargin, gap };
  };

  const leftRounds = [
    { key: 'round_of_32', label: 'Dieciseisavos', slice: [0, 8] },
    { key: 'round_of_16', label: 'Octavos', slice: [0, 4] },
    { key: 'quarter_finals', label: 'Cuartos', slice: [0, 2] },
    { key: 'semis', label: 'Semifinal', slice: [0, 1] },
  ];
  
  const rightRounds = [
    { key: 'semis', label: 'Semifinal', slice: [1, 2] },
    { key: 'quarter_finals', label: 'Cuartos', slice: [2, 4] },
    { key: 'round_of_16', label: 'Octavos', slice: [4, 8] },
    { key: 'round_of_32', label: 'Dieciseisavos', slice: [8, 16] },
  ];

  const getRoundMatches = (roundKey: string, sliceArr: number[]) => {
    const arr: any[] = bracket[roundKey] || [];
    return arr.slice(sliceArr[0], sliceArr[1]);
  };

  const treeNodes = (
    <>
      {/* LEFT SIDE */}
          {leftRounds.map((round, rIdx) => {
            const matches = getRoundMatches(round.key, round.slice);
            const { topMargin, gap } = getRoundLayout(rIdx);
            
            return (
              <div key={`left-${rIdx}`} className="flex flex-col items-center w-40 sm:w-44 shrink-0">
                <div className="text-center text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-6 h-6 flex items-center justify-center border-b border-outline-variant w-full pb-2">
                  {round.label}
                </div>
                <div className="flex flex-col flex-1" style={{ gap: `${gap}px` }}>
                  {matches.map((match: any, idx: number) => {
                    const isUpper = idx % 2 === 0;
                    return (
                      <div 
                        key={match.id} 
                        style={idx === 0 ? { marginTop: `${topMargin}px` } : {}}
                        className="flex items-center shrink-0 relative h-[90px]"
                      >
                        {renderMatchBox(match)}
                        {rIdx < leftRounds.length - 1 ? (
                          isUpper ? (
                            <div
                              className="absolute left-full top-1/2 border-t-2 border-r-2 border-outline-variant z-0 pointer-events-none rounded-tr-xl"
                              style={{ width: '20px', height: `${(H + gap) / 2}px` }}
                            />
                          ) : (
                            <div
                              className="absolute left-full bottom-1/2 border-b-2 border-r-2 border-outline-variant z-0 pointer-events-none rounded-br-xl"
                              style={{ width: '20px', height: `${(H + gap) / 2}px` }}
                            />
                          )
                        ) : (
                          <div
                            className="absolute left-full top-1/2 -translate-y-1/2 w-5 h-0.5 bg-outline-variant z-0 pointer-events-none"
                            style={{ width: '40px' }}
                          />
                        )}
                        {rIdx > 0 && (
                          <div
                            className="absolute right-full top-1/2 -translate-y-1/2 w-5 h-0.5 bg-outline-variant z-0 pointer-events-none"
                            style={{ width: '20px' }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* CENTER */}
          <div className="flex flex-col items-center justify-start w-56 sm:w-64 shrink-0">
            <div className="text-center text-[10px] font-black text-primary uppercase tracking-widest mb-6 h-6 flex items-center justify-center border-b border-primary/30 w-full pb-2">
              LA GRAN FINAL
            </div>
            
            <div className="flex flex-col w-full h-full relative" style={{ minHeight: `${8 * 106}px` }}>
              {/* Champion Card */}
              <div 
                className="flex flex-col items-center justify-center gap-2 bg-surface-container-lowest border-2 border-primary/20 rounded-3xl p-6 w-full text-center relative overflow-hidden shadow-lg"
                style={{ marginTop: '50px', height: '220px' }}
              >
                <div className="absolute top-0 inset-x-0 h-1 bg-primary/20"></div>
                <span className="text-6xl drop-shadow-md">🏆</span>
                <span className="font-bebas text-sm text-on-surface-variant tracking-widest font-black mt-2">CAMPEÓN 2026</span>
                {champion ? (
                  <div className="flex flex-col items-center mt-2">
                    <img
                      src={`https://flagcdn.com/48x36/${champion.flag?.toLowerCase()}.png`}
                      alt={champion.name}
                      className="rounded border-2 border-primary w-12 h-9 object-cover shadow-md mb-2"
                    />
                    <span className="font-bebas text-3xl text-primary font-bold tracking-wider uppercase">
                      {champion.name}
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mt-3 bg-surface-container px-4 py-1.5 rounded-full border border-outline-variant">Por decidir</span>
                )}
              </div>

              <div style={{ marginTop: '90px' }} className="w-full flex flex-col gap-2 relative items-center">
                <p className="text-[10px] text-center text-primary uppercase font-black tracking-widest border border-primary/30 bg-primary/10 px-4 py-1 rounded-full">Gran Final</p>
                <div className="h-[90px] relative">
                  {renderMatchBox(bracket.final?.[0])}
                </div>
              </div>

              <div style={{ marginTop: '60px' }} className="w-full flex flex-col gap-2 relative items-center">
                <p className="text-[10px] text-center text-on-surface-variant uppercase font-black tracking-widest border border-outline-variant bg-surface-container px-4 py-1 rounded-full">3er Puesto</p>
                <div className="h-[90px] relative">
                  {renderMatchBox(bracket.third_place?.[0])}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}
          {rightRounds.map((round, rIdx) => {
            const matches = getRoundMatches(round.key, round.slice);
            const visualRoundIdx = 3 - rIdx;
            const { topMargin, gap } = getRoundLayout(visualRoundIdx);
            
            return (
              <div key={`right-${rIdx}`} className="flex flex-col items-center w-40 sm:w-44 shrink-0">
                <div className="text-center text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-6 h-6 flex items-center justify-center border-b border-outline-variant w-full pb-2">
                  {round.label}
                </div>
                <div className="flex flex-col flex-1" style={{ gap: `${gap}px` }}>
                  {matches.map((match: any, idx: number) => {
                    const isUpper = idx % 2 === 0;
                    return (
                      <div 
                        key={match.id} 
                        style={idx === 0 ? { marginTop: `${topMargin}px` } : {}}
                        className="flex items-center shrink-0 relative h-[90px]"
                      >
                        {renderMatchBox(match)}
                        {visualRoundIdx < 3 ? (
                          isUpper ? (
                            <div
                              className="absolute right-full top-1/2 border-t-2 border-l-2 border-outline-variant z-0 pointer-events-none rounded-tl-xl"
                              style={{ width: '20px', height: `${(H + gap) / 2}px` }}
                            />
                          ) : (
                            <div
                              className="absolute right-full bottom-1/2 border-b-2 border-l-2 border-outline-variant z-0 pointer-events-none rounded-bl-xl"
                              style={{ width: '20px', height: `${(H + gap) / 2}px` }}
                            />
                          )
                        ) : (
                          <div
                            className="absolute right-full top-1/2 -translate-y-1/2 w-5 h-0.5 bg-outline-variant z-0 pointer-events-none"
                            style={{ width: '40px' }}
                          />
                        )}
                        {visualRoundIdx > 0 && (
                          <div
                            className="absolute left-full top-1/2 -translate-y-1/2 w-5 h-0.5 bg-outline-variant z-0 pointer-events-none"
                            style={{ width: '20px' }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
    </>
  );

  const content = (
    <div 
      ref={containerRef}
      className={`bg-surface-container-low border border-outline-variant rounded-[2.5rem] p-4 sm:p-8 shadow-2xl relative flex flex-col w-full ${isFullscreen ? 'h-full' : ''}`}
    >
      <button 
        onClick={() => setIsFullscreen(!isFullscreen)}
        className="absolute top-4 right-4 z-50 bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface-variant p-2 rounded-lg shadow-sm transition-all"
        title={isFullscreen ? "Salir de pantalla completa" : "Ver en pantalla completa"}
      >
        {isFullscreen ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
        )}
      </button>

      <div className="flex items-center gap-2 mb-6 bg-surface-container-lowest px-4 py-2 rounded-xl border border-outline-variant max-w-fit mx-auto shadow-sm">
        <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse-soft"></span>
        <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">
          Árbol de Eliminatorias · Pantalla Completa Recomendada
        </span>
      </div>

      {isFullscreen ? (
        <div className="w-full flex-1 flex relative overflow-hidden pt-4 pb-8">
          <div className="flex-1 flex overflow-hidden items-center justify-center transition-all duration-500">
            <div 
              className={`w-full flex ${selectedMatch ? 'justify-start' : 'justify-center'} items-center`}
            >
              <div 
                className="flex items-stretch gap-2 sm:gap-6 lg:gap-10 min-w-fit transition-all duration-500 ease-in-out"
                style={{ zoom: scale, transformOrigin: 'top left' }}
              >
                {treeNodes}
              </div>
            </div>
          </div>

          {/* Prediction Panel inside the grey box for Fullscreen */}
          {selectedMatch && (
            <div className="w-[360px] xl:w-[420px] shrink-0 animate-slide-in-right overflow-y-auto no-scrollbar bg-surface-container-lowest border border-outline-variant rounded-3xl shadow-xl z-40 ml-4 h-full relative">
              <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/50 bg-surface-container/50 sticky top-0 z-10 backdrop-blur-md">
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest font-bebas flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse-soft"></span>
                  Análisis Predictivo
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); onMatchSelect(null); }}
                  className="text-on-surface-variant hover:text-primary transition-all w-6 h-6 flex items-center justify-center rounded-full hover:bg-surface-container-high"
                >
                  ✕
                </button>
              </div>
              <PredictionPanel selectedMatch={selectedMatch} liveScore={liveScore} layoutMode="fullscreen" />
            </div>
          )}
        </div>
      ) : (
        <div className="w-full overflow-x-auto custom-scrollbar pb-8 pt-4">
          <div className="flex items-stretch justify-center gap-6 sm:gap-10 min-w-fit px-4">
            {treeNodes}
          </div>
        </div>
      )}
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-surface-container-lowest overflow-hidden flex flex-col transition-all duration-500">
        <div className="w-full px-2 md:px-6 py-4 flex flex-col h-full max-h-screen">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h2 className="font-bebas text-4xl text-primary leading-none uppercase">Árbol de Fase Final</h2>
            <button 
              onClick={() => setIsFullscreen(false)}
              className="bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface-variant px-4 py-2 rounded-lg shadow-sm transition-all text-xs font-bold uppercase tracking-widest flex items-center gap-2 z-50"
            >
              <span>Cerrar</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          
          <div className="flex-1 min-h-0 relative w-full flex">
            {content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-10">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="font-bebas text-5xl text-primary leading-none uppercase">Fase Final</h2>
        <p className="text-on-surface-variant text-sm mt-1">Simulación interactiva hacia el campeonato en Nueva York</p>
      </div>
      {content}
    </section>
  );
}
