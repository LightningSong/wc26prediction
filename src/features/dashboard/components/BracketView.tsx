import React from 'react';

interface BracketViewProps {
  bracket: any;
  onAdvanceTeam: (matchId: string, winnerName: string, winnerFlag: string, loserName: string, loserFlag: string) => void;
  onBracketScoreChange: (matchId: string, team: 'a' | 'b', score: string) => void;
  onMatchSelect: (match: any) => void;
  selectedMatchId?: string;
}

export default function BracketView({ bracket, onAdvanceTeam, onBracketScoreChange, onMatchSelect, selectedMatchId }: BracketViewProps) {
  if (!bracket) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isTbd = (name: string) => !name || name === 'A definir' || name.startsWith('1°') || name.startsWith('2°') || name.startsWith('3°');

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

  const MatchBox = ({ match }: { match: any }) => {
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

    const renderTeam = (name: string, flag: string, isWinner: boolean, score: number | null, side: 'a' | 'b') => {
      const tdbd = isTbd(name);
      return (
        <div
          onClick={(e) => bothDefined && handleTeamClick(e, match, side)}
          className={`flex items-center justify-between p-1 rounded transition-all ${
            bothDefined ? 'cursor-pointer hover:bg-surface-container-high' : ''
          } ${isWinner ? 'bg-primary/5 border-l-2 border-primary' : 'border-l-2 border-transparent'}`}
        >
          <div className="flex items-center gap-2">
            {tdbd ? (
              <div className="w-5 h-3.5 bg-surface-container rounded-sm border border-outline-variant flex items-center justify-center text-[8px] text-on-surface-variant font-bold">?</div>
            ) : (
              <img src={`https://flagcdn.com/16x12/${flag?.toLowerCase() || 'un'}.png`} alt={name} className="w-5 h-3.5 rounded-sm object-cover border border-outline-variant" />
            )}
            <span className={`text-xs font-semibold truncate max-w-[80px] ${tdbd ? 'text-on-surface-variant italic' : isWinner ? 'text-primary' : 'text-on-surface'}`}>{name}</span>
          </div>
          {bothDefined ? (
            <input
              type="number"
              min="0"
              placeholder="-"
              value={score !== null ? score : ""}
              onChange={(e) => onBracketScoreChange(match.id, side, e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="w-8 h-6 rounded bg-surface-container text-center text-xs font-bold outline-none focus:ring-1 focus:ring-primary border border-outline-variant/50"
            />
          ) : (
            <span className="text-xs text-on-surface-variant px-2">-</span>
          )}
        </div>
      );
    };

    return (
      <div
        onClick={() => onMatchSelect(match)}
        className={`bg-surface-container-lowest border ${
          isSelected 
            ? 'border-primary shadow-[0_0_15px_rgba(37,99,235,0.2)]'
            : hasScore 
              ? 'border-green-500/50' 
              : 'border-outline-variant'
        } p-2 rounded-xl flex flex-col gap-1 w-full relative group hover:border-primary/50 transition-all cursor-pointer`}
      >
        <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-on-surface-variant mb-1 px-1">
          <span>{match.id.replace('_', ' #')}</span>
          <span>{match.date}</span>
        </div>
        {renderTeam(match.team_a, match.flag_a, winnerA, sa, 'a')}
        {renderTeam(match.team_b, match.flag_b, winnerB, sb, 'b')}
        {hasScore && sa === sb && match.penalty_winner && (
          <div className="absolute -top-2 -right-2 text-[8px] bg-primary text-white font-black px-2 py-0.5 rounded-full uppercase shadow-md">
            Pen: {match.penalty_winner.substring(0,3)}
          </div>
        )}
      </div>
    );
  };

  const roundsData = [
    { name: "16avos de Final", data: bracket.round_of_32 },
    { name: "Octavos de Final", data: bracket.round_of_16 },
    { name: "Cuartos de Final", data: bracket.quarter_finals },
    { name: "Semifinales", data: bracket.semis },
    { name: "Final", data: bracket.final },
  ];

  return (
    <section className="space-y-10">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="font-bebas text-5xl text-primary leading-none">Fase Final</h2>
        <p className="text-on-surface-variant text-sm mt-1">Simulación interactiva hacia el campeonato en Nueva York</p>
      </div>

      <div className="bg-surface-container-low rounded-3xl p-8 md:p-12 relative overflow-hidden text-center border border-outline-variant shadow-sm">
        <div className="relative z-10">
          <span className="text-[10px] font-bold tracking-[0.3em] text-on-surface-variant uppercase mb-4 block">🏆 Gran Campeón</span>
          <div className="flex flex-col items-center justify-center gap-4">
            {champion ? (
              <>
                <img src={`https://flagcdn.com/108x81/${champion.flag?.toLowerCase()}.png`} alt={champion.name} className="w-32 h-24 rounded-lg object-cover shadow-xl border-4 border-primary" />
                <span className="font-bebas text-5xl md:text-6xl text-primary drop-shadow-md">{champion.name}</span>
              </>
            ) : (
              <span className="font-bebas text-3xl md:text-5xl text-on-surface-variant/40">Por Definir</span>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto pb-6 custom-scrollbar">
        <div className="min-w-[1200px] flex gap-4">
          {roundsData.map((round, rIndex) => (
            <div key={rIndex} className="flex flex-col gap-6 flex-1 min-w-[240px]">
              <div className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant px-4 text-center border-b border-outline-variant pb-2">
                {round.name}
              </div>
              <div className="flex flex-col flex-1 justify-around gap-4">
                {round.data?.map((m: any, mIndex: number) => (
                  <MatchBox key={m.id} match={m} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
