import React from 'react';

interface TopNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  matches?: any[];
}

export default function TopNav({ activeTab, onTabChange, matches = [] }: TopNavProps) {
  const getTickerItems = () => {
    const realMatches = (matches || []).filter((m: any) => 
      m.score_a !== null && 
      m.score_b !== null && 
      (!m.status || !m.status.includes('Simulado'))
    );
    
    if (realMatches.length === 0) {
      return [
        { h: 'México', a: 'Corea del Sur', s: '2-0', l: false, m: 'FT' },
        { h: 'Estados Unidos', a: 'Paraguay', s: '1-1', l: false, m: 'FT' },
        { h: 'Argentina', a: 'Argelia', s: '2-0', l: false, m: 'FT' },
        { h: 'Francia', a: 'Noruega', s: '3-1', l: false, m: 'FT' }
      ];
    }
    
    return realMatches.map((m: any) => {
      const isLive = m.status && m.status.includes('vivo');
      let timeLabel = 'FT';
      if (isLive) {
        timeLabel = 'VIVO';
        const minMatch = m.status.match(/\d+'/);
        if (minMatch) {
          timeLabel = minMatch[0];
        }
      }
      return {
        h: m.team_a,
        a: m.team_b,
        s: `${m.score_a}-${m.score_b}`,
        l: isLive,
        m: timeLabel
      };
    });
  };

  const tickerItems = getTickerItems();
  let itemsToRender = [...tickerItems];
  while (itemsToRender.length < 8 && tickerItems.length > 0) {
    itemsToRender = [...itemsToRender, ...tickerItems];
  }

  // Simple countdown logic similar to the original HTML
  const [timeLeft, setTimeLeft] = React.useState({ d: '00', h: '00', m: '00' });

  React.useEffect(() => {
    const finalDate = new Date('2026-07-19T20:00:00-04:00');
    
    const tick = () => {
      const now = new Date();
      const diff = finalDate.getTime() - now.getTime();
      
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / 1000 / 60) % 60);

      const pad = (n: number) => String(Math.max(0, n)).padStart(2, '0');

      setTimeLeft({ d: pad(d), h: pad(h), m: pad(m) });
    };

    tick();
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <>
      {/* LIVE TICKER */}
      <div className="bg-surface-container-lowest border-b border-outline-variant h-10 flex items-center overflow-hidden">
        <div className="bg-primary text-on-primary text-[10px] font-bold px-4 h-full flex items-center gap-2 z-10 shrink-0">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse-soft"></span>
          EN VIVO
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="flex whitespace-nowrap animate-ticker" id="ticker">
            {itemsToRender.map((item, idx) => (
              <div key={idx} className="inline-flex items-center px-6 border-r border-outline-variant/30 gap-3">
                <span className="text-[11px] font-bold font-inter">
                  {item.h} <span className="font-bebas text-lg px-2 text-primary">{item.s}</span> {item.a}
                </span>
                {item.l ? (
                  <span className="text-[9px] bg-error/10 text-error px-1.5 py-0.5 rounded font-black font-inter">{item.m}</span>
                ) : (
                  <span className="text-[9px] font-bold text-on-surface-variant/40 uppercase font-inter">FT</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TOP NAV BAR */}
      <header className="sticky top-0 z-50 bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-bebas text-3xl tracking-tight text-primary">WC2026</span>
            <div className="h-6 w-px bg-outline-variant hidden sm:block"></div>
            <div className="hidden md:flex gap-1">
              {[
                { id: 'grupos', label: 'Grupos' },
                { id: 'partidos', label: 'Partidos' },
                { id: 'fase', label: 'Fase Final' },
                { id: 'estadios', label: 'Estadios' },
                { id: 'pred', label: 'Predicciones' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`px-4 py-2 text-sm font-semibold transition-colors ${
                    activeTab === tab.id 
                      ? 'text-primary border-b-2 border-primary' 
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase hidden lg:block">Gran Final en </span>
            <div className="flex gap-2 font-bebas text-lg">
              <span>{timeLeft.d}</span>d <span>{timeLeft.h}</span>h <span>{timeLeft.m}</span>m
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
