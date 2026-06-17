import React, { useState, useEffect } from 'react';

export default function SimulationModal({ match, onClose, onApplyResult, isKnockout = false }: { match: any; onClose: () => void; onApplyResult: (scoreA: number, scoreB: number, penaltyWinner: string | null) => void; isKnockout?: boolean }) {
  const [loading, setLoading] = useState(true);
  const [prediction, setPrediction] = useState<any>(null);
  
  // Custom interactive score states
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [penaltyWinner, setPenaltyWinner] = useState<string | null>(null);

  useEffect(() => {
    const teamA = match.team_a === "A definir" ? "Argentina" : match.team_a;
    const teamB = match.team_b === "A definir" ? "Brasil" : match.team_b;

    fetch(`/api/predict/${encodeURIComponent(teamA)}/${encodeURIComponent(teamB)}`)
      .then(res => res.json())
      .then(data => {
        setPrediction(data);
        
        // Default score to the most probable one from top_10_matrix
        if (data.top_10_matrix && data.top_10_matrix.length > 0) {
          const topScore = data.top_10_matrix[0].score; // e.g. "1-0" or "0-0"
          const parts = topScore.split('-');
          const sa = parseInt(parts[0], 10);
          const sb = parseInt(parts[1], 10);
          setScoreA(sa);
          setScoreB(sb);
          
          if (sa === sb) {
            // Set penalty winner to team A by default if drawn in knockout
            setPenaltyWinner(match.team_a);
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [match]);

  const selectSuggestedScore = (scoreStr: string) => {
    const parts = scoreStr.split('-');
    const sa = parseInt(parts[0], 10);
    const sb = parseInt(parts[1], 10);
    setScoreA(sa);
    setScoreB(sb);
    if (sa === sb) {
      setPenaltyWinner(match.team_a);
    } else {
      setPenaltyWinner(null);
    }
  };

  const handleIncrementA = () => {
    setScoreA(prev => {
      const next = prev + 1;
      if (next !== scoreB) setPenaltyWinner(null);
      else setPenaltyWinner(match.team_a);
      return next;
    });
  };

  const handleDecrementA = () => {
    setScoreA(prev => {
      const next = Math.max(0, prev - 1);
      if (next !== scoreB) setPenaltyWinner(null);
      else setPenaltyWinner(match.team_a);
      return next;
    });
  };

  const handleIncrementB = () => {
    setScoreB(prev => {
      const next = prev + 1;
      if (scoreA !== next) setPenaltyWinner(null);
      else setPenaltyWinner(match.team_a);
      return next;
    });
  };

  const handleDecrementB = () => {
    setScoreB(prev => {
      const next = Math.max(0, prev - 1);
      if (scoreA !== next) setPenaltyWinner(null);
      else setPenaltyWinner(match.team_a);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="glass-panel border border-fifa-border rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] max-w-2xl w-full p-8 relative overflow-hidden">
        
        {/* Glow effect */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-fifa-primary/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-fifa-secondary/20 rounded-full blur-3xl pointer-events-none"></div>

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-fifa-muted hover:text-white transition-colors text-2xl font-light"
        >
          ✕
        </button>
        
        <h2 className="text-2xl font-bold font-bebas tracking-wide mb-6 text-transparent bg-clip-text bg-gradient-to-r from-fifa-primary to-fifa-secondary border-b border-fifa-border/50 pb-4">
          SIMULACIÓN PREDICTIVA CON IA
        </h2>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-14 h-14 border-4 border-fifa-primary border-t-fifa-secondary rounded-full animate-spin mb-6"></div>
            <p className="text-fifa-muted font-rajdhani text-lg animate-pulse">Analizando 100,000 simulaciones de Monte Carlo...</p>
          </div>
        ) : (
          <div className="space-y-6 text-white font-rajdhani">
            {/* H2H and details */}
            <div className="flex justify-between items-center text-center">
              <div className="flex-1 flex flex-col items-center">
                <img 
                  src={`https://flagcdn.com/48x36/${match.flag_a?.toLowerCase()}.png`} 
                  alt={match.team_a} 
                  className="rounded shadow-md border border-fifa-border w-14 h-10 object-cover mb-2"
                  onError={(e) => { e.currentTarget.src = "https://flagcdn.com/48x36/un.png" }}
                />
                <span className="font-bold text-lg">{match.team_a}</span>
                <span className="text-xs text-fifa-muted">Fifa Rank #{prediction?.xg_a ? Math.max(1, Math.round(30 - prediction.xg_a * 8)) : '--'}</span>
              </div>

              <div className="px-4 py-1 bg-fifa-panel border border-fifa-border rounded-full text-xs font-bold uppercase tracking-wider text-fifa-accent">
                VS
              </div>

              <div className="flex-1 flex flex-col items-center">
                <img 
                  src={`https://flagcdn.com/48x36/${match.flag_b?.toLowerCase()}.png`} 
                  alt={match.team_b} 
                  className="rounded shadow-md border border-fifa-border w-14 h-10 object-cover mb-2"
                  onError={(e) => { e.currentTarget.src = "https://flagcdn.com/48x36/un.png" }}
                />
                <span className="font-bold text-lg">{match.team_b}</span>
                <span className="text-xs text-fifa-muted">Fifa Rank #{prediction?.xg_b ? Math.max(1, Math.round(30 - prediction.xg_b * 8)) : '--'}</span>
              </div>
            </div>

            {/* Monte Carlo probabilities bar */}
            <div className="bg-fifa-panel/60 p-4 rounded-xl border border-fifa-border/80">
              <div className="flex justify-between text-xs text-fifa-muted mb-2 font-semibold">
                <span>PROBABILIDAD DE VICTORIA</span>
                <span>MONTE CARLO (100k RUNS)</span>
              </div>
              <div className="flex w-full h-4 rounded-full overflow-hidden bg-fifa-border">
                <div 
                  style={{ width: `${prediction.global_probabilities.win_a}%` }} 
                  className="bg-gradient-to-r from-pink-600 to-fifa-primary flex items-center justify-center text-[10px] font-bold"
                  title={`Gana ${match.team_a}`}
                >
                  {prediction.global_probabilities.win_a > 15 && `${prediction.global_probabilities.win_a.toFixed(0)}%`}
                </div>
                <div 
                  style={{ width: `${prediction.global_probabilities.draw}%` }} 
                  className="bg-fifa-muted flex items-center justify-center text-[10px] font-bold text-gray-900"
                  title="Empate"
                >
                  {prediction.global_probabilities.draw > 15 && `${prediction.global_probabilities.draw.toFixed(0)}%`}
                </div>
                <div 
                  style={{ width: `${prediction.global_probabilities.win_b}%` }} 
                  className="bg-gradient-to-r from-fifa-secondary to-cyan-600 flex items-center justify-center text-[10px] font-bold"
                  title={`Gana ${match.team_b}`}
                >
                  {prediction.global_probabilities.win_b > 15 && `${prediction.global_probabilities.win_b.toFixed(0)}%`}
                </div>
              </div>
              <div className="flex justify-between text-xs mt-2 text-fifa-muted">
                <span>{match.team_a}: {prediction.global_probabilities.win_a.toFixed(1)}%</span>
                <span>Empate: {prediction.global_probabilities.draw.toFixed(1)}%</span>
                <span>{match.team_b}: {prediction.global_probabilities.win_b.toFixed(1)}%</span>
              </div>
            </div>

            {/* xG expected goals */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-fifa-panel/40 border border-fifa-border/60 p-3 rounded-lg text-center">
                <span className="text-xs text-fifa-muted uppercase">Goles Esperados (xG)</span>
                <div className="text-xl font-bold text-fifa-primary font-bebas mt-1">{prediction.xg_a.toFixed(2)}</div>
              </div>
              <div className="bg-fifa-panel/40 border border-fifa-border/60 p-3 rounded-lg text-center">
                <span className="text-xs text-fifa-muted uppercase">Goles Esperados (xG)</span>
                <div className="text-xl font-bold text-fifa-secondary font-bebas mt-1">{prediction.xg_b.toFixed(2)}</div>
              </div>
            </div>

            {/* Interactive Score Selector */}
            <div className="bg-fifa-panel border border-fifa-border rounded-xl p-4">
              <h3 className="text-sm font-semibold text-fifa-accent mb-3 text-center uppercase tracking-wider">Ajustar Marcador</h3>
              
              <div className="flex items-center justify-center gap-8 py-2">
                {/* Team A score editor */}
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleDecrementA}
                    className="w-8 h-8 rounded-full border border-fifa-border hover:border-fifa-primary flex items-center justify-center font-bold hover:bg-fifa-primary/20 transition-all"
                  >
                    -
                  </button>
                  <span className="text-4xl font-bold font-bebas w-8 text-center">{scoreA}</span>
                  <button 
                    onClick={handleIncrementA}
                    className="w-8 h-8 rounded-full border border-fifa-border hover:border-fifa-primary flex items-center justify-center font-bold hover:bg-fifa-primary/20 transition-all"
                  >
                    +
                  </button>
                </div>

                <span className="text-2xl text-fifa-muted font-light font-bebas">:</span>

                {/* Team B score editor */}
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleDecrementB}
                    className="w-8 h-8 rounded-full border border-fifa-border hover:border-fifa-secondary flex items-center justify-center font-bold hover:bg-fifa-secondary/20 transition-all"
                  >
                    -
                  </button>
                  <span className="text-4xl font-bold font-bebas w-8 text-center">{scoreB}</span>
                  <button 
                    onClick={handleIncrementB}
                    className="w-8 h-8 rounded-full border border-fifa-border hover:border-fifa-secondary flex items-center justify-center font-bold hover:bg-fifa-secondary/20 transition-all"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Penalty shootout tiebreaker for knockout */}
              {isKnockout && scoreA === scoreB && (
                <div className="mt-4 border-t border-fifa-border/50 pt-4 text-center">
                  <p className="text-xs text-fifa-muted mb-2 font-semibold uppercase">Empate en eliminatoria. Elige al ganador de penales:</p>
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => setPenaltyWinner(match.team_a)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                        penaltyWinner === match.team_a
                          ? "bg-fifa-primary border-fifa-primary text-white shadow-md shadow-fifa-primary/30"
                          : "border-fifa-border text-fifa-muted hover:text-white"
                      }`}
                    >
                      {match.team_a}
                    </button>
                    <button
                      onClick={() => setPenaltyWinner(match.team_b)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                        penaltyWinner === match.team_b
                          ? "bg-fifa-secondary border-fifa-secondary text-white shadow-md shadow-fifa-secondary/30"
                          : "border-fifa-border text-fifa-muted hover:text-white"
                      }`}
                    >
                      {match.team_b}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Suggested Top 5 scorelines */}
            <div>
              <h3 className="text-xs text-fifa-muted uppercase tracking-wider mb-2 font-semibold">Predicciones de marcador más probables (Poisson):</h3>
              <div className="grid grid-cols-5 gap-2">
                {prediction.top_10_matrix.slice(0, 5).map((m: any, idx: number) => {
                  const isActive = `${scoreA}-${scoreB}` === m.score;
                  return (
                    <button 
                      key={idx} 
                      onClick={() => selectSuggestedScore(m.score)}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        isActive 
                          ? 'bg-fifa-primary/20 border-fifa-primary shadow-md shadow-fifa-primary/10' 
                          : 'bg-fifa-panel/60 border-fifa-border/60 hover:bg-fifa-panel-hover'
                      }`}
                    >
                      <div className="font-bold text-lg font-bebas">{m.score}</div>
                      <div className="text-[10px] text-fifa-muted">{m.prob.toFixed(1)}%</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-4 mt-8 pt-4 border-t border-fifa-border/50">
              <button 
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-fifa-panel hover:bg-fifa-panel-hover border border-fifa-border text-white text-sm font-semibold transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={() => onApplyResult(scoreA, scoreB, penaltyWinner)}
                className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-fifa-primary to-pink-600 text-white font-bold text-sm hover:shadow-[0_0_20px_rgba(255,0,127,0.4)] transition-all cursor-pointer"
              >
                Aplicar Resultado ({scoreA} - {scoreB} {isKnockout && scoreA === scoreB ? `(Pen: ${penaltyWinner})` : ''})
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
