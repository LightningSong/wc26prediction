import React from 'react';

export default function GroupStandings({ groups }: { groups: any[] }) {
  if (!groups || groups.length === 0) return null;

  return (
    <div className="w-full flex flex-col gap-8 mt-4 font-rajdhani tilt-container">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {groups.map((group: any, index: number) => (
          <div key={index} className="w-full glass-panel glass-panel-hover tilt-card rounded-2xl p-5 shadow-2xl relative overflow-hidden">
            {/* Visual top bar glow */}
            <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-fifa-primary via-[#a855f7] to-fifa-secondary"></div>
            
            <h2 className="text-xl font-bold font-bebas tracking-wider mb-5 pl-2 text-white flex items-center justify-between">
              <span>{group.name.toUpperCase()}</span>
              <span className="text-[10px] font-rajdhani text-fifa-muted tracking-widest uppercase font-semibold">Clasifican los 2 mejores</span>
            </h2>
            
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-fifa-muted uppercase text-[9px] tracking-widest font-bold">
                    <th className="px-3 py-3 w-full">Equipo</th>
                    <th className="px-3 py-3 text-center">PJ</th>
                    <th className="px-3 py-3 text-center">G</th>
                    <th className="px-3 py-3 text-center">E</th>
                    <th className="px-3 py-3 text-center">P</th>
                    <th className="px-3 py-3 text-center">GF</th>
                    <th className="px-3 py-3 text-center">GC</th>
                    <th className="px-3 py-3 text-center">DG</th>
                    <th className="px-4 py-3 text-center text-fifa-accent font-bold">Pts</th>
                    <th className="px-3 py-3 text-center hidden md:table-cell">Racha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {group.teams.map((team: any, tIdx: number) => {
                    const isQualified = tIdx < 2;
                    return (
                      <tr 
                        key={tIdx} 
                        className={`hover:bg-white/[0.03] transition-all duration-200 ${
                          isQualified 
                            ? 'bg-fifa-accent/[0.02]' 
                            : 'opacity-70'
                        }`}
                      >
                        <td className="px-3 py-3.5 font-semibold text-white">
                          <div className="flex items-center gap-3">
                            <span className={`w-5 text-xs text-center font-bold rounded-md py-0.5 ${
                              tIdx === 0 ? 'text-fifa-accent bg-fifa-accent/15 border border-fifa-accent/20' :
                              tIdx === 1 ? 'text-fifa-secondary bg-fifa-secondary/15 border border-fifa-secondary/20' :
                              'text-fifa-muted bg-white/5 border border-white/5'
                            }`}>
                              {tIdx + 1}
                            </span>
                            <img 
                              src={`https://flagcdn.com/24x18/${team.flag.toLowerCase()}.png`} 
                              alt={team.name} 
                              className="rounded-sm shadow-md border border-white/10 w-6 h-4.5 object-cover"
                              onError={(e) => { e.currentTarget.src = "https://flagcdn.com/24x18/un.png" }}
                            />
                            <span className="truncate max-w-[120px] md:max-w-none text-xs tracking-wide">{team.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3.5 text-center text-fifa-muted font-bold">{team.pj}</td>
                        <td className="px-3 py-3.5 text-center text-white/80">{team.g}</td>
                        <td className="px-3 py-3.5 text-center text-white/80">{team.e}</td>
                        <td className="px-3 py-3.5 text-center text-white/80">{team.p}</td>
                        <td className="px-3 py-3.5 text-center text-white/80">{team.gf}</td>
                        <td className="px-3 py-3.5 text-center text-white/80">{team.gc}</td>
                        <td className="px-3 py-3.5 text-center font-bold">
                          <span className={team.dg > 0 ? 'text-fifa-accent' : team.dg < 0 ? 'text-fifa-danger' : 'text-fifa-muted'}>
                            {team.dg > 0 ? `+${team.dg}` : team.dg}
                          </span>
                        </td>
                        <td className={`px-4 py-3.5 text-center font-black text-sm ${isQualified ? 'text-fifa-accent text-glow-accent' : 'text-white'}`}>{team.pts}</td>
                        <td className="px-3 py-3.5 hidden md:table-cell">
                          <div className="flex items-center justify-center gap-1">
                            {[...Array(3)].map((_, fIdx: number) => {
                              const formStatus = team.form[fIdx];
                              if (formStatus === 'win') return <div key={fIdx} className="w-5 h-5 rounded-md bg-fifa-success/15 border border-fifa-success/30 flex items-center justify-center text-[9px] font-black text-fifa-success">V</div>;
                              if (formStatus === 'loss') return <div key={fIdx} className="w-5 h-5 rounded-md bg-fifa-danger/15 border border-fifa-danger/30 flex items-center justify-center text-[9px] font-black text-fifa-danger">D</div>;
                              if (formStatus === 'draw') return <div key={fIdx} className="w-5 h-5 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-[9px] font-bold text-fifa-muted">E</div>;
                              return <div key={fIdx} className="w-5 h-5 rounded-md border border-white/5 opacity-25"></div>;
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
