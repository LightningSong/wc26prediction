"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface MatrixItem {
  score_a: number;
  score_b: number;
  score: string;
  prob: number;
}

interface PredictionMatrixProps {
  matrix: MatrixItem[];
  teamA: string;
  teamB: string;
}

export default function PredictionMatrix({ matrix, teamA, teamB }: PredictionMatrixProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.querySelectorAll('.matrix-cell'),
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 0.5, stagger: 0.02, ease: "back.out(1.7)" }
      );
    }
  }, [matrix]);

  // Extract top 10 to highlight
  const top10Scores = [...matrix].sort((a, b) => b.prob - a.prob).slice(0, 10).map(m => m.score);

  return (
    <div className="glass-card" style={{ marginTop: '24px' }}>
      <h2 className="gradient-text" style={{ marginBottom: '16px' }}>Goal Probability Matrix</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>Top 10 most likely scores are highlighted.</p>
      
      <div className="matrix-grid" ref={containerRef}>
        <div className="matrix-header"></div>
        {[0, 1, 2, 3, 4, 5].map(g => (
          <div key={`header-b-${g}`} className="matrix-header">{teamB} {g}</div>
        ))}

        {[0, 1, 2, 3, 4, 5].map(goalsA => (
          <div style={{ display: 'contents' }} key={`row-${goalsA}`}>
            <div className="matrix-header">{teamA} {goalsA}</div>
            {[0, 1, 2, 3, 4, 5].map(goalsB => {
              const cellData = matrix.find(m => m.score_a === goalsA && m.score_b === goalsB);
              const prob = cellData ? cellData.prob : 0;
              const isTop10 = cellData ? top10Scores.includes(cellData.score) : false;
              
              // Calculate opacity based on probability for heat map effect
              const heatOpacity = Math.max(0.1, prob / 15); // Assuming max prob is ~15%
              
              return (
                <div 
                  key={`cell-${goalsA}-${goalsB}`} 
                  className={`matrix-cell ${isTop10 ? 'top-10' : ''}`}
                  style={{ backgroundColor: isTop10 ? '' : `rgba(255, 0, 77, ${heatOpacity})` }}
                >
                  <span style={{ fontSize: '1.1rem', fontWeight: isTop10 ? 'bold' : 'normal' }}>
                    {prob.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
