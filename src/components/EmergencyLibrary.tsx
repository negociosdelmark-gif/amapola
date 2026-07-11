import React, { useState } from 'react';
import { Search, Thermometer, ShieldAlert, HeartPulse, HelpCircle, Activity, ChevronRight, ChevronDown, Check, Sparkles } from 'lucide-react';
import { PEDIATRIC_CONDITIONS } from '../data/conditions';
import { EmergencyCondition } from '../types';

export default function EmergencyLibrary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [expandedId, setExpandedId] = useState<string | null>("fiebre_001"); // Auto-expand first item

  const categories = [
    { value: 'todos', label: 'Todos' },
    { value: 'fiebre', label: '🌡️ Fiebre' },
    { value: 'respiratorio', label: '🫁 Respiratorio' },
    { value: 'trauma', label: '🤕 Golpes / Quemaduras' },
    { value: 'digestivo', label: '🥛 Digestivo' },
    { value: 'otros', label: '✨ Alergias / Otros' }
  ];

  // Filtering logic
  const filteredConditions = PEDIATRIC_CONDITIONS.filter(cond => {
    const matchesCategory = selectedCategory === 'todos' || cond.category === selectedCategory;
    const matchesSearch = 
      cond.condition.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cond.symptoms_asociados.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      cond.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getSeverityStyle = (grav: string) => {
    switch (grav) {
      case 'severa/emergencia':
        return 'bg-rose-100 text-rose-800 border-rose-200 font-bold';
      case 'moderada':
        return 'bg-amber-100 text-amber-800 border-amber-200 font-bold';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 font-bold';
    }
  };

  return (
    <div id="emergency-library" className="space-y-6 max-w-4xl mx-auto">
      {/* Header text */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Manual de Primeros Auxilios Pediátricos
        </h2>
        <p className="text-slate-500 text-xs md:text-sm max-w-xl mx-auto leading-relaxed">
          Accede de inmediato a directrices médicas actualizadas ante síntomas comunes e incidentes del hogar. Disponible offline las 24 horas del día.
        </p>
      </div>

      {/* Search and Filters panel */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por síntoma o accidente (ej. fiebre, golpe, quemadura, atraganto)..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Category switcher */}
        <div className="flex flex-wrap gap-1.5 shrink-0">
          {categories.map(cat => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-all ${
                selectedCategory === cat.value
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conditions list */}
      {filteredConditions.length > 0 ? (
        <div className="space-y-3">
          {filteredConditions.map(cond => {
            const isExpanded = expandedId === cond.id;
            return (
              <div
                key={cond.id}
                className={`border rounded-2xl bg-white shadow-sm overflow-hidden transition-all duration-300 ${
                  isExpanded ? 'border-emerald-500 ring-4 ring-emerald-500/5' : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                {/* Header item */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : cond.id)}
                  className="w-full text-left p-4 md:p-5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      cond.gravedad === 'severa/emergencia' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      <HeartPulse className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-xs md:text-sm tracking-tight leading-tight">
                        {cond.condition}
                      </h3>
                      {/* Short symptom snippets */}
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        <span className={`text-[9px] uppercase tracking-wide border px-2 py-0.5 rounded-full ${getSeverityStyle(cond.gravedad)}`}>
                          {cond.gravedad}
                        </span>
                        <p className="text-[10px] text-slate-400 font-medium truncate max-w-[200px] sm:max-w-md hidden sm:inline">
                          Síntomas: {cond.symptoms_asociados.slice(0, 3).join(', ')}...
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                    )}
                  </div>
                </button>

                {/* Expanded details body */}
                {isExpanded && (
                  <div className="p-5 border-t border-slate-100 bg-slate-50/20 space-y-5 text-xs animate-fadeIn">
                    {/* Symptoms Associated List */}
                    <div className="space-y-1.5">
                      <div className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Síntomas comunes e indicadores:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {cond.symptoms_asociados.map((s, i) => (
                          <span key={i} className="bg-slate-100 text-slate-700 py-1 px-2.5 rounded-md font-medium text-[10px]">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Step-by-Step Protocol (Immediate First Aid Action) */}
                    <div className="space-y-3">
                      <div className="font-black text-xs text-slate-900 tracking-tight flex items-center gap-1.5 uppercase">
                        <Check className="w-4 h-4 text-emerald-600" /> Protocolo de Acción Inmediata:
                      </div>
                      <ol className="space-y-2">
                        {cond.pasos_a_seguir.map((step, idx) => (
                          <li key={idx} className="flex gap-3 text-slate-700 leading-relaxed">
                            <span className="w-5 h-5 rounded-full bg-slate-900 text-white shrink-0 flex items-center justify-center text-[10px] font-black">
                              {idx + 1}
                            </span>
                            <span className="font-medium text-[11px] pt-0.5">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Emergency Red Flags warnings */}
                    <div className="bg-rose-500/10 border border-rose-300 rounded-xl p-4 space-y-2">
                      <div className="font-extrabold text-xs text-rose-800 flex items-center gap-1.5 uppercase">
                        <ShieldAlert className="w-4 h-4 shrink-0 animate-pulse" /> Cuándo acudir a urgencias de inmediato (Señales de Alarma):
                      </div>
                      <ul className="space-y-1.5 text-rose-950 list-disc list-inside font-semibold leading-relaxed text-[11px]">
                        {cond.señales_de_alarma.map((flag, idx) => (
                          <li key={idx} className="pl-1">{flag}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Traditional/Natural approved remedies & warnings */}
                    {cond.remedios_naturales.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                        {/* Allowed remedies list */}
                        <div className="space-y-2">
                          <div className="font-bold text-[10px] text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" /> Remedios caseros seguros:
                          </div>
                          <ul className="space-y-1 text-slate-600 list-disc list-inside leading-relaxed text-[11px] font-medium">
                            {cond.remedios_naturales.map((rem, i) => (
                              <li key={i}>{rem}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Traditional remedies absolute warnings */}
                        <div className="space-y-2 bg-slate-900/5 rounded-xl p-3">
                          <div className="font-bold text-[10px] text-slate-700 uppercase tracking-wider">
                            🚫 Qué NO hacer (Advertencias importantes):
                          </div>
                          <p className="text-[10px] text-slate-600 leading-relaxed font-semibold">
                            {cond.advertencias_remedios}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Official source citation reference footer */}
                    <div className="text-[9px] text-slate-400 text-right pt-3 border-t border-slate-100/50">
                      Guía oficial de consulta: {cond.referencia}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center text-slate-500 space-y-2">
          <HelpCircle className="w-8 h-8 text-slate-300 mx-auto" />
          <h4 className="font-bold text-slate-800 text-sm">No se encontraron resultados</h4>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            Intenta buscando con términos simples como "fiebre", "golpe", "ahogo" o selecciona una pestaña de categoría superior.
          </p>
        </div>
      )}
    </div>
  );
}
