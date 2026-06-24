"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import MatchesWidget from "@/features/matches/components/MatchesWidget";
import GroupStandings from "@/features/matches/components/GroupStandings";
import TournamentBracket from "@/features/simulations/components/TournamentBracket";
import PredictionPanel from "@/features/predictions/components/PredictionPanel";
import gsap from "gsap";

const LOCAL_STORAGE_KEY = "wc26_tournament_state_v7";

export default function TournamentDashboard() {
  const [activeTab, setActiveTab] = useState("grupos");
  const [matchesData, setMatchesData] = useState<any[]>([]);
  const [groupsData, setGroupsData] = useState<any[]>([]);
  const [bracketData, setBracketData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  const tabContentRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadInitialState();
  }, []);

  // GSAP tab switch animation
  useEffect(() => {
    if (tabContentRef.current) {
      gsap.fromTo(tabContentRef.current,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", overwrite: "auto" }
      );
    }
  }, [activeTab]);

  // GSAP sidebar entry/exit animation
  useEffect(() => {
    if (sidebarRef.current) {
      if (showPanel) {
        gsap.fromTo(sidebarRef.current,
          { opacity: 0, x: 30, scale: 0.95 },
          { opacity: 1, x: 0, scale: 1, duration: 0.45, ease: "back.out(1.2)", overwrite: "auto" }
        );
      }
    }
  }, [showPanel, selectedMatch]);

  const loadInitialState = async () => {
    try {
      setLoading(true);
      const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);

      if (savedState) {
        const parsed = JSON.parse(savedState);
        setMatchesData(parsed.matches);
        setGroupsData(parsed.groups);
        setBracketData(parsed.bracket);
        setLoading(false);
      } else {
        const [matchesRes, groupsRes, bracketRes] = await Promise.all([
          fetch("/api/matches/today"),
          fetch("/api/groups"),
          fetch("/api/bracket"),
        ]);

        if (!matchesRes.ok || !groupsRes.ok || !bracketRes.ok) {
          throw new Error("Error al conectar con el servidor. Asegúrate de que el backend Flask está activo.");
        }

        const matchesJson = await matchesRes.json();
        const groupsJson = await groupsRes.json();
        const bracketJson = await bracketRes.json();

        // Initialize bracket with placeholders and completed group winners
        const initialBracket = updateBracketFromGroupStandings(groupsJson.groups, bracketJson.bracket, matchesJson.matches);

        setMatchesData(matchesJson.matches);
        setGroupsData(groupsJson.groups);
        setBracketData(initialBracket);

        const stateToSave = {
          matches: matchesJson.matches,
          groups: groupsJson.groups,
          bracket: initialBracket,
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Error loading tournament state:", err);
      setLoading(false);
    }
  };

  const isTbd = (name: string) => !name || name === 'A definir' || name.startsWith('1°') || name.startsWith('2°') || name.startsWith('3°');

  // Propagate all bracket winners downstream from scores and manually selected penalty winners
  const propagateBracketChanges = useCallback((bracket: any) => {
    if (!bracket) return bracket;
    const newBracket = JSON.parse(JSON.stringify(bracket));
    const roundsKeys = ["round_of_32", "round_of_16", "quarter_finals", "semis", "final"];
    
    for (let r = 0; r < roundsKeys.length - 1; r++) {
      const currentRoundKey = roundsKeys[r];
      const nextRoundKey = roundsKeys[r + 1];
      const currentMatches = newBracket[currentRoundKey];
      
      currentMatches.forEach((m: any) => {
        const nextMatchId = m.next_match;
        const slot = m.slot;
        if (!nextMatchId || !slot) return;
        
        const nextMatch = newBracket[nextRoundKey].find((nm: any) => nm.id === nextMatchId);
        if (!nextMatch) return;
        
        if (nextMatch.score_a !== null && nextMatch.score_b !== null) {
          return;
        }

        let winnerName = "A definir";
        let winnerFlag = "un";
        
        const sa = m.score_a;
        const sb = m.score_b;
        const hasScore = sa !== null && sb !== null;
        
        const bothDefined = !isTbd(m.team_a) && !isTbd(m.team_b);
        
        if (bothDefined) {
          if (hasScore) {
            if (sa > sb) { winnerName = m.team_a; winnerFlag = m.flag_a; }
            else if (sb > sa) { winnerName = m.team_b; winnerFlag = m.flag_b; }
            else if (m.penalty_winner) {
              winnerName = m.penalty_winner;
              winnerFlag = m.penalty_winner === m.team_a ? m.flag_a : m.flag_b;
            }
          } else if (m.penalty_winner) {
            winnerName = m.penalty_winner;
            winnerFlag = m.penalty_winner === m.team_a ? m.flag_a : m.flag_b;
          }
        }
        
        const currentSlotTeam = nextMatch[slot];
        if (currentSlotTeam !== winnerName) {
          nextMatch[slot] = winnerName;
          nextMatch[slot === 'team_a' ? 'flag_a' : 'flag_b'] = winnerFlag;
          nextMatch.score_a = null;
          nextMatch.score_b = null;
          nextMatch.penalty_winner = null;
        }
      });
    }
    
    // Semis to final/3rd place propagation
    const sf1 = newBracket.semis.find((m: any) => m.id === "sf_1");
    const sf2 = newBracket.semis.find((m: any) => m.id === "sf_2");
    const granFinal = newBracket.final[0];
    const thirdPlace = newBracket.third_place[0];
    
    const getMatchWinnerAndLoser = (m: any) => {
      if (!m || isTbd(m.team_a) || isTbd(m.team_b)) {
        return { winner: "A definir", wFlag: "un", loser: "A definir", lFlag: "un" };
      }
      const sa = m.score_a;
      const sb = m.score_b;
      const hasScore = sa !== null && sb !== null;
      
      let winnerName = "A definir";
      let winnerFlag = "un";
      let loserName = "A definir";
      let loserFlag = "un";
      
      if (hasScore) {
        if (sa > sb) {
          winnerName = m.team_a; winnerFlag = m.flag_a;
          loserName = m.team_b; loserFlag = m.flag_b;
        } else if (sb > sa) {
          winnerName = m.team_b; winnerFlag = m.flag_b;
          loserName = m.team_a; loserFlag = m.flag_a;
        } else if (m.penalty_winner) {
          winnerName = m.penalty_winner;
          winnerFlag = m.penalty_winner === m.team_a ? m.flag_a : m.flag_b;
          loserName = m.penalty_winner === m.team_a ? m.team_b : m.team_a;
          loserFlag = m.penalty_winner === m.team_a ? m.flag_b : m.flag_a;
        }
      } else if (m.penalty_winner) {
        winnerName = m.penalty_winner;
        winnerFlag = m.penalty_winner === m.team_a ? m.flag_a : m.flag_b;
        loserName = m.penalty_winner === m.team_a ? m.team_b : m.team_a;
        loserFlag = m.penalty_winner === m.team_a ? m.flag_b : m.flag_a;
      }
      
      return { winner: winnerName, wFlag: winnerFlag, loser: loserName, lFlag: loserFlag };
    };
    
    if (sf1 && sf2 && granFinal && thirdPlace) {
      const res1 = getMatchWinnerAndLoser(sf1);
      const res2 = getMatchWinnerAndLoser(sf2);
      
      if (granFinal.score_a === null || granFinal.score_b === null) {
        if (granFinal.team_a !== res1.winner) { granFinal.team_a = res1.winner; granFinal.flag_a = res1.wFlag; granFinal.score_a = null; granFinal.score_b = null; granFinal.penalty_winner = null; }
        if (granFinal.team_b !== res2.winner) { granFinal.team_b = res2.winner; granFinal.flag_b = res2.wFlag; granFinal.score_a = null; granFinal.score_b = null; granFinal.penalty_winner = null; }
      }
      
      if (thirdPlace.score_a === null || thirdPlace.score_b === null) {
        if (thirdPlace.team_a !== res1.loser) { thirdPlace.team_a = res1.loser; thirdPlace.flag_a = res1.lFlag; thirdPlace.score_a = null; thirdPlace.score_b = null; thirdPlace.penalty_winner = null; }
        if (thirdPlace.team_b !== res2.loser) { thirdPlace.team_b = res2.loser; thirdPlace.flag_b = res2.lFlag; thirdPlace.score_a = null; thirdPlace.score_b = null; thirdPlace.penalty_winner = null; }
      }
    }
    
    return newBracket;
  }, []);

  // Update R32 bracket from group standings dynamically
  const updateBracketFromGroupStandings = useCallback((currentGroups: any[], currentBracket: any, currentMatches: any[]) => {
    if (!currentBracket) return currentBracket;
    const newBracket = JSON.parse(JSON.stringify(currentBracket));

    const isGroupComplete = (groupName: string) => {
      const group = currentGroups.find(g => g.name === groupName);
      if (!group) return false;
      return group.teams.every((t: any) => t.pj === 3);
    };

    const CONFIRMED_QUALIFIED_TEAMS = new Set(["Alemania", "Estados Unidos", "México", "Argentina"]);

    const isTeamQualified = (team: any, groupName: string) => {
      if (!team) return false;
      if (isGroupComplete(groupName)) return true;
      if (team.pts >= 6) return true;
      if (CONFIRMED_QUALIFIED_TEAMS.has(team.name)) return true;
      return false;
    };

    const thirdPlaceTeams = currentGroups.map((group: any) => {
      const team = group.teams[2]; // index 2 is 3rd place
      return {
        ...team,
        groupName: group.name,
        isGroupComplete: isGroupComplete(group.name)
      };
    });

    const sortedThirds = [...thirdPlaceTeams].sort((a: any, b: any) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.dg !== a.dg) return b.dg - a.dg;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return a.name.localeCompare(b.name);
    });

    const getThirdPlacePlaceholder = (rankIndex: number) => {
      return `3° Mejor #${rankIndex + 1}`;
    };

    const getTeamInfo = (type: '1' | '2' | '3rd', groupCharOrRank: string) => {
      if (type === '3rd') {
        const rankIdx = parseInt(groupCharOrRank, 10);
        const candidate = sortedThirds[rankIdx];
        if (candidate && (candidate.isGroupComplete || isTeamQualified(candidate, candidate.groupName))) {
          return { name: candidate.name, flag: candidate.flag };
        }
        return { name: getThirdPlacePlaceholder(rankIdx), flag: 'un' };
      } else {
        const groupName = `Grupo ${groupCharOrRank}`;
        const group = currentGroups.find(g => g.name === groupName);
        if (group) {
          const idx = type === '1' ? 0 : 1;
          const candidate = group.teams[idx];
          if (candidate && isTeamQualified(candidate, groupName)) {
            return { name: candidate.name, flag: candidate.flag };
          }
        }
        return { name: `${type}° ${groupName}`, flag: 'un' };
      }
    };

    const r32Mapping = [
      { a: { type: '1', key: 'A' }, b: { type: '3rd', key: '0' } }, // Match 1
      { a: { type: '2', key: 'A' }, b: { type: '2', key: 'B' } },   // Match 2
      { a: { type: '1', key: 'B' }, b: { type: '3rd', key: '1' } }, // Match 3
      { a: { type: '1', key: 'C' }, b: { type: '2', key: 'F' } },   // Match 4
      { a: { type: '1', key: 'D' }, b: { type: '3rd', key: '2' } }, // Match 5
      { a: { type: '1', key: 'E' }, b: { type: '2', key: 'D' } },   // Match 6
      { a: { type: '1', key: 'F' }, b: { type: '2', key: 'E' } },   // Match 7
      { a: { type: '2', key: 'C' }, b: { type: '2', key: 'H' } },   // Match 8
      { a: { type: '1', key: 'G' }, b: { type: '3rd', key: '3' } }, // Match 9
      { a: { type: '1', key: 'H' }, b: { type: '2', key: 'G' } },   // Match 10
      { a: { type: '1', key: 'I' }, b: { type: '3rd', key: '4' } }, // Match 11
      { a: { type: '1', key: 'J' }, b: { type: '2', key: 'I' } },   // Match 12
      { a: { type: '1', key: 'K' }, b: { type: '3rd', key: '5' } }, // Match 13
      { a: { type: '2', key: 'J' }, b: { type: '2', key: 'K' } },   // Match 14
      { a: { type: '1', key: 'L' }, b: { type: '3rd', key: '6' } }, // Match 15
      { a: { type: '2', key: 'L' }, b: { type: '3rd', key: '7' } }, // Match 16
    ];

    newBracket.round_of_32 = newBracket.round_of_32.map((m: any, idx: number) => {
      if (m.score_a !== null && m.score_b !== null) {
        return m;
      }
      const map = r32Mapping[idx];
      if (!map) return m;
      const teamA = getTeamInfo(map.a.type as any, map.a.key);
      const teamB = getTeamInfo(map.b.type as any, map.b.key);

      const teamAChanged = m.team_a !== teamA.name;
      const teamBChanged = m.team_b !== teamB.name;

      return {
        ...m,
        team_a: teamA.name,
        flag_a: teamA.flag,
        team_b: teamB.name,
        flag_b: teamB.flag,
        score_a: teamAChanged ? null : m.score_a,
        score_b: teamBChanged ? null : m.score_b,
        penalty_winner: (teamAChanged || teamBChanged) ? null : m.penalty_winner,
      };
    });

    // Propagate the changes down the bracket
    return propagateBracketChanges(newBracket);
  }, [propagateBracketChanges]);

  const resetTournament = () => {
    if (window.confirm("¿Reiniciar todas las simulaciones al estado inicial?")) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setSelectedMatch(null);
      setShowPanel(false);
      loadInitialState();
    }
  };

  const simulateTournament = async () => {
    try {
      setIsSimulating(true);
      const currentState = {
        matches: matchesData,
        groups: groupsData,
        bracket: bracketData
      };
      
      const res = await fetch("/api/simulate_tournament", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(currentState)
      });
      
      if (!res.ok) throw new Error("Error en la simulación");
      
      const newState = await res.json();
      setMatchesData(newState.matches);
      setGroupsData(newState.groups);
      setBracketData(newState.bracket);
      
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newState));
    } catch (err) {
      console.error(err);
      alert("Hubo un error al simular el torneo.");
    } finally {
      setIsSimulating(false);
    }
  };

  // Recalculate group standings from matches
  const recalculateGroups = useCallback((updatedMatches: any[], currentGroups: any[]) => {
    return currentGroups.map((group: any) => {
      const teamsStats: any = {};
      group.teams.forEach((team: any) => {
        teamsStats[team.name] = {
          name: team.name,
          flag: team.flag,
          pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, dg: 0, pts: 0, form: [],
        };
      });

      const groupMatches = updatedMatches.filter((m: any) => m.group === group.name);
      groupMatches.forEach((m: any) => {
        if (m.score_a !== null && m.score_b !== null) {
          const sa = parseInt(m.score_a, 10);
          const sb = parseInt(m.score_b, 10);
          const ta = m.team_a;
          const tb = m.team_b;
          if (!teamsStats[ta] || !teamsStats[tb]) return;

          teamsStats[ta].pj += 1;
          teamsStats[tb].pj += 1;
          teamsStats[ta].gf += sa;
          teamsStats[ta].gc += sb;
          teamsStats[tb].gf += sb;
          teamsStats[tb].gc += sa;
          teamsStats[ta].dg = teamsStats[ta].gf - teamsStats[ta].gc;
          teamsStats[tb].dg = teamsStats[tb].gf - teamsStats[tb].gc;

          if (sa > sb) {
            teamsStats[ta].g += 1; teamsStats[ta].pts += 3; teamsStats[ta].form.push("win");
            teamsStats[tb].p += 1; teamsStats[tb].form.push("loss");
          } else if (sa < sb) {
            teamsStats[tb].g += 1; teamsStats[tb].pts += 3; teamsStats[tb].form.push("win");
            teamsStats[ta].p += 1; teamsStats[ta].form.push("loss");
          } else {
            teamsStats[ta].e += 1; teamsStats[ta].pts += 1; teamsStats[ta].form.push("draw");
            teamsStats[tb].e += 1; teamsStats[tb].pts += 1; teamsStats[tb].form.push("draw");
          }
        }
      });

      const sortedTeams = Object.values(teamsStats).sort((a: any, b: any) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.dg !== a.dg) return b.dg - a.dg;
        if (b.gf !== a.gf) return b.gf - a.gf;
        return a.name.localeCompare(b.name);
      });

      return { ...group, teams: sortedTeams };
    });
  }, []);

  const handleScoreChange = (matchId: string, team: 'a' | 'b', value: string) => {
    const scoreVal = value === "" ? null : parseInt(value, 10);

    const updatedMatches = matchesData.map((m: any) => {
      if (m.id === matchId) {
        const newScoreA = team === 'a' ? scoreVal : m.score_a;
        const newScoreB = team === 'b' ? scoreVal : m.score_b;

        let newStatus = m.status;
        if (newScoreA !== null && newScoreB !== null) {
          newStatus = "Simulado";
        } else if (m.status === "Simulado") {
          newStatus = "Próximamente";
        }

        return {
          ...m,
          score_a: newScoreA,
          score_b: newScoreB,
          status: newStatus
        };
      }
      return m;
    });

    setMatchesData(updatedMatches);

    const updatedGroups = recalculateGroups(updatedMatches, groupsData);
    setGroupsData(updatedGroups);

    const updatedBracket = updateBracketFromGroupStandings(updatedGroups, bracketData, updatedMatches);
    setBracketData(updatedBracket);

    const stateToSave = {
      matches: updatedMatches,
      groups: updatedGroups,
      bracket: updatedBracket
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
  };

  const handleBracketScoreChange = (matchId: string, team: 'a' | 'b', value: string) => {
    const scoreVal = value === "" ? null : parseInt(value, 10);

    const newBracket = JSON.parse(JSON.stringify(bracketData));
    
    // Update score in local match copy
    for (const round of Object.keys(newBracket)) {
      const idx = newBracket[round].findIndex((m: any) => m.id === matchId);
      if (idx !== -1) {
        newBracket[round][idx][team === 'a' ? 'score_a' : 'score_b'] = scoreVal;
        
        // If score changes, reset the penalty winner since it might be obsolete
        newBracket[round][idx].penalty_winner = null;
        break;
      }
    }

    const propagated = propagateBracketChanges(newBracket);
    setBracketData(propagated);

    const stateToSave = { matches: matchesData, groups: groupsData, bracket: propagated };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
  };

  const handleAdvanceTeam = (matchId: string, winnerName: string, winnerFlag: string, loserName: string, loserFlag: string) => {
    const newBracket = JSON.parse(JSON.stringify(bracketData));

    for (const round of Object.keys(newBracket)) {
      const idx = newBracket[round].findIndex((m: any) => m.id === matchId);
      if (idx !== -1) {
        newBracket[round][idx].penalty_winner = winnerName;
        break;
      }
    }

    const propagated = propagateBracketChanges(newBracket);
    setBracketData(propagated);

    const stateToSave = { matches: matchesData, groups: groupsData, bracket: propagated };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
  };

  const handleMatchSelect = (match: any) => {
    setSelectedMatch(match);
    setShowPanel(true);
  };

  // Determine if selected match is live
  const isLiveMatch = selectedMatch?.status?.includes('vivo');
  const liveScore = isLiveMatch ? {
    score_a: selectedMatch.score_a,
    score_b: selectedMatch.score_b,
    status: selectedMatch.status,
  } : null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-6">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-fifa-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-fifa-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(255,0,127,0.3)]"></div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-white font-bebas text-xl tracking-widest">Inicializando Simulador</p>
          <p className="text-fifa-muted text-xs tracking-widest uppercase font-semibold">Conectando con servidor Python...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-0 font-rajdhani">
      {/* ── Navigation Bar ── */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6 gap-4 flex-wrap">
        <div className="flex gap-1.5 bg-black/40 border border-white/5 p-1 rounded-2xl">
          {[
            { id: "grupos", label: "Fase de Grupos" },
            { id: "eliminacion", label: "Eliminación Directa" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2.5 rounded-xl font-bold font-bebas text-base tracking-widest transition-all duration-300 relative ${
                activeTab === tab.id
                  ? "text-fifa-accent bg-fifa-accent/10 border border-fifa-accent/20 shadow-md shadow-fifa-accent/5"
                  : "text-fifa-muted hover:text-white border border-transparent hover:bg-white/[0.02]"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 inset-x-4 h-0.5 bg-fifa-accent rounded-full shadow-[0_0_8px_#00ff9d]"></span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {selectedMatch && (
            <button
              onClick={() => { setSelectedMatch(null); setShowPanel(false); }}
              className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider transition-all duration-300"
            >
              ✕ Cerrar predicción
            </button>
          )}
          <button
            onClick={simulateTournament}
            disabled={isSimulating}
            className="flex items-center gap-2 px-6 py-2 border border-fifa-primary/50 rounded-xl bg-fifa-primary/20 hover:bg-fifa-primary/40 text-fifa-accent text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-[0_0_15px_rgba(234,88,12,0.2)] disabled:opacity-50"
          >
            {isSimulating ? "⏳ Simulando..." : "🚀 Simular Todo"}
          </button>
          <button
            onClick={resetTournament}
            className="flex items-center gap-2 px-5 py-2 border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-widest transition-all duration-300 hover:border-fifa-danger/40 active:scale-95"
          >
            🔄 Reiniciar
          </button>
        </div>
      </div>

      {/* ── Main Content Container with GSAP Ref ── */}
      <div ref={tabContentRef} className="w-full">
        {activeTab === "grupos" ? (
          <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
            {/* Left: Matches + Standings */}
            <div className={`flex flex-col gap-8 transition-all duration-300 w-full lg:flex-1 min-w-0`}>
              {/* Matches */}
              <div className="w-full">
                <h2 className="text-xl font-bold font-bebas tracking-widest text-white mb-5 flex items-center gap-2.5">
                  <span className="w-1.5 h-6 bg-fifa-primary rounded-full inline-block shadow-[0_0_10px_#ff007f]"></span>
                  PROGRAMACIÓN Y ENCUENTROS
                </h2>
                <MatchesWidget
                  matches={matchesData}
                  onMatchSelect={handleMatchSelect}
                  selectedMatchId={selectedMatch?.id}
                />
              </div>
  
              {/* Group Standings */}
              <div className="w-full">
                <h2 className="text-xl font-bold font-bebas tracking-widest text-white mb-5 flex items-center gap-2.5">
                  <span className="w-1.5 h-6 bg-fifa-secondary rounded-full inline-block shadow-[0_0_10px_#00e5ff]"></span>
                  CLASIFICACIONES POR GRUPO
                </h2>
                <GroupStandings groups={groupsData} />
              </div>
            </div>
  
            {/* Right: Prediction Panel (sticky) */}
            {showPanel && (
              <div ref={sidebarRef} className="w-full lg:w-80 shrink-0 lg:sticky lg:top-6 z-20">
                <div className="glass-panel border rounded-3xl overflow-hidden shadow-2xl">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-black/20">
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest font-bebas flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-fifa-accent animate-pulse shadow-[0_0_8px_#00ff9d]"></span>
                      Análisis de Probabilidad
                    </span>
                    <button
                      onClick={() => { setSelectedMatch(null); setShowPanel(false); }}
                      className="text-fifa-muted hover:text-white text-xs font-bold transition-all duration-300 border border-white/5 bg-white/5 hover:bg-white/10 w-6 h-6 rounded-full flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="overflow-y-auto custom-scrollbar max-h-[85vh]">
                    <PredictionPanel selectedMatch={selectedMatch} liveScore={liveScore} />
                  </div>
                </div>
              </div>
            )}
  
            {/* Panel placeholder when nothing selected (only on desktop) */}
            {!showPanel && (
              <div className="hidden lg:block w-80 shrink-0 self-start lg:sticky lg:top-6">
                <div className="glass-panel border rounded-3xl border-dashed border-white/10 p-1">
                  <PredictionPanel selectedMatch={null} />
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ── Bracket Tab ── */
          <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
            <div className={`flex flex-col gap-5 w-full lg:flex-1 min-w-0`}>
              <h2 className="text-xl font-bold font-bebas tracking-widest text-white flex items-center gap-2.5">
                <span className="w-1.5 h-6 bg-fifa-primary rounded-full inline-block shadow-[0_0_10px_#ff007f]"></span>
                CUADRO DE ELIMINACIÓN DIRECTA
              </h2>
              <TournamentBracket
                bracket={bracketData}
                onMatchSelect={handleMatchSelect}
                selectedMatchId={selectedMatch?.id}
                onAdvanceTeam={handleAdvanceTeam}
                onBracketScoreChange={handleBracketScoreChange}
              />
            </div>
  
            {/* Prediction Panel for bracket */}
            {showPanel && (
              <div ref={sidebarRef} className="w-full lg:w-80 shrink-0 lg:sticky lg:top-6 z-20">
                <div className="glass-panel border rounded-3xl overflow-hidden shadow-2xl">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-black/20">
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest font-bebas flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-fifa-accent animate-pulse shadow-[0_0_8px_#00ff9d]"></span>
                      Análisis de Probabilidad
                    </span>
                    <button
                      onClick={() => { setSelectedMatch(null); setShowPanel(false); }}
                      className="text-fifa-muted hover:text-white text-xs font-bold transition-all duration-300 border border-white/5 bg-white/5 hover:bg-white/10 w-6 h-6 rounded-full flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="overflow-y-auto custom-scrollbar max-h-[85vh]">
                    <PredictionPanel selectedMatch={selectedMatch} liveScore={liveScore} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
