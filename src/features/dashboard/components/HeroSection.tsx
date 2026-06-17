import React from 'react';

export default function HeroSection() {
  const [timeLeft, setTimeLeft] = React.useState({ d: '00', h: '00', m: '00', s: '00' });

  React.useEffect(() => {
    const finalDate = new Date('2026-07-19T20:00:00-04:00');
    
    const tick = () => {
      const now = new Date();
      const diff = finalDate.getTime() - now.getTime();
      
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / 1000 / 60) % 60);
      const s = Math.floor((diff / 1000) % 60);

      const pad = (n: number) => String(Math.max(0, n)).padStart(2, '0');

      setTimeLeft({ d: pad(d), h: pad(h), m: pad(m), s: pad(s) });
    };

    tick();
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <section className="pt-12 pb-8 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container-high rounded-full text-[10px] font-bold tracking-widest text-on-surface-variant mb-6 uppercase">
          <span className="material-symbols-outlined text-sm">public</span> USA · CAN · MEX 2026
        </div>
        <h1 className="font-bebas text-7xl md:text-9xl leading-none text-primary mb-4">FIFA WORLD CUP 2026</h1>
        <p className="text-on-surface-variant font-medium tracking-wide uppercase text-xs">
          Predicciones oficiales · Resultados en tiempo real · Sedes del torneo
        </p>
        
        <div className="mt-10 flex flex-wrap justify-center gap-8 md:gap-16 border-y border-outline-variant/50 py-6">
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bebas text-primary">{timeLeft.d}</span>
            <span className="text-[10px] font-bold uppercase text-on-primary-container tracking-tighter">Días</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bebas text-primary">{timeLeft.h}</span>
            <span className="text-[10px] font-bold uppercase text-on-primary-container tracking-tighter">Horas</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bebas text-primary">{timeLeft.m}</span>
            <span className="text-[10px] font-bold uppercase text-on-primary-container tracking-tighter">Mins</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bebas text-primary">{timeLeft.s}</span>
            <span className="text-[10px] font-bold uppercase text-on-primary-container tracking-tighter">Segs</span>
          </div>
        </div>
      </div>
    </section>
  );
}
