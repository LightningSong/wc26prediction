import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-surface-container-highest border-t border-outline-variant py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="md:col-span-2">
          <span className="font-bebas text-3xl text-primary block mb-4">WC2026 PREDICTOR</span>
          <p className="text-on-surface-variant text-sm max-w-md leading-relaxed">
            Plataforma independiente de análisis y predicción para la Copa Mundial de la FIFA 2026. 
            Datos actualizados cada 60 segundos desde los 16 estadios oficiales.
          </p>
        </div>
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-6">Navegación</h4>
          <ul className="space-y-3 text-sm text-on-surface-variant">
            <li><a className="hover:text-primary transition-colors" href="#">Inicio</a></li>
            <li><a className="hover:text-primary transition-colors" href="#">Reglamento</a></li>
            <li><a className="hover:text-primary transition-colors" href="#">Sedes</a></li>
            <li><a className="hover:text-primary transition-colors" href="#">Contacto</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-6">Oficial</h4>
          <div className="flex gap-4">
            <span className="w-10 h-10 bg-white border border-outline-variant rounded-full flex items-center justify-center text-xl shadow-sm">🇺🇸</span>
            <span className="w-10 h-10 bg-white border border-outline-variant rounded-full flex items-center justify-center text-xl shadow-sm">🇨🇦</span>
            <span className="w-10 h-10 bg-white border border-outline-variant rounded-full flex items-center justify-center text-xl shadow-sm">🇲🇽</span>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-outline-variant/30 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-medium text-on-primary-container/60 uppercase tracking-widest">
        <span>© 2024 WC2026 Predictor — Aura Design System</span>
        <span>Actualizado: Junio 2024</span>
      </div>
    </footer>
  );
}
