const fs = require('fs');
const newHospitalFinder = `import React from 'react';
import { Phone, Ambulance, ShieldAlert, HeartPulse, Clock } from 'lucide-react';

export default function HospitalFinder() {
  const isNightMode = false;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center">
          <Phone className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-black text-slate-900">Directorio de Emergencias</h3>
          <p className="text-xs text-slate-500 font-medium">Líneas de atención inmediata 24/7</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Linea 123 */}
        <div className="bg-rose-50 border border-rose-100 p-5 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-600 text-white rounded-full flex items-center justify-center shadow-md animate-pulse">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-rose-800 uppercase tracking-wider mb-1">Emergencias Nacionales</p>
              <p className="text-3xl font-black text-rose-600 tracking-tighter">123</p>
            </div>
          </div>
          <a href="tel:123" className="w-10 h-10 bg-white border border-rose-200 text-rose-600 rounded-full flex items-center justify-center hover:bg-rose-600 hover:text-white transition-colors cursor-pointer">
            <Phone className="w-4 h-4" />
          </a>
        </div>

        {/* Ambulancias */}
        <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md">
              <Ambulance className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-1">Ambulancias (CRUE)</p>
              <p className="text-3xl font-black text-blue-600 tracking-tighter">125</p>
            </div>
          </div>
          <a href="tel:125" className="w-10 h-10 bg-white border border-blue-200 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors cursor-pointer">
            <Phone className="w-4 h-4" />
          </a>
        </div>
        
        {/* Toxicologia */}
        <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-md">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-1">Línea Toxicológica</p>
              <p className="text-xl font-black text-emerald-600 tracking-tighter mt-1">01 8000 916012</p>
            </div>
          </div>
          <a href="tel:018000916012" className="w-10 h-10 bg-white border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer">
            <Phone className="w-4 h-4" />
          </a>
        </div>

        {/* Policia */}
        <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-800 text-white rounded-full flex items-center justify-center shadow-md">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-800 uppercase tracking-wider mb-1">Pediatría / Orientación</p>
              <p className="text-xl font-black text-slate-600 tracking-tighter mt-1">Tu EPS / Seguro</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
        <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed font-semibold">
          <strong>Recomendación:</strong> Mantén siempre a la mano (pegado en la nevera o guardado en favoritos) el número directo del centro pediátrico más cercano a tu domicilio y el teléfono de tu seguro médico.
        </p>
      </div>
    </div>
  );
}
`;
fs.writeFileSync('src/components/HospitalFinder.tsx', newHospitalFinder);
