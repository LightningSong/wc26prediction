import React from 'react';

interface GroupsViewProps {
  groups: any[];
}

export default function GroupsView({ groups }: GroupsViewProps) {
  return (
    <section className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-bebas text-5xl text-primary leading-none">Fase de Grupos</h2>
          <p className="text-on-surface-variant text-sm mt-1">12 Grupos · 48 Equipos · Simulaciones y Seguimiento en tiempo real</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {groups.map((g, index) => {
          return (
            <div key={index} className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="px-5 py-4 flex items-center justify-between border-b border-outline-variant/30">
                <span className="font-bebas text-2xl text-primary">{g.name}</span>
                <span className="text-[10px] font-bold text-on-surface-variant tracking-wider uppercase">Fase 1</span>
              </div>
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-on-primary-container/60 uppercase font-bold text-[10px] tracking-tighter">
                      <th className="px-4 py-3 text-left">Equipo</th>
                      <th className="px-2 py-3">PJ</th>
                      <th className="px-2 py-3">GD</th>
                      <th className="px-4 py-3 text-right">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {g.teams.map((t: any, i: number) => (
                      <tr key={i} className={i < 2 ? 'bg-primary/5' : ''}>
                        <td className="px-4 py-3 flex items-center gap-2">
                          <span className="text-on-primary-container/40 font-bold w-4">{i + 1}</span>
                          <img src={`https://flagcdn.com/16x12/${t.flag?.toLowerCase() || 'un'}.png`} alt={t.name} className="w-4 h-3 rounded-sm object-cover border border-outline-variant" />
                          <span className="font-semibold truncate max-w-[80px]">{t.name}</span>
                        </td>
                        <td className="px-2 py-3 text-center text-on-surface-variant">{t.pj}</td>
                        <td className={`px-2 py-3 text-center font-medium ${t.dg > 0 ? 'text-green-600' : t.dg < 0 ? 'text-red-600' : ''}`}>
                          {t.dg > 0 ? '+' : ''}{t.dg}
                        </td>
                        <td className="px-4 py-3 text-right font-bebas text-lg text-primary">{t.pts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
