import React from 'react';

interface TournamentBracketProps {
  bracket: any;
  onMatchSelect: (match: any) => void;
  selectedMatchId?: string | null;
  onAdvanceTeam: (matchId: string, winnerName: string, winnerFlag: string, loserName: string, loserFlag: string) => void;
  onBracketScoreChange?: (matchId: string, team: 'a' | 'b', score: string) => void;
}

export default function TournamentBracket({ 
  bracket, 
  onMatchSelect, 
  selectedMatchId, 
  onAdvanceTeam,
  onBracketScoreChange 
}: TournamentBracketProps) {
  
  if (!bracket) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="w-14 h-14 border-4 border-fifa-primary border-t-transparent rounded-full animate-spin shadow-[0_0_15px_#ea580c]"></div>
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

  const renderMatchBox = (match: any, compact: boolean = true) => {
    const sa = match.score_a;
    const sb = match.score_b;
    const hasScore = sa !== null && sb !== null;
    const isSelected = match.id === selectedMatchId;

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

    const renderTeam = (
      name: string,
      flag: string,
      isWinner: boolean,
      score: number | null,
      side: 'a' | 'b'
    ) => {
      const tdbd = isTbd(name);

      return (
        <div
          onClick={(e) => bothDefined && handleTeamClick(e, match, side)}
          className={`flex items-center justify-between px-2.5 py-1.5 rounded-md transition-all duration-300 ${
            bothDefined
              ? 'cursor-pointer hover:bg-fifa-accent/20 group/team'
              : ''
          } ${isWinner ? 'bg-fifa-accent/15 border-l-2 border-fifa-accent' : 'border-l-2 border-transparent'}`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {tdbd ? (
              <div className="w-5 h-3.5 bg-white/5 rounded-sm shrink-0 flex items-center justify-center text-[7px] text-fifa-muted font-bold border border-white/10">?</div>
            ) : (
              <img
                src={`https://flagcdn.com/16x12/${flag?.toLowerCase() || 'un'}.png`}
                alt={name}
                className="rounded-sm border border-white/10 w-5 h-3.5 object-cover shrink-0 shadow-sm"
                onError={(e) => { e.currentTarget.src = 'https://flagcdn.com/16x12/un.png'; }}
              />
            )}
            <span className={`text-[11px] truncate font-semibold max-w-[85px] ${
              tdbd ? 'text-fifa-muted italic' :
              isWinner ? 'text-fifa-accent font-bold' : 'text-white/90'
            } ${bothDefined ? 'group-hover/team:text-fifa-accent' : ''}`}>
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
                onChange={(e) => onBracketScoreChange?.(match.id, side, e.target.value)}
                className={`w-7 h-7 rounded bg-black/60 border ${isWinner ? 'border-fifa-accent/50 text-fifa-accent' : 'border-white/10 text-white'} text-center text-[11px] font-bold focus:border-fifa-accent outline-none focus:ring-1 focus:ring-fifa-accent/30 transition-all shadow-inner`}
              />
            ) : (
              <span className="text-[10px] text-white/20 font-bold px-1.5">–</span>
            )}
          </div>
        </div>
      );
    };

    return (
      <div
        onClick={() => onMatchSelect(match)}
        className={`glass-panel glass-panel-hover tilt-card border rounded-2xl flex flex-col justify-center transition-all cursor-pointer select-none w-44 h-[90px] p-2 relative z-10 ${
          isSelected
            ? 'border-fifa-accent/60 shadow-[0_0_20px_rgba(249,115,22,0.25)] bg-fifa-accent/10'
            : bothDefined && !hasScore
            ? 'border-white/10 hover:border-fifa-primary/50'
            : hasScore
            ? 'border-fifa-success/30 bg-fifa-success/5'
            : 'border-white/5 opacity-50'
        }`}
      >
        {/* Date / Info */}
        <div className="text-[8px] text-fifa-muted/80 font-bold border-b border-white/5 pb-1 mb-1.5 flex justify-between items-center tracking-widest uppercase px-1">
          <span className="text-fifa-secondary/80">{formatMatchId(match.id)}</span>
          <span className="opacity-70">{match.date}</span>
        </div>

        {/* Teams */}
        <div className="flex flex-col gap-0.5">
          {renderTeam(match.team_a, match.flag_a, winnerA, sa, 'a')}
          {renderTeam(match.team_b, match.flag_b, winnerB, sb, 'b')}
        </div>

        {/* Penalty badge */}
        {hasScore && sa === sb && match.penalty_winner && (
          <div className="absolute -top-2 -right-2 text-[7px] text-center bg-[#1e293b] text-fifa-accent font-black px-2 py-0.5 rounded-full border border-fifa-accent/30 uppercase tracking-widest shadow-md">
            Pen: {match.penalties_score || (match.penalty_winner === match.team_a ? "5-4" : "4-5")} ({match.penalty_winner.substring(0, 3)})
          </div>
        )}
      </div>
    );
  };

  const getChampion = () => {
    const match = bracket.final[0];
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

  // Strict vertical layout logic: H is fixed to 90px (same as MatchBox h-[90px])
  const H = 90; 
  const getRoundLayout = (roundIndex: number) => {
    const G0 = 16; // Base gap
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

  return (
    <div className="w-full relative font-rajdhani bg-[#0b0f17]/40 rounded-3xl p-4 border border-white/5 shadow-2xl">
      {/* Instruction hint */}
      <div className="flex items-center gap-2 mb-6 bg-black/40 px-4 py-2 rounded-xl border border-white/5 max-w-fit mx-auto shadow-inner">
        <span className="inline-block w-2 h-2 rounded-full bg-fifa-secondary animate-pulse shadow-[0_0_8px_#0ea5e9]"></span>
        <span className="text-[11px] text-fifa-muted font-bold uppercase tracking-widest">
          Modifica marcadores libremente · El ganador avanza automáticamente · Click para simulación IA
        </span>
      </div>

      {/* Bracket layout */}
      <div className="w-full overflow-x-auto custom-scrollbar pb-8 pt-4">
        <div className="flex items-stretch justify-center gap-10 min-w-fit px-4">

          {/* LEFT SIDE — rounds flowing left to right */}
          {leftRounds.map((round, rIdx) => {
            const matches = getRoundMatches(round.key, round.slice);
            const { topMargin, gap } = getRoundLayout(rIdx);
            
            return (
              <div key={`left-${rIdx}`} className="flex flex-col items-center w-44 shrink-0">
                {/* Column header */}
                <div className="text-center text-[11px] font-bold text-white uppercase tracking-widest mb-6 h-6 flex items-center justify-center border-b border-fifa-accent/30 w-full pb-2 shadow-[0_4px_10px_-4px_rgba(249,115,22,0.1)]">
                  {round.label}
                </div>
                
                {/* Matches */}
                <div className="flex flex-col flex-1" style={{ gap: `${gap}px` }}>
                  {matches.map((match: any, idx: number) => {
                    const isUpper = idx % 2 === 0;
                    return (
                      <div 
                        key={match.id} 
                        style={idx === 0 ? { marginTop: `${topMargin}px` } : {}}
                        className="flex items-center shrink-0 relative h-[90px]"
                      >
                        {renderMatchBox(match, true)}
                        
                        {/* Connector logic */}
                        {rIdx < leftRounds.length - 1 ? (
                          isUpper ? (
                            <div
                              className="absolute left-full top-1/2 border-t-2 border-r-2 border-white/10 z-0 pointer-events-none rounded-tr-xl"
                              style={{
                                width: '20px',
                                height: `${(H + gap) / 2}px`,
                                borderColor: 'rgba(255,255,255,0.15)',
                              }}
                            />
                          ) : (
                            <div
                              className="absolute left-full bottom-1/2 border-b-2 border-r-2 border-white/10 z-0 pointer-events-none rounded-br-xl"
                              style={{
                                width: '20px',
                                height: `${(H + gap) / 2}px`,
                                borderColor: 'rgba(255,255,255,0.15)',
                              }}
                            />
                          )
                        ) : (
                          /* Semis straight connector to Final */
                          <div
                            className="absolute left-full top-1/2 -translate-y-1/2 w-5 h-0.5 bg-white/15 z-0 pointer-events-none"
                            style={{ width: '40px' }}
                          />
                        )}

                        {/* Incoming connector */}
                        {rIdx > 0 && (
                          <div
                            className="absolute right-full top-1/2 -translate-y-1/2 w-5 h-0.5 bg-white/15 z-0 pointer-events-none"
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

          {/* CENTER — Final + Trophy */}
          <div className="flex flex-col items-center justify-start w-64 shrink-0">
            {/* Column header */}
            <div className="text-center text-[11px] font-black text-fifa-accent uppercase tracking-widest mb-6 h-6 flex items-center justify-center border-b border-fifa-accent/50 w-full pb-2 shadow-[0_4px_15px_-4px_rgba(249,115,22,0.3)]">
              LA GRAN FINAL
            </div>
            
            <div className="flex flex-col w-full h-full relative" style={{ minHeight: `${8 * 106}px` }}>
              {/* Champion Card */}
              <div 
                className="flex flex-col items-center justify-center gap-2 glass-panel border rounded-3xl p-6 w-full text-center relative overflow-hidden animate-bounce-slow"
                style={{ 
                  marginTop: '50px', 
                  height: '220px',
                  background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(15, 23, 42, 0.8) 100%)',
                  borderColor: 'rgba(251, 191, 36, 0.4)',
                  boxShadow: '0 15px 50px -10px rgba(251, 191, 36, 0.25)'
                }}
              >
                {/* Gold top glow */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-yellow-500 via-amber-300 to-yellow-500 shadow-[0_0_20px_#fcd34d]"></div>
                
                <span className="text-6xl filter drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]">🏆</span>
                <span className="font-bebas text-sm text-amber-400 tracking-widest font-black mt-2">CAMPEÓN MUNDIAL 2026</span>
                {champion ? (
                  <div className="flex flex-col items-center mt-2">
                    <img
                      src={`https://flagcdn.com/32x24/${champion.flag?.toLowerCase()}.png`}
                      alt={champion.name}
                      className="rounded border-2 border-amber-400 w-10 h-7 object-cover shadow-[0_0_20px_rgba(251,191,36,0.5)] mb-2"
                      onError={(e) => { e.currentTarget.src = 'https://flagcdn.com/32x24/un.png'; }}
                    />
                    <span className="font-bebas text-2xl text-white font-bold tracking-wider uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
                      {champion.name}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-fifa-muted uppercase tracking-widest font-bold mt-3 bg-black/40 px-4 py-1.5 rounded-full border border-white/10">Por decidir</span>
                )}
              </div>

              {/* Gran Final */}
              <div style={{ marginTop: '90px' }} className="w-full flex flex-col gap-2 relative items-center">
                <p className="text-[10px] text-center text-white/80 uppercase font-black tracking-widest border border-fifa-accent/30 bg-fifa-accent/10 px-4 py-1 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.2)]">Gran Final</p>
                <div className="h-[90px] relative">
                  {renderMatchBox(bracket.final[0], true)}
                </div>
              </div>

              {/* 3er Lugar */}
              <div style={{ marginTop: '60px' }} className="w-full flex flex-col gap-2 relative items-center">
                <p className="text-[10px] text-center text-white/60 uppercase font-black tracking-widest border border-white/10 bg-white/5 px-4 py-1 rounded-full">3er Puesto</p>
                <div className="h-[90px] relative">
                  {renderMatchBox(bracket.third_place[0], true)}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE — rounds flowing right to left */}
          {rightRounds.map((round, rIdx) => {
            const matches = getRoundMatches(round.key, round.slice);
            const visualRoundIdx = 3 - rIdx;
            const { topMargin, gap } = getRoundLayout(visualRoundIdx);
            
            return (
              <div key={`right-${rIdx}`} className="flex flex-col items-center w-44 shrink-0">
                {/* Column header */}
                <div className="text-center text-[11px] font-bold text-white uppercase tracking-widest mb-6 h-6 flex items-center justify-center border-b border-fifa-accent/30 w-full pb-2 shadow-[0_4px_10px_-4px_rgba(249,115,22,0.1)]">
                  {round.label}
                </div>
                
                {/* Matches */}
                <div className="flex flex-col flex-1" style={{ gap: `${gap}px` }}>
                  {matches.map((match: any, idx: number) => {
                    const isUpper = idx % 2 === 0;
                    return (
                      <div 
                        key={match.id} 
                        style={idx === 0 ? { marginTop: `${topMargin}px` } : {}}
                        className="flex items-center shrink-0 relative h-[90px]"
                      >
                        {renderMatchBox(match, true)}
                        
                        {/* Connector logic */}
                        {visualRoundIdx < 3 ? (
                          isUpper ? (
                            <div
                              className="absolute right-full top-1/2 border-t-2 border-l-2 border-white/10 z-0 pointer-events-none rounded-tl-xl"
                              style={{
                                width: '20px',
                                height: `${(H + gap) / 2}px`,
                                borderColor: 'rgba(255,255,255,0.15)',
                              }}
                            />
                          ) : (
                            <div
                              className="absolute right-full bottom-1/2 border-b-2 border-l-2 border-white/10 z-0 pointer-events-none rounded-bl-xl"
                              style={{
                                width: '20px',
                                height: `${(H + gap) / 2}px`,
                                borderColor: 'rgba(255,255,255,0.15)',
                              }}
                            />
                          )
                        ) : (
                          /* Semis straight connector to Final on the left */
                          <div
                            className="absolute right-full top-1/2 -translate-y-1/2 w-5 h-0.5 bg-white/15 z-0 pointer-events-none"
                            style={{ width: '40px' }}
                          />
                        )}

                        {/* Incoming connector line */}
                        {visualRoundIdx > 0 && (
                          <div
                            className="absolute left-full top-1/2 -translate-y-1/2 w-5 h-0.5 bg-white/15 z-0 pointer-events-none"
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

        </div>
      </div>
    </div>
  );
}
