"use client";

import React, { useState } from 'react';
import TopNav from './TopNav';
import HeroSection from './HeroSection';
import GroupsView from './GroupsView';
import MatchesView from './MatchesView';
import BracketView from './BracketView';
import StadiumsView from './StadiumsView';
import PredictionsView from './PredictionsView';
import Footer from './Footer';
import PredictionPanel from '@/features/predictions/components/PredictionPanel';
import { useTournament } from '@/hooks/useTournament';

export default function WC26Dashboard() {
  const [activeTab, setActiveTab] = useState('grupos');
  
  const {
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
  } = useTournament();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-container-lowest gap-6">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-primary font-bebas text-2xl tracking-widest">Inicializando Simulador</p>
          <p className="text-on-surface-variant text-xs tracking-widest uppercase font-semibold">Conectando con servidor Python...</p>
        </div>
      </div>
    );
  }

  const isLiveMatch = selectedMatch?.status?.includes('vivo');
  const liveScore = isLiveMatch ? {
    score_a: selectedMatch.score_a,
    score_b: selectedMatch.score_b,
    status: selectedMatch.status,
  } : null;

  const hasFullySimulated = bracketData?.final?.[0]?.score_a !== null && bracketData?.final?.[0]?.score_b !== null;

  return (
    <>
      <TopNav 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        matches={matchesData}
      />
      
      {/* Simulation Controls embedded above HeroSection */}
      <div className="bg-surface-container-highest border-b border-outline-variant py-2">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center text-xs font-bold uppercase tracking-widest">
          <div className="flex gap-4">
            <span className="text-primary hidden md:inline-block">Simulador Monte Carlo Activo</span>
            <span className="text-on-surface-variant hidden lg:inline-block">100,000 Iteraciones</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={simulateTournament}
              disabled={isSimulating}
              className="flex items-center gap-2 px-4 py-1.5 border border-primary/50 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-all shadow-sm disabled:opacity-50"
            >
              {isSimulating ? "⏳ Simulando..." : "🚀 Simular Todo"}
            </button>
            <button
              onClick={resetTournament}
              className="flex items-center gap-2 px-4 py-1.5 border border-outline-variant rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-all hover:border-error/40 hover:text-error"
            >
              🔄 Reiniciar
            </button>
          </div>
        </div>
      </div>

      <HeroSection />
      
      <main className={`mx-auto px-4 py-12 relative flex gap-6 items-start transition-all duration-500 w-full ${selectedMatch ? 'max-w-[1600px]' : 'max-w-7xl'}`}>
        <div className="flex-1 min-w-0 transition-opacity duration-300">
          <div className={activeTab === 'grupos' ? 'block' : 'hidden'}>
            <GroupsView groups={groupsData} matches={matchesData} />
          </div>
          <div className={activeTab === 'partidos' ? 'block' : 'hidden'}>
            <MatchesView 
              matches={matchesData} 
              onScoreChange={handleScoreChange}
              onMatchSelect={setSelectedMatch}
              selectedMatchId={selectedMatch?.id}
            />
          </div>
          <div className={activeTab === 'fase' ? 'block' : 'hidden'}>
            <BracketView 
              bracket={bracketData} 
              onAdvanceTeam={handleAdvanceTeam}
              onBracketScoreChange={handleBracketScoreChange}
              onMatchSelect={setSelectedMatch}
              selectedMatch={selectedMatch}
              liveScore={liveScore}
            />
          </div>
          <div className={activeTab === 'estadios' ? 'block' : 'hidden'}>
            <StadiumsView matches={matchesData} />
          </div>
          <div className={activeTab === 'pred' ? 'block' : 'hidden'}>
            <PredictionsView 
              isLocked={!hasFullySimulated} 
              bracketData={bracketData} 
              simulationStats={simulationStats}
              groupsData={groupsData}
              matchesData={matchesData}
            />
          </div>
        </div>

        {/* Dynamic Sidebar for Predictions */}
        {selectedMatch && (
          <aside className="hidden lg:block w-[360px] shrink-0 sticky top-24 z-40">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl shadow-xl flex">
              <div className="flex-1">
                <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/50 bg-surface-container/50">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest font-bebas flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse-soft"></span>
                    Análisis Predictivo
                  </span>
                  <button
                    onClick={() => setSelectedMatch(null)}
                    className="text-on-surface-variant hover:text-primary transition-all w-6 h-6 flex items-center justify-center rounded-full hover:bg-surface-container-high"
                  >
                    ✕
                  </button>
                </div>
                <div className="overflow-y-auto no-scrollbar max-h-[80vh]">
                  <PredictionPanel selectedMatch={selectedMatch} liveScore={liveScore} layoutMode="sidebar" />
                </div>
              </div>
            </div>
          </aside>
        )}
      </main>

      {/* Mobile Drawer Overlay for Predictions */}
      {selectedMatch && (
        <div className="lg:hidden fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedMatch(null)}></div>
          <div className="w-[90%] max-w-sm h-full bg-surface-container-lowest shadow-2xl relative flex flex-col transform transition-transform animate-slide-in-right">
            <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/50 bg-surface-container/50">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest font-bebas flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse-soft"></span>
                Análisis Predictivo
              </span>
              <button
                onClick={() => setSelectedMatch(null)}
                className="text-on-surface-variant hover:text-primary transition-all w-8 h-8 flex items-center justify-center rounded-full bg-surface-container-high"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <PredictionPanel selectedMatch={selectedMatch} liveScore={liveScore} layoutMode="mobile" />
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
