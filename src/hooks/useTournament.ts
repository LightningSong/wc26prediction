import { useState, useEffect, useCallback } from "react";

const LOCAL_STORAGE_KEY = "wc26_tournament_state_v8";

export function useTournament() {
  const [matchesData, setMatchesData] = useState<any[]>([]);
  const [groupsData, setGroupsData] = useState<any[]>([]);
  const [bracketData, setBracketData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStats, setSimulationStats] = useState<any>(null);

  useEffect(() => {
    loadInitialState();
  }, []);

  const isTbd = (name: string) => !name || name === 'A definir' || name.startsWith('1°') || name.startsWith('2°') || name.startsWith('3°');

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
    
    const sf1 = newBracket.semis?.find((m: any) => m.id === "sf_1");
    const sf2 = newBracket.semis?.find((m: any) => m.id === "sf_2");
    const granFinal = newBracket.final?.[0];
    const thirdPlace = newBracket.third_place?.[0];
    
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
      { a: { type: '1', key: 'E' }, b: { type: '3rd', key: '0' } }, // M74
      { a: { type: '1', key: 'I' }, b: { type: '3rd', key: '1' } }, // M77
      { a: { type: '2', key: 'A' }, b: { type: '2', key: 'B' } },   // M73
      { a: { type: '1', key: 'F' }, b: { type: '2', key: 'C' } },   // M75
      { a: { type: '1', key: 'C' }, b: { type: '2', key: 'F' } },   // M76
      { a: { type: '2', key: 'E' }, b: { type: '2', key: 'I' } },   // M78
      { a: { type: '1', key: 'A' }, b: { type: '3rd', key: '2' } }, // M79
      { a: { type: '1', key: 'L' }, b: { type: '3rd', key: '3' } }, // M80
      { a: { type: '2', key: 'K' }, b: { type: '2', key: 'L' } },   // M83
      { a: { type: '1', key: 'H' }, b: { type: '2', key: 'J' } },   // M84
      { a: { type: '1', key: 'D' }, b: { type: '3rd', key: '4' } }, // M81
      { a: { type: '1', key: 'G' }, b: { type: '3rd', key: '5' } }, // M82
      { a: { type: '1', key: 'J' }, b: { type: '2', key: 'H' } },   // M86
      { a: { type: '2', key: 'D' }, b: { type: '2', key: 'G' } },   // M88
      { a: { type: '1', key: 'B' }, b: { type: '3rd', key: '6' } }, // M85
      { a: { type: '1', key: 'K' }, b: { type: '3rd', key: '7' } }, // M87
    ];

    if (!newBracket.round_of_32) return newBracket;

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

    return propagateBracketChanges(newBracket);
  }, [propagateBracketChanges]);

  const resetTournament = async () => {
    if (window.confirm("¿Reiniciar todas las simulaciones al estado inicial?")) {
      try {
        setIsSimulating(true);
        setSelectedMatch(null);
        setSimulationStats(null);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        await loadInitialState();
      } catch (err) {
        console.error(err);
      } finally {
        setIsSimulating(false);
      }
    }
  };

  const loadInitialState = async () => {
    try {
      setLoading(true);
      const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);

      if (savedState) {
        const parsed = JSON.parse(savedState);
        setMatchesData(parsed.matches);
        setGroupsData(parsed.groups);
        setBracketData(parsed.bracket);
        setSimulationStats(parsed.stats || null);
        setLoading(false);
      } else {
        const [matchesRes, groupsRes, bracketRes] = await Promise.all([
          fetch("/api/matches/today"),
          fetch("/api/groups"),
          fetch("/api/bracket"),
        ]);

        if (!matchesRes.ok || !groupsRes.ok || !bracketRes.ok) {
          throw new Error("Error al conectar con el servidor.");
        }

        const matchesJson = await matchesRes.json();
        const groupsJson = await groupsRes.json();
        const bracketJson = await bracketRes.json();

        const initialBracket = updateBracketFromGroupStandings(groupsJson.groups, bracketJson.bracket, matchesJson.matches);

        setMatchesData(matchesJson.matches);
        setGroupsData(groupsJson.groups);
        setBracketData(initialBracket);

        const stateToSave = {
          matches: matchesJson.matches,
          groups: groupsJson.groups,
          bracket: initialBracket,
          stats: null
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
        setSimulationStats(null);
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Error loading tournament state:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSimulating) return;

    const interval = setInterval(async () => {
      try {
        const [matchesRes, groupsRes] = await Promise.all([
          fetch("/api/matches/today"),
          fetch("/api/groups"),
        ]);

        if (matchesRes.ok && groupsRes.ok) {
          const matchesJson = await matchesRes.json();
          const groupsJson = await groupsRes.json();

          setMatchesData(prevMatches => {
            const newMatches = [...prevMatches];
            let changed = false;
            
            matchesJson.matches.forEach((serverMatch: any) => {
              const localIndex = newMatches.findIndex(m => m.id === serverMatch.id);
              if (localIndex !== -1) {
                const localMatch = newMatches[localIndex];
                // Only overwrite if it's "En vivo" or "Finalizado" naturally from server, 
                // and NOT "Simulado" by the user.
                if (localMatch.status !== 'Simulado') {
                  if (localMatch.score_a !== serverMatch.score_a || 
                      localMatch.score_b !== serverMatch.score_b || 
                      localMatch.status !== serverMatch.status ||
                      localMatch.team_a !== serverMatch.team_a ||
                      localMatch.team_b !== serverMatch.team_b ||
                      localMatch.date !== serverMatch.date) {
                    newMatches[localIndex] = {
                      ...localMatch,
                      team_a: serverMatch.team_a,
                      team_b: serverMatch.team_b,
                      flag_a: serverMatch.flag_a,
                      flag_b: serverMatch.flag_b,
                      date: serverMatch.date,
                      score_a: serverMatch.score_a,
                      score_b: serverMatch.score_b,
                      status: serverMatch.status,
                      category: serverMatch.category,
                      stadium: serverMatch.stadium
                    };
                    changed = true;
                  }
                }
              }
            });
            return changed ? newMatches : prevMatches;
          });

          // Also merge groups without overwriting simulated state if possible, but for simplicity
          // we update groups if matches changed.
          setGroupsData(prevGroups => {
            // Simplified: we trust the backend's groups if we haven't simulated
            const hasSimulated = matchesData.some(m => m.status === 'Simulado');
            if (!hasSimulated) {
              return groupsJson.groups;
            }
            return prevGroups;
          });
        }
      } catch (err) {
        console.error("Live polling error:", err);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [isSimulating, matchesData]);



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
      setSimulationStats(newState.stats || null);
      
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newState));
    } catch (err) {
      console.error(err);
      alert("Hubo un error al simular el torneo.");
    } finally {
      setIsSimulating(false);
    }
  };

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
    
    for (const round of Object.keys(newBracket)) {
      const idx = newBracket[round].findIndex((m: any) => m.id === matchId);
      if (idx !== -1) {
        newBracket[round][idx][team === 'a' ? 'score_a' : 'score_b'] = scoreVal;
        newBracket[round][idx].penalty_winner = null;
        break;
      }
    }

    const propagated = propagateBracketChanges(newBracket);
    setBracketData(propagated);

    const stateToSave = { matches: matchesData, groups: groupsData, bracket: propagated, stats: simulationStats };
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

    const stateToSave = { matches: matchesData, groups: groupsData, bracket: propagated, stats: simulationStats };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
  };

  return {
    matchesData,
    groupsData,
    bracketData,
    loading,
    selectedMatch,
    setSelectedMatch,
    isSimulating,
    simulationStats,
    resetTournament,
    simulateTournament,
    handleScoreChange,
    handleBracketScoreChange,
    handleAdvanceTeam
  };
}
