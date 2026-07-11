import React, { useState } from 'react';
import { Plus, Trash2, Baby, Star, ShieldAlert, Sparkles, AlertCircle, Heart, Cloud, CloudOff } from 'lucide-react';
import { ChildProfile, SymptomAssessment } from '../types';

interface ProfileManagerProps {
  profiles: ChildProfile[];
  onAddProfile: (profile: ChildProfile) => void;
  onDeleteProfile: (id: string) => void;
  activeProfile: ChildProfile | null;
  onSelectProfile: (profile: ChildProfile | null) => void;
  assessments: SymptomAssessment[];
  onNavigateToPremium: () => void;
  user?: any;
  onLogin?: () => void;
  onLogout?: () => void;
  authExecuting?: boolean;
  authError?: { message: string; code?: string } | null;
  isOnline?: boolean;
  onClearError?: () => void;
}

export default function ProfileManager({
  profiles,
  onAddProfile,
  onDeleteProfile,
  activeProfile,
  onSelectProfile,
  assessments,
  onNavigateToPremium,
  user,
  onLogin,
  onLogout,
  authExecuting = false,
  authError = null,
  isOnline = true,
  onClearError
}: ProfileManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'M' | 'F' | 'Otro'>('M');
  const [weightKg, setWeightKg] = useState('');
  const [allergies, setAllergies] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [chronicConditions, setChronicConditions] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !birthDate) return;

    const newProfile: ChildProfile = {
      id: Math.random().toString(36).substring(7),
      name,
      birthDate,
      gender,
      weightKg: weightKg ? parseFloat(weightKg) : undefined,
      allergies: allergies.trim() || undefined,
      bloodType: bloodType.trim() || undefined,
      chronicConditions: chronicConditions.trim() || undefined
    };

    onAddProfile(newProfile);
    setName('');
    setBirthDate('');
    setGender('M');
    setWeightKg('');
    setAllergies('');
    setBloodType('');
    setChronicConditions('');
    setShowAddForm(false);
  };

  function calculateAgeText(birthDateStr: string): string {
    try {
      const birth = new Date(birthDateStr);
      const now = new Date();
      let years = now.getFullYear() - birth.getFullYear();
      let months = now.getMonth() - birth.getMonth();
      if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
        years--;
        months += 12;
      }
      if (years === 0) {
        return `${months} meses`;
      }
      return `${years} años y ${months} meses`;
    } catch {
      return "0 años";
    }
  }

  // Filter assessments for active child or anonymous if none selected
  const filteredHistory = assessments.filter(ass => 
    activeProfile ? ass.childId === activeProfile.id : !ass.childId
  );

  return (
    <div id="profile-manager" className="space-y-8 max-w-4xl mx-auto">
      {/* Premium invitation header */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="space-y-3 max-w-xl z-10 relative">
          <div className="inline-flex items-center gap-1 bg-emerald-500 text-slate-950 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide">
            <Star className="w-3.5 h-3.5 fill-current" /> Plan Premium Amapola
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight leading-snug">
            Crea el expediente de salud integral para cada uno de tus hijos
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Sincroniza historial ilimitado de síntomas, alertas tempranas de brotes infantiles locales, descarga de reportes y modo de primeros auxilios sin conexión.
          </p>
          <button
            onClick={onNavigateToPremium}
            className="mt-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition-all tracking-wide inline-flex items-center gap-1"
          >
            Saber más sobre Premium <Sparkles className="w-3.5 h-3.5 fill-current" />
          </button>
        </div>
      </div>

      {/* Cloud Sync Status Widget */}
      <div className="space-y-3">
        <div className={`bg-white border rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 transition-all ${!isOnline ? 'border-amber-200 bg-amber-50/5' : 'border-slate-200'}`}>
          <div className="flex items-center gap-3 text-left w-full sm:w-auto">
            <div className={`p-2.5 rounded-2xl shrink-0 ${user ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
              <Cloud className={`w-5 h-5 ${authExecuting ? 'animate-bounce' : ''}`} />
            </div>
            <div className="space-y-0.5">
              <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5 flex-wrap">
                Expediente Sincronizado en la Nube
                {user && <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />}
                {!isOnline && (
                  <span className="bg-amber-100 text-amber-800 text-[9px] font-black uppercase px-2 py-0.5 rounded-md border border-amber-200/50">
                    Modo Local
                  </span>
                )}
              </h4>
              <p className="text-[10.5px] text-slate-500 leading-relaxed max-w-lg">
                {user 
                  ? `Tus perfiles de hijos e historiales están resguardados de forma segura en Firebase Firestore bajo tu cuenta: ${user.email}`
                  : "Tus datos actuales solo se guardan de forma local. Inicia sesión con tu cuenta de Google para respaldar tus perfiles en la nube y acceder desde cualquier lugar."
                }
              </p>
            </div>
          </div>
          <div className="shrink-0 w-full sm:w-auto text-center sm:text-right">
            {user ? (
              <button
                type="button"
                onClick={onLogout}
                className="w-full sm:w-auto px-4 py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cerrar Sesión
              </button>
            ) : (
              <button
                type="button"
                onClick={onLogin}
                disabled={authExecuting}
                className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm whitespace-nowrap cursor-pointer ${
                  authExecuting 
                    ? 'bg-slate-100 text-slate-400 border border-slate-200' 
                    : !isOnline
                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                {authExecuting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Sincronizando...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.415 0-6.191-2.828-6.191-6.285 0-3.457 2.776-6.285 6.19-6.285 1.54 0 2.922.569 3.99 1.51l3.053-3.1C18.913 1.956 15.776 1 12.24 1 6.033 1 12.23 1 18.426 6.033 23.46 12.24 23.46c5.7 0 10.286-4.144 10.286-10.286 0-.616-.062-1.206-.17-1.789H12.24z"/>
                    </svg>
                    <span>Sincronizar con Google</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Auth Error Toast in-panel */}
        {authError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl p-4 text-xs font-semibold flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1 text-left">
              <span className="font-extrabold block text-rose-950 text-xs mb-0.5">Fallo en la sincronización</span>
              <p className="text-[11px] leading-relaxed text-rose-800">{authError.message}</p>
            </div>
            {onClearError && (
              <button 
                type="button"
                onClick={onClearError}
                className="text-rose-400 hover:text-rose-700 transition-colors cursor-pointer text-sm font-black"
              >
                ✕
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* LEFT PANEL: Kids profile listing */}
        <div className="md:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">Perfiles de Mis Hijos</h3>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar Hijo
              </button>
            )}
          </div>

          {/* Add Profile Form */}
          {showAddForm && (
            <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="font-extrabold text-slate-800 text-xs uppercase tracking-wide border-b border-slate-100 pb-2">Agregar Perfil Pediátrico</div>
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="col-span-2 space-y-1">
                  <label className="font-bold text-slate-600">Nombre del niño/a *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ej. Mateo o Sofía"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Fecha de Nacimiento *</label>
                  <input
                    type="date"
                    required
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Género</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Peso (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder="ej. 12.5"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Tipo de Sangre</label>
                  <input
                    type="text"
                    value={bloodType}
                    onChange={(e) => setBloodType(e.target.value)}
                    placeholder="ej. O+"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="font-bold text-slate-600">Alergias Conocidas</label>
                  <input
                    type="text"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    placeholder="ej. Penicilina, proteína de leche, nueces"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="font-bold text-slate-600">Enfermedades crónicas o notas</label>
                  <input
                    type="text"
                    value={chronicConditions}
                    onChange={(e) => setChronicConditions(e.target.value)}
                    placeholder="ej. Asma leve, intolerancia lactosa"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all"
                >
                  Guardar Perfil
                </button>
              </div>
            </form>
          )}

          {/* Child Selection list */}
          <div className="space-y-2.5">
            {/* Anonymous default profile option */}
            <div
              onClick={() => onSelectProfile(null)}
              className={`border p-4 rounded-2xl flex items-center justify-between cursor-pointer transition-all ${
                activeProfile === null
                  ? 'border-emerald-500 bg-emerald-50/10 shadow-sm'
                  : 'border-slate-100 bg-white hover:border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                  <Baby className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-xs">Consulta Anónima (Invitado)</h4>
                  <p className="text-[10px] text-slate-500 font-medium">No guarda expediente personal</p>
                </div>
              </div>
              {activeProfile === null && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full uppercase">Activo</span>
              )}
            </div>

            {/* Custom Profiles list */}
            {profiles.map(p => {
              const isActive = activeProfile?.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => onSelectProfile(p)}
                  className={`border p-4 rounded-2xl flex items-start justify-between cursor-pointer transition-all ${
                    isActive
                      ? 'border-emerald-500 bg-emerald-50/10 shadow-sm'
                      : 'border-slate-100 bg-white hover:border-slate-200'
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                      <Baby className="w-5.5 h-5.5" />
                    </div>
                    <div className="space-y-0.5 text-xs">
                      <h4 className="font-black text-slate-900">{p.name}</h4>
                      <p className="text-[10px] text-slate-500 font-bold">Edad: {calculateAgeText(p.birthDate)}</p>
                      {p.weightKg && <p className="text-[10px] text-slate-400 font-medium">Peso: {p.weightKg} kg</p>}
                      {p.allergies && (
                        <div className="inline-flex items-center gap-1 text-[9px] bg-amber-50 border border-amber-200 text-amber-800 px-2 py-0.5 rounded-md mt-1 font-bold uppercase">
                          <AlertCircle className="w-3 h-3" /> Alergia: {p.allergies}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between h-full min-h-[50px]">
                    {isActive ? (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full uppercase mb-1">Activo</span>
                    ) : (
                      <span className="text-[9px] text-slate-400 font-bold uppercase mb-1 group-hover:text-slate-600">Seleccionar</span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProfile(p.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-50 transition-colors mt-auto"
                      title="Eliminar perfil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANEL: Child specific consultation history */}
        <div className="md:col-span-6 space-y-4">
          <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">
            Historial de Consultas de {activeProfile ? activeProfile.name : "Invitado"}
          </h3>

          {filteredHistory.length > 0 ? (
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {filteredHistory.map(ass => (
                <div key={ass.id} className="bg-white border border-slate-100 rounded-2xl p-4 space-y-3 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">{ass.timestamp} - {ass.summary || "Consulta"}</span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                      ass.severity === 'severa' ? 'bg-rose-100 text-rose-800' :
                      ass.severity === 'moderada' ? 'bg-amber-100 text-amber-800' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {ass.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                    Síntomas: "{ass.symptoms}"
                  </p>
                  
                  {ass.steps.length > 0 && (
                    <div className="space-y-1 border-t border-slate-100 pt-2 text-[11px]">
                      <div className="font-bold text-[10px] text-slate-400 uppercase tracking-wide">Acciones aplicadas:</div>
                      <ol className="list-decimal list-inside space-y-0.5 text-slate-500 font-medium">
                        {ass.steps.slice(0, 3).map((st, i) => (
                          <li key={i} className="truncate">{st}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-center text-slate-400 h-[220px] flex flex-col items-center justify-center space-y-2">
              <Plus className="w-8 h-8 text-slate-300" />
              <h4 className="font-bold text-slate-800 text-xs">Sin Consultas Registradas</h4>
              <p className="text-[10px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                Aún no has guardado ninguna evaluación diagnóstica para este perfil. Ve a la sección de **"Evaluar Síntomas"** para realizar un análisis clínico.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
