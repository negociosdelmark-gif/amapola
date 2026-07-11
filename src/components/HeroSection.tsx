import React from 'react';
import { ShieldAlert, Activity, Thermometer, Baby, CalendarDays, Sparkles, HeartPulse } from 'lucide-react';

interface HeroSectionProps {
  onNavigate: (tab: 'home' | 'emergency' | 'checker' | 'library' | 'vaccine' | 'family') => void;
  freeAssessmentsLeft: number;
}

export default function HeroSection({ onNavigate, freeAssessmentsLeft }: HeroSectionProps) {
  return (
    <div id="hero-section" className="space-y-8 max-w-4xl mx-auto">
      {/* App Main Intro Card */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1 space-y-4">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" /> Orientación Pediátrica Segura
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Tranquilidad y primeros auxilios pediátricos al alcance de tu mano
          </h1>
          <p className="text-slate-600 text-sm md:text-base leading-relaxed max-w-xl">
            <strong>Amapola</strong> es tu puente de apoyo hacia la pediatría profesional. Obtén respuestas médicas guiadas, calma la ansiedad inicial y accede de inmediato a guías oficiales de emergencia.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => onNavigate('checker')}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-sm hover:shadow transition-all text-sm inline-flex items-center gap-2"
            >
              <Activity className="w-4 h-4" /> Evaluar Síntomas Ahora
            </button>
            <button
              onClick={() => onNavigate('emergency')}
              className="px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-xl shadow-sm hover:shadow transition-all text-sm inline-flex items-center gap-2"
            >
              <ShieldAlert className="w-4 h-4 animate-pulse" /> Emergencia (RCP / Heimlich)
            </button>
          </div>
        </div>
        <div className="relative w-48 h-48 md:w-56 md:h-56 shrink-0 bg-white border border-slate-100 rounded-2xl flex items-center justify-center shadow-inner overflow-hidden">
          {/* Conceptual App graphic showing parent holding child */}
          <div className="absolute inset-0 bg-radial-gradient from-teal-50/50 to-emerald-500/10" />
          <div className="text-center p-4 z-10 space-y-2">
            <div className="w-16 h-16 mx-auto bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-md border-4 border-white">
              <Baby className="w-8 h-8" />
            </div>
            <div className="font-extrabold text-emerald-800 tracking-tight text-lg">Amapola</div>
            <p className="text-[10px] text-slate-500 font-medium">Guías AHA/AAP 2026</p>
            <div className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
              {freeAssessmentsLeft > 0 ? `${freeAssessmentsLeft} consultas gratis` : 'Modo Premium'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {/* Card 1: Emergency */}
        <button
          onClick={() => onNavigate('emergency')}
          className="group text-left p-6 bg-white border border-rose-100 hover:border-rose-300 rounded-2xl shadow-sm hover:shadow-md transition-all space-y-4 cursor-pointer"
        >
          <div className="w-12 h-12 bg-rose-50 text-rose-600 group-hover:bg-rose-100 rounded-xl flex items-center justify-center transition-colors">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 group-hover:text-rose-600 transition-colors">Guías de Emergencia</h3>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed">
              Maniobra de Heimlich, Reanimación (RCP), y números rápidos de urgencia local paso a paso con voz.
            </p>
          </div>
        </button>

        {/* Card 2: Symptom Checker */}
        <button
          onClick={() => onNavigate('checker')}
          className="group text-left p-6 bg-white border border-emerald-100 hover:border-emerald-300 rounded-2xl shadow-sm hover:shadow-md transition-all space-y-4 cursor-pointer"
        >
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 rounded-xl flex items-center justify-center transition-colors">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">Evaluación Inteligente</h3>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed">
              Responde sencillas preguntas para recibir orientación preliminar detallada con inteligencia artificial.
            </p>
          </div>
        </button>

        {/* Card 3: Library */}
        <button
          onClick={() => onNavigate('library')}
          className="group text-left p-6 bg-white border border-slate-100 hover:border-emerald-200 rounded-2xl shadow-sm hover:shadow-md transition-all space-y-4 cursor-pointer"
        >
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 rounded-xl flex items-center justify-center transition-colors">
            <Thermometer className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Manual de Cuidados</h3>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed">
              Biblioteca completa de primeros auxilios pediátricos, remedios permitidos y advertencias vitales.
            </p>
          </div>
        </button>

        {/* Card 4: Vaccines */}
        <button
          onClick={() => onNavigate('vaccine')}
          className="group text-left p-6 bg-white border border-slate-100 hover:border-emerald-200 rounded-2xl shadow-sm hover:shadow-md transition-all space-y-4 cursor-pointer"
        >
          <div className="w-12 h-12 bg-amber-50 text-amber-600 group-hover:bg-amber-100 rounded-xl flex items-center justify-center transition-colors">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors">Calendario de Vacunas</h3>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed">
              Registro nacional completo de vacunas de 0 a 10 años. Lleva el control y recibe recordatorios oportunos.
            </p>
          </div>
        </button>

        {/* Card 5: Children Profiles */}
        <button
          onClick={() => onNavigate('family')}
          className="group text-left p-6 bg-white border border-slate-100 hover:border-emerald-200 rounded-2xl shadow-sm hover:shadow-md transition-all space-y-4 cursor-pointer sm:col-span-2 md:col-span-1"
        >
          <div className="w-12 h-12 bg-sky-50 text-sky-600 group-hover:bg-sky-100 rounded-xl flex items-center justify-center transition-colors">
            <Baby className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors">Perfiles de Mis Hijos</h3>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed">
              Administra perfiles personalizados, peso, alergias e historial de consultas de la IA para un seguimiento preciso.
            </p>
          </div>
        </button>
      </div>

      {/* Trust Badge Section */}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-center text-xs text-slate-500 space-y-2">
        <div className="font-semibold text-slate-700 text-sm">Información Médica Validada</div>
        <p className="max-w-2xl mx-auto leading-relaxed">
          Esta plataforma utiliza directrices clínicas de la Asociación Americana del Corazón (AHA) y de la Academia Americana de Pediatría (AAP) actualizadas a 2026 (consenso e inmunización más recientes). El contenido es puramente informativo y de orientación primaria. <strong>Ante una emergencia real, llama inmediatamente al número de emergencias nacional.</strong>
        </p>
      </div>
    </div>
  );
}
