"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface SimulationChartProps {
  winA: number;
  draw: number;
  winB: number;
  teamA: string;
  teamB: string;
}

export default function SimulationChart({ winA, draw, winB, teamA, teamB }: SimulationChartProps) {
  const barARef = useRef<HTMLDivElement>(null);
  const barDrawRef = useRef<HTMLDivElement>(null);
  const barBRef = useRef<HTMLDivElement>(null);
  const textARef = useRef<HTMLSpanElement>(null);
  const textDrawRef = useRef<HTMLSpanElement>(null);
  const textBRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const animateBar = (ref: React.RefObject<HTMLDivElement | null>, width: number) => {
      if (ref.current) {
        gsap.fromTo(ref.current, { width: "0%" }, { width: `${width}%`, duration: 1.5, ease: "power3.out" });
      }
    };

    const animateNumber = (ref: React.RefObject<HTMLSpanElement | null>, value: number) => {
      if (ref.current) {
        gsap.to(ref.current, {
          innerHTML: value,
          duration: 1.5,
          snap: { innerHTML: 0.1 },
          onUpdate: function () {
            if (ref.current) ref.current.innerHTML = Number(this.targets()[0].innerHTML).toFixed(1) + "%";
          }
        });
      }
    };

    animateBar(barARef, winA);
    animateBar(barDrawRef, draw);
    animateBar(barBRef, winB);

    animateNumber(textARef, winA);
    animateNumber(textDrawRef, draw);
    animateNumber(textBRef, winB);
  }, [winA, draw, winB]);

  return (
    <div className="glass-card">
      <h3 className="gradient-text" style={{ marginBottom: '20px' }}>Monte Carlo Simulation (100,000 runs)</h3>
      
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span>{teamA} Win</span>
          <span ref={textARef}>0.0%</span>
        </div>
        <div style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
          <div ref={barARef} style={{ height: '100%', backgroundColor: 'var(--primary)', width: '0%' }}></div>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span>Draw</span>
          <span ref={textDrawRef}>0.0%</span>
        </div>
        <div style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
          <div ref={barDrawRef} style={{ height: '100%', backgroundColor: '#9BA3AF', width: '0%' }}></div>
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span>{teamB} Win</span>
          <span ref={textBRef}>0.0%</span>
        </div>
        <div style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
          <div ref={barBRef} style={{ height: '100%', backgroundColor: 'var(--secondary)', width: '0%' }}></div>
        </div>
      </div>
    </div>
  );
}
