import { useState, useEffect } from 'react';
import { 
  Scale, Ruler, ShieldAlert, Plus, Trash2, Calendar, 
  Baby, Sparkles, Activity, PlusCircle, Check, Download, FileText, Camera
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { logAnalyticsEvent } from '../lib/firebase';
import { exportChildHealthPDF } from '../utils/pdfGenerator';
import ChildPhotoCamera from './ChildPhotoCamera';

interface HealthRecord {
  id: string;
  date: string;
  weight: number; // in kg
  height: number; // in cm
}

interface ChildProfile {
  id: string;
  name: string;
  birthdate: string;
  allergies: string[];
  history: HealthRecord[];
  photoUri?: string;
}

const DEFAULT_CHILDREN: ChildProfile[] = [
  {
    id: '1',
    name: 'Sofía',
    birthdate: '2025-05-15',
    allergies: ['Amoxicilina', 'Nueces'],
    history: [
      { id: 'h1', date: '2025-05-15', weight: 3.2, height: 49 },
      { id: 'h2', date: '2025-08-15', weight: 5.8, height: 60 },
      { id: 'h3', date: '2025-11-15', weight: 7.5, height: 68 },
      { id: 'h4', date: '2026-02-15', weight: 9.1, height: 74 },
      { id: 'h5', date: '2026-05-15', weight: 10.4, height: 80 }
    ]
  },
  {
    id: '2',
    name: 'Mateo',
    birthdate: '2025-10-10',
    allergies: ['Melocotón'],
    history: [
      { id: 'm1', date: '2025-10-10', weight: 3.5, height: 51 },
      { id: 'm2', date: '2026-01-10', weight: 6.2, height: 61 },
      { id: 'm3', date: '2026-04-10', weight: 8.0, height: 69 }
    ]
  }
];

export default function ChildHealthTracker() {
  const [children, setChildren] = useState<ChildProfile[]>(() => {
    const saved = localStorage.getItem('amapola_children_health');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_CHILDREN;
      }
    }
    return DEFAULT_CHILDREN;
  });

  const [activeChildId, setActiveChildId] = useState<string>(() => {
    if (children.length > 0) return children[0].id;
    return '';
  });

  // Keep active child sync if children list changes
  useEffect(() => {
    if (children.length > 0 && !children.some(c => c.id === activeChildId)) {
      setActiveChildId(children[0].id);
    }
  }, [children, activeChildId]);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('amapola_children_health', JSON.stringify(children));
  }, [children]);

  // UI States
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  
  // New Child Form State
  const [newChildName, setNewChildName] = useState('');
  const [newChildBirthdate, setNewChildBirthdate] = useState('');
  const [newChildAllergiesStr, setNewChildAllergiesStr] = useState('');

  // New Record Form State
  const [recDate, setRecDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [recWeight, setRecWeight] = useState('');
  const [recHeight, setRecHeight] = useState('');

  // Allergy addition input (in-page)
  const [newAllergy, setNewAllergy] = useState('');

  const activeChild = children.find(c => c.id === activeChildId);

  const handleSavePhoto = (photoUri: string) => {
    if (!activeChildId) return;
    const updated = children.map(c => {
      if (c.id === activeChildId) {
        return { ...c, photoUri };
      }
      return c;
    });
    setChildren(updated);
  };

  const handleAddChild = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChildName || !newChildBirthdate) return;

    const parsedAllergies = newChildAllergiesStr
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const newChild: ChildProfile = {
      id: `child_${Date.now()}`,
      name: newChildName,
      birthdate: newChildBirthdate,
      allergies: parsedAllergies,
      history: []
    };

    const updated = [...children, newChild];
    setChildren(updated);
    setActiveChildId(newChild.id);
    
    // Reset form
    setNewChildName('');
    setNewChildBirthdate('');
    setNewChildAllergiesStr('');
    setShowAddChildModal(false);

    logAnalyticsEvent('add_child_profile', { name: newChild.name });
  };

  const handleDeleteChild = (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar este perfil infantil? Se borrarán todos sus registros de salud permanentemente.')) {
      return;
    }
    const updated = children.filter(c => c.id !== id);
    setChildren(updated);
    logAnalyticsEvent('delete_child_profile', { id });
  };

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChild || !recWeight || !recHeight || !recDate) return;

    const wVal = parseFloat(recWeight);
    const hVal = parseFloat(recHeight);
    if (isNaN(wVal) || isNaN(hVal)) return;

    const newRecord: HealthRecord = {
      id: `rec_${Date.now()}`,
      date: recDate,
      weight: wVal,
      height: hVal
    };

    // Keep history sorted by date
    const newHistory = [...activeChild.history, newRecord].sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    const updated = children.map(c => {
      if (c.id === activeChild.id) {
        return { ...c, history: newHistory };
      }
      return c;
    });

    setChildren(updated);
    setShowAddRecordModal(false);
    
    // Reset record values
    setRecWeight('');
    setRecHeight('');
    setRecDate(new Date().toISOString().split('T')[0]);

    logAnalyticsEvent('add_health_record', { 
      child_id: activeChild.id, 
      weight: wVal, 
      height: hVal 
    });
  };

  const handleDeleteRecord = (recordId: string) => {
    if (!activeChild) return;
    const updated = children.map(c => {
      if (c.id === activeChild.id) {
        return {
          ...c,
          history: c.history.filter(r => r.id !== recordId)
        };
      }
      return c;
    });
    setChildren(updated);
    logAnalyticsEvent('delete_health_record', { recordId });
  };

  const handleAddAllergy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChild || !newAllergy.trim()) return;

    const allergyName = newAllergy.trim();
    if (activeChild.allergies.some(a => a.toLowerCase() === allergyName.toLowerCase())) {
      setNewAllergy('');
      return;
    }

    const updated = children.map(c => {
      if (c.id === activeChild.id) {
        return {
          ...c,
          allergies: [...c.allergies, allergyName]
        };
      }
      return c;
    });

    setChildren(updated);
    setNewAllergy('');
    logAnalyticsEvent('add_child_allergy', { child_id: activeChild.id, allergy: allergyName });
  };

  const handleDeleteAllergy = (allergyName: string) => {
    if (!activeChild) return;
    const updated = children.map(c => {
      if (c.id === activeChild.id) {
        return {
          ...c,
          allergies: c.allergies.filter(a => a !== allergyName)
        };
      }
      return c;
    });
    setChildren(updated);
    logAnalyticsEvent('delete_child_allergy', { child_id: activeChild.id, allergy: allergyName });
  };

  // Age helper
  const getAgeText = (birthdate: string) => {
    if (!birthdate) return '';
    const bDate = new Date(birthdate);
    const today = new Date();
    let years = today.getFullYear() - bDate.getFullYear();
    let months = today.getMonth() - bDate.getMonth();
    
    if (months < 0 || (months === 0 && today.getDate() < bDate.getDate())) {
      years--;
      months += 12;
    }
    
    if (years === 0) {
      if (months === 0) {
        const diffTime = Math.abs(today.getTime() - bDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return `${diffDays} días`;
      }
      return `${months} ${months === 1 ? 'mes' : 'meses'}`;
    }
    
    return `${years} ${years === 1 ? 'año' : 'años'} ${months > 0 ? `y ${months} ${months === 1 ? 'mes' : 'meses'}` : ''}`;
  };

  // Chart data formatting
  const chartData = activeChild?.history.map(h => {
    const d = new Date(h.date);
    const label = d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
    return {
      dateStr: h.date,
      label,
      Peso: h.weight,
      Talla: h.height
    };
  }) || [];

  return (
    <div className="space-y-6 text-left">
      {/* Tab Header Cover */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-lg border border-teal-500">
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-6 translate-y-6 pointer-events-none">
          <Activity className="w-64 h-64" />
        </div>
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-teal-500/50 backdrop-blur-sm border border-teal-400/50 text-white px-2.5 py-1 rounded-full font-black uppercase tracking-widest">
              Control de Crecimiento
            </span>
            <span className="text-[10px] bg-emerald-500/50 backdrop-blur-sm border border-emerald-400/50 text-white px-2.5 py-1 rounded-full font-black uppercase tracking-widest flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-200 animate-pulse" /> 100% Offline
            </span>
          </div>
          <h2 className="text-3xl font-black tracking-tight md:text-4xl">Salud Infantil</h2>
          <p className="text-sm md:text-base text-teal-50/90 font-medium leading-relaxed">
            Registra y haz un seguimiento del peso, la talla y las alergias conocidas de tus niños para tener un control histórico riguroso siempre contigo en tu dispositivo.
          </p>
        </div>
      </div>

      {/* Selector de Perfiles de Niños */}
      <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
          {children.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveChildId(c.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-200 shrink-0 flex items-center gap-2 border cursor-pointer ${
                activeChildId === c.id
                  ? 'bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-600/10'
                  : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-800'
              }`}
            >
              <Baby className={`w-3.5 h-3.5 ${activeChildId === c.id ? 'text-teal-200' : 'text-slate-400'}`} />
              <span>{c.name}</span>
            </button>
          ))}
          
          <button
            onClick={() => setShowAddChildModal(true)}
            className="px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all bg-white hover:bg-slate-100 border border-dashed border-teal-300 text-teal-600 hover:text-teal-700 cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar Niño</span>
          </button>
        </div>

        {activeChild && (
          <button
            onClick={() => handleDeleteChild(activeChild.id)}
            className="text-xs font-bold text-rose-500 hover:text-rose-700 transition-colors flex items-center gap-1 self-end sm:self-auto px-3 py-2 hover:bg-rose-50 rounded-xl"
            title="Eliminar este perfil infantil"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar Perfil</span>
          </button>
        )}
      </div>

      {activeChild ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Ficha General y Alergias (Col 4) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Ficha Perfil */}
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative group shrink-0">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center border border-teal-100 shadow-sm overflow-hidden bg-teal-50 text-teal-600 transition-all group-hover:ring-2 group-hover:ring-teal-500/30">
                    {activeChild.photoUri ? (
                      <img src={activeChild.photoUri} alt={activeChild.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Baby className="w-8 h-8" />
                    )}
                  </div>
                  {/* Camera overlay badge */}
                  <button
                    type="button"
                    onClick={() => setShowCameraModal(true)}
                    className="absolute -bottom-1 -right-1 bg-slate-900 hover:bg-teal-600 active:scale-95 text-white p-1.5 rounded-xl shadow-lg border border-white transition-all cursor-pointer"
                    title="Actualizar foto del perfil"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800">{activeChild.name}</h3>
                  <button
                    type="button"
                    onClick={() => setShowCameraModal(true)}
                    className="text-[10px] text-teal-600 hover:text-teal-700 font-extrabold uppercase tracking-wider flex items-center gap-1 mt-0.5"
                  >
                    <Camera className="w-3 h-3" />
                    <span>Cambiar foto</span>
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-50 pt-3 space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-400">FECHA NACIMIENTO:</span>
                  <span className="font-semibold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                    {new Date(activeChild.birthdate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-400">EDAD ACTUAL:</span>
                  <span className="font-black text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
                    {getAgeText(activeChild.birthdate)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-400">REGISTROS FÍSICOS:</span>
                  <span className="font-bold text-slate-700">
                    {activeChild.history.length} toma(s)
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => {
                    exportChildHealthPDF(activeChild);
                    logAnalyticsEvent('export_pediatric_pdf', { name: activeChild.name });
                  }}
                  className="w-full px-4 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-teal-600/10 hover:shadow-teal-600/20 hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                  title="Exportar informe médico en formato PDF"
                >
                  <FileText className="w-4 h-4 text-teal-200" />
                  <span>Informe para Pediatra (PDF)</span>
                  <Download className="w-3.5 h-3.5 ml-0.5" />
                </button>
              </div>
            </div>

            {/* Alergias Conocidas Card */}
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800">Alergias Conocidas</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Alertas de salud</p>
                  </div>
                </div>
                <span className="text-[10px] bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full font-black">
                  {activeChild.allergies.length}
                </span>
              </div>

              {/* Add Allergy inline form */}
              <form onSubmit={handleAddAllergy} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ej. Alimento, Fármaco..."
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  className="flex-1 text-xs border border-slate-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-200 rounded-xl px-3 py-2 font-semibold bg-slate-50/50"
                />
                <button
                  type="submit"
                  className="px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir</span>
                </button>
              </form>

              {activeChild.allergies.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {activeChild.allergies.map(allergy => (
                    <span
                      key={allergy}
                      className="inline-flex items-center gap-1 text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-100 pl-2.5 pr-1.5 py-1 rounded-xl"
                    >
                      <span>{allergy}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteAllergy(allergy)}
                        className="p-0.5 hover:bg-rose-100 text-rose-400 hover:text-rose-800 rounded-md transition-colors cursor-pointer"
                        title="Eliminar alergia"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 rounded-2xl p-4 text-center border border-dashed border-slate-200">
                  <Check className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                  <p className="text-xs font-semibold text-slate-500">Sin alergias conocidas registradas.</p>
                  <p className="text-[10px] text-slate-400">Usa el campo superior para registrarlas si existen.</p>
                </div>
              )}
            </div>
          </div>

          {/* Histórico, Gráfico y Botón de Registro (Col 8) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Gráfico de Evolución */}
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-50 pb-3">
                <div>
                  <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-teal-600 animate-pulse" /> Evolución de Peso y Talla
                  </h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Historial acumulado del crecimiento</p>
                </div>
                
                <button
                  onClick={() => setShowAddRecordModal(true)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all shadow-sm shadow-teal-600/15 cursor-pointer flex items-center justify-center gap-1.5 self-start sm:self-auto"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Nuevo Registro (Peso/Talla)</span>
                </button>
              </div>

              {chartData.length > 1 ? (
                <div className="h-[260px] w-full pt-2 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="label" stroke="#94A3B8" fontSize={9} fontWeight="bold" tickLine={false} />
                      <YAxis yAxisId="left" stroke="#0D9488" fontSize={9} fontWeight="bold" tickLine={false} unit=" kg" />
                      <YAxis yAxisId="right" orientation="right" stroke="#2563EB" fontSize={9} fontWeight="bold" tickLine={false} unit=" cm" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1E293B', 
                          border: 'none', 
                          borderRadius: '16px', 
                          color: '#FFF',
                          fontSize: '11px',
                          fontWeight: 'semibold',
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                        }} 
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                      <Line yAxisId="left" type="monotone" dataKey="Peso" stroke="#0D9488" strokeWidth={3} activeDot={{ r: 6 }} name="Peso (kg)" />
                      <Line yAxisId="right" type="monotone" dataKey="Talla" stroke="#2563EB" strokeWidth={3} activeDot={{ r: 6 }} name="Talla (cm)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-2xl py-12 px-6 text-center border border-dashed border-slate-200">
                  <Scale className="w-10 h-10 text-slate-300 stroke-[1.5] mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-600">Faltan datos históricos</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    Registra al menos 2 tomas de peso y talla para poder visualizar el gráfico de la curva de crecimiento de {activeChild.name}.
                  </p>
                </div>
              )}
            </div>

            {/* Tabla de registros históricos */}
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-black text-slate-800">Historial de Mediciones</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Toma de datos históricos guardados</p>
              </div>

              {activeChild.history.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="py-2.5">Fecha</th>
                        <th className="py-2.5">Peso (kg)</th>
                        <th className="py-2.5">Talla (cm)</th>
                        <th className="py-2.5 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                      {activeChild.history.map((record) => (
                        <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-2.5 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {new Date(record.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </td>
                          <td className="py-2.5 text-teal-700 font-bold">
                            {record.weight.toFixed(1)} kg
                          </td>
                          <td className="py-2.5 text-blue-700 font-bold">
                            {record.height.toFixed(1)} cm
                          </td>
                          <td className="py-2.5 text-right">
                            <button
                              onClick={() => handleDeleteRecord(record.id)}
                              className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer p-1 rounded-lg"
                              title="Eliminar este registro"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-2xl py-6 text-center text-slate-400 font-semibold text-xs border border-dashed border-slate-200">
                  Ninguna medición guardada. Pulsa el botón superior para agregar la primera.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-dashed border-teal-200 rounded-3xl p-12 text-center max-w-lg mx-auto space-y-4">
          <Baby className="w-16 h-16 text-teal-400 mx-auto" />
          <h3 className="text-xl font-black text-slate-800">¡Bienvenido a Salud Infantil!</h3>
          <p className="text-sm font-semibold text-slate-600 leading-relaxed">
            No tienes perfiles infantiles configurados en el dispositivo. Agrega el primero de forma local y segura para empezar a llevar el control del peso, la talla y las alergias.
          </p>
          <button
            onClick={() => setShowAddChildModal(true)}
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black uppercase tracking-wider rounded-2xl transition-all shadow-md shadow-teal-600/15 cursor-pointer flex items-center gap-2 mx-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Primer Niño</span>
          </button>
        </div>
      )}

      {/* MODAL: ADD CHILD */}
      {showAddChildModal && (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative text-left">
            <h3 className="text-xl font-black text-slate-800 mb-2 flex items-center gap-1.5">
              <Baby className="w-5 h-5 text-teal-600" /> Registrar Perfil Infantil
            </h3>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-5">Guardado 100% local en tu dispositivo</p>
            
            <form onSubmit={handleAddChild} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nombre del Niño / Bebé</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Sofía, Mateo..."
                  value={newChildName}
                  onChange={(e) => setNewChildName(e.target.value)}
                  className="w-full text-xs border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 rounded-xl px-3 py-2.5 font-semibold bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Fecha de Nacimiento</label>
                <input
                  type="date"
                  required
                  value={newChildBirthdate}
                  onChange={(e) => setNewChildBirthdate(e.target.value)}
                  className="w-full text-xs border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 rounded-xl px-3 py-2.5 font-semibold bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Alergias conocidas (Opcional)</label>
                <span className="text-[10px] text-slate-400 block mb-1.5">Sepáralas por comas si son varias</span>
                <input
                  type="text"
                  placeholder="Ej. Nueces, Amoxicilina, Lactosa"
                  value={newChildAllergiesStr}
                  onChange={(e) => setNewChildAllergiesStr(e.target.value)}
                  className="w-full text-xs border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 rounded-xl px-3 py-2.5 font-semibold bg-slate-50"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddChildModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer text-center"
                >
                  Guardar Perfil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD RECORD */}
      {showAddRecordModal && activeChild && (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative text-left">
            <h3 className="text-xl font-black text-slate-800 mb-2 flex items-center gap-1.5">
              <Scale className="w-5 h-5 text-teal-600" /> Registrar Medidas de {activeChild.name}
            </h3>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-5">Toma de Peso y Talla actual</p>
            
            <form onSubmit={handleAddRecord} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Fecha de la Medición</label>
                <input
                  type="date"
                  required
                  value={recDate}
                  onChange={(e) => setRecDate(e.target.value)}
                  className="w-full text-xs border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 rounded-xl px-3 py-2.5 font-semibold bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5 text-teal-600" /> Peso (kg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Ej. 7.5"
                    value={recWeight}
                    onChange={(e) => setRecWeight(e.target.value)}
                    className="w-full text-xs border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 rounded-xl px-3 py-2.5 font-semibold bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Ruler className="w-3.5 h-3.5 text-blue-600" /> Talla (cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="Ej. 68"
                    value={recHeight}
                    onChange={(e) => setRecHeight(e.target.value)}
                    className="w-full text-xs border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 rounded-xl px-3 py-2.5 font-semibold bg-slate-50"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddRecordModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer text-center"
                >
                  Guardar Datos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Camera Photo Modal */}
      {showCameraModal && activeChild && (
        <ChildPhotoCamera
          isOpen={showCameraModal}
          onClose={() => setShowCameraModal(false)}
          onPhotoCapture={handleSavePhoto}
          childName={activeChild.name}
        />
      )}
    </div>
  );
}
