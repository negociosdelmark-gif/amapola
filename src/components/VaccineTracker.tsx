import { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Clock, Search, Printer, ShieldAlert, CheckCircle2, Award, Sparkles } from 'lucide-react';
import { Vaccine } from '../types';
import { logAnalyticsEvent } from '../lib/firebase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const INITIAL_VACCINES: Vaccine[] = [
  { id: '1', name: 'BCG (Tuberculosis)', disease: 'Tuberculosis meningitis', ageMonths: 0, ageText: 'Recién Nacido', status: 'PENDING' },
  { id: '2', name: 'Hepatitis B (Dosis Recién Nacido)', disease: 'Hepatitis B', ageMonths: 0, ageText: 'Recién Nacido', status: 'PENDING' },
  { id: '3', name: 'Pentavalente (1ra Dosis)', disease: 'Difteria, Tétanos, Tos ferina, Hepatitis B, Influenza tipo B', ageMonths: 2, ageText: '2 meses', status: 'PENDING' },
  { id: '4', name: 'Polio Oral/Inyectable (1ra Dosis)', disease: 'Poliomielitis', ageMonths: 2, ageText: '2 meses', status: 'PENDING' },
  { id: '5', name: 'Rotavirus (1ra Dosis)', disease: 'Diarrea severa por Rotavirus', ageMonths: 2, ageText: '2 meses', status: 'PENDING' },
  { id: '6', name: 'Neumococo Conjugado (1ra Dosis)', disease: 'Neumonía, Meningitis, Otitis', ageMonths: 2, ageText: '2 meses', status: 'PENDING' },
  { id: '7', name: 'Pentavalente (2da Dosis)', disease: 'Difteria, Tétanos, Tos ferina, Hepatitis B, Influenza tipo B', ageMonths: 4, ageText: '4 meses', status: 'PENDING' },
  { id: '8', name: 'Polio (2da Dosis)', disease: 'Poliomielitis', ageMonths: 4, ageText: '4 meses', status: 'PENDING' },
  { id: '9', name: 'Rotavirus (2da Dosis)', disease: 'Diarrea severa por Rotavirus', ageMonths: 4, ageText: '4 meses', status: 'PENDING' },
  { id: '10', name: 'Neumococo Conjugado (2da Dosis)', disease: 'Neumonía, Meningitis, Otitis', ageMonths: 4, ageText: '4 meses', status: 'PENDING' },
  { id: '11', name: 'Pentavalente (3ra Dosis)', disease: 'Difteria, Tétanos, Tos ferina, Hepatitis B, Influenza tipo B', ageMonths: 6, ageText: '6 meses', status: 'PENDING' },
  { id: '12', name: 'Polio (3ra Dosis)', disease: 'Poliomielitis', ageMonths: 6, ageText: '6 meses', status: 'PENDING' },
  { id: '13', name: 'Influenza Estacional (1ra Dosis)', disease: 'Gripe e infecciones respiratorias', ageMonths: 6, ageText: '6 meses', status: 'PENDING' },
  { id: '14', name: 'Triple Viral - SRP (1ra Dosis)', disease: 'Sarampión, Rubeola, Parotiditis', ageMonths: 12, ageText: '12 meses', status: 'PENDING' },
  { id: '15', name: 'Fiebre Amarilla', disease: 'Fiebre Amarilla', ageMonths: 12, ageText: '12 meses', status: 'PENDING' },
  { id: '16', name: 'Neumococo Conjugado (Refuerzo)', disease: 'Neumonía, Meningitis, Otitis', ageMonths: 12, ageText: '12 meses', status: 'PENDING' },
  { id: '17', name: 'DPT (1er Refuerzo)', disease: 'Difteria, Tétanos, Tos ferina', ageMonths: 18, ageText: '18 meses', status: 'PENDING' },
  { id: '18', name: 'Polio (1er Refuerzo)', disease: 'Poliomielitis', ageMonths: 18, ageText: '18 meses', status: 'PENDING' },
  { id: '19', name: 'Triple Viral - SRP (Refuerzo)', disease: 'Sarampión, Rubeola, Parotiditis', ageMonths: 60, ageText: '5 años', status: 'PENDING' },
  { id: '20', name: 'DPT (2do Refuerzo)', disease: 'Difteria, Tétanos, Tos ferina', ageMonths: 60, ageText: '5 años', status: 'PENDING' }
];

export default function VaccineTracker() {
  const [vaccines, setVaccines] = useState<Vaccine[]>(() => {
    const saved = localStorage.getItem('amapola_vaccines');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return INITIAL_VACCINES; }
    }
    return INITIAL_VACCINES;
  });

  const [filterAge, setFilterAge] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedVaccine, setSelectedVaccine] = useState<Vaccine | null>(null);
  
  // Modal states for registration
  const [showModal, setShowModal] = useState(false);
  const [adminDate, setAdminDate] = useState('');
  const [batch, setBatch] = useState('');
  const [facility, setFacility] = useState('');
  const [notes, setNotes] = useState('');

  // Child Info States
  const [childName, setChildName] = useState(() => localStorage.getItem('amapola_child_name') || 'Mi Bebé');
  const [childBirthdate, setChildBirthdate] = useState(() => localStorage.getItem('amapola_child_birthdate') || '');

  useEffect(() => {
    localStorage.setItem('amapola_vaccines', JSON.stringify(vaccines));
  }, [vaccines]);

  useEffect(() => {
    localStorage.setItem('amapola_child_name', childName);
  }, [childName]);

  useEffect(() => {
    localStorage.setItem('amapola_child_birthdate', childBirthdate);
  }, [childBirthdate]);

  const handleMarkComplete = (vac: Vaccine) => {
    setSelectedVaccine(vac);
    setAdminDate(vac.dateAdministered || new Date().toISOString().split('T')[0]);
    setBatch(vac.batchNumber || '');
    setFacility(vac.facility || '');
    setNotes(vac.notes || '');
    setShowModal(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVaccine) return;

    setVaccines(prev => prev.map(v => {
      if (v.id === selectedVaccine.id) {
        return {
          ...v,
          status: 'COMPLETED',
          dateAdministered: adminDate,
          batchNumber: batch,
          facility,
          notes
        };
      }
      return v;
    }));

    logAnalyticsEvent('save_vaccine', { 
      vaccine_name: selectedVaccine.name, 
      date: adminDate,
      facility 
    });

    setShowModal(false);
    setSelectedVaccine(null);
  };

  const handleResetStatus = (id: string) => {
    setVaccines(prev => prev.map(v => {
      if (v.id === id) {
        return {
          ...v,
          status: 'PENDING',
          dateAdministered: undefined,
          batchNumber: undefined,
          facility: undefined,
          notes: undefined
        };
      }
      return v;
    }));
    logAnalyticsEvent('reset_vaccine', { id });
  };

  const completedCount = vaccines.filter(v => v.status === 'COMPLETED').length;
  const pendingCount = vaccines.filter(v => v.status === 'PENDING').length;
  const completionPercent = vaccines.length ? Math.round((completedCount / vaccines.length) * 100) : 0;

  const getChildAgeMonths = (): number => {
    if (!childBirthdate) return 0;
    const birth = new Date(childBirthdate);
    const now = new Date();
    const yearsDiff = now.getFullYear() - birth.getFullYear();
    const monthsDiff = now.getMonth() - birth.getMonth();
    const totalMonths = yearsDiff * 12 + monthsDiff;
    return Math.max(0, totalMonths);
  };

  const childAgeMonths = childBirthdate ? getChildAgeMonths() : null;

  const upcomingVaccinesNext12Months = vaccines.filter(v => {
    if (childAgeMonths === null) {
      // Default fallback: show vaccines up to 12 months if no birthdate is set
      return v.ageMonths <= 12;
    }
    // Show vaccines in the window [childAgeMonths, childAgeMonths + 12]
    return v.ageMonths >= childAgeMonths && v.ageMonths <= childAgeMonths + 12;
  }).sort((a, b) => a.ageMonths - b.ageMonths);

  const milestoneData = [
    { ageMonths: 0, label: 'Recién Nacido', name: 'R. Nacido' },
    { ageMonths: 2, label: '2 meses', name: '2 meses' },
    { ageMonths: 4, label: '4 meses', name: '4 meses' },
    { ageMonths: 6, label: '6 meses', name: '6 meses' },
    { ageMonths: 12, label: '12 meses', name: '12 meses' },
    { ageMonths: 18, label: '18 meses', name: '18 meses' },
    { ageMonths: 60, label: '5 años', name: '5 años' }
  ].map(m => {
    const vaccinesForAge = vaccines.filter(v => v.ageMonths === m.ageMonths);
    const aplicadas = vaccinesForAge.filter(v => v.status === 'COMPLETED').length;
    const pendientes = vaccinesForAge.filter(v => v.status === 'PENDING').length;
    return {
      ...m,
      'Aplicadas': aplicadas,
      'Pendientes': pendientes,
      'Total': vaccinesForAge.length
    };
  });

  const ages = Array.from(new Set(vaccines.map(v => v.ageText)));

  const filteredVaccines = vaccines.filter(v => {
    const matchesAge = filterAge === 'all' || v.ageText === filterAge;
    const matchesStatus = filterStatus === 'all' || v.status === filterStatus;
    const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          v.disease.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesAge && matchesStatus && matchesSearch;
  });

  const handlePrint = () => {
    logAnalyticsEvent('print_vaccines');
    window.print();
  };

  return (
    <div id="vaccine-tracker-root" className="bg-white border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6 md:p-8 shadow-sm space-y-6 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-500" />
            Esquema Oficial de Vacunación Infantil
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Controla de manera segura y confidencial la inmunización de tu hijo de acuerdo al calendario pediátrico.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer w-full md:w-auto"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Imprimir Cartilla PAI</span>
        </button>
      </div>

      {/* Child Information Section */}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Nombre del Infante:</label>
          <input
            type="text"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            className="w-full bg-white border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 transition-colors"
            placeholder="Nombre de tu hijo/a"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Fecha de Nacimiento:</label>
          <input
            type="date"
            value={childBirthdate}
            onChange={(e) => setChildBirthdate(e.target.value)}
            className="w-full bg-white border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* Progress & Metrics Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-6 flex items-center gap-6">
          <div className="p-3 bg-emerald-500 text-white rounded-xl">
            <Award className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="text-xs font-black text-emerald-700/80 uppercase tracking-widest">Inmunización</div>
            <div className="text-xl font-black text-emerald-900">{completionPercent}% Completo</div>
            <p className="text-xs text-emerald-600 font-medium">Mantén al día la cartilla de salud.</p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex items-center gap-6">
          <div className="p-3 bg-slate-200 text-slate-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Administradas</div>
            <div className="text-xl font-black text-slate-900">{completedCount} vacunas</div>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">Registradas con éxito.</p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex items-center gap-6">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Pendientes / Siguientes</div>
            <div className="text-xl font-black text-amber-700">{pendingCount} dosis</div>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">Verifica las fechas próximas.</p>
          </div>
        </div>
      </div>

      {/* Dashboard de Vacunación con Recharts */}
      <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              Cronograma Inteligente de Vacunación (Siguientes 12 Meses)
            </h4>
            <p className="text-xs text-slate-500 font-medium">
              {childBirthdate 
                ? `Visualización personalizada para ${childName} (${childAgeMonths} meses de edad).`
                : "Agrega la fecha de nacimiento arriba para activar el cronograma personalizado de tu bebé."
              }
            </p>
          </div>
          {childAgeMonths !== null && (
            <span className="text-xs font-black bg-rose-50 text-rose-700 px-3 py-1.5 rounded-xl border border-rose-100 shrink-0">
              Edad de {childName}: {childAgeMonths} {childAgeMonths === 1 ? 'mes' : 'meses'}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Gráfico de Recharts (Col 7) */}
          <div className="lg:col-span-7 bg-white p-4 md:p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Inmunización por Grupos de Edad</h5>
            <div className="h-64 w-full text-xs font-medium">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={milestoneData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: '#64748b', fontWeight: 600, fontSize: 10 }}
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: '#64748b', fontWeight: 600, fontSize: 10 }}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      borderRadius: '12px', 
                      border: 'none',
                      color: '#f8fafc',
                      fontSize: '11px',
                      fontWeight: 600,
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                    }}
                    cursor={{ fill: '#f8fafc', opacity: 0.4 }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={36}
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '11px', fontWeight: 700, paddingBottom: '10px' }}
                  />
                  <Bar dataKey="Aplicadas" name="Aplicadas (Dosis)" stackId="a" fill="#10b981" />
                  <Bar dataKey="Pendientes" name="Pendientes (Dosis)" stackId="a" fill="#cbd5e1" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-3 font-semibold">
              * Las barras muestran las dosis aplicadas en verde y pendientes en gris para cada hito de edad.
            </p>
          </div>

          {/* Siguientes Vacunas / Próximos Hitos (Col 5) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                {childBirthdate ? `Hitos en los Próximos 12 Meses` : "Primeros 12 Meses de Vida"}
              </h5>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {upcomingVaccinesNext12Months.length} dosis encontradas
              </span>
            </div>

            <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
              {upcomingVaccinesNext12Months.length === 0 ? (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 text-center text-xs font-semibold text-slate-400">
                  No hay vacunas programadas en esta ventana de edad. ¡Vas al día!
                </div>
              ) : (
                upcomingVaccinesNext12Months.map(vac => {
                  const isCompleted = vac.status === 'COMPLETED';
                  return (
                    <div 
                      key={vac.id} 
                      className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 bg-white hover:border-slate-300 ${
                        isCompleted ? 'border-emerald-100 bg-emerald-50/5' : 'border-slate-100'
                      }`}
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {vac.ageText}
                          </span>
                          {isCompleted ? (
                            <span className="text-[9px] font-black text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-sm flex items-center gap-0.5">
                              ✓ Aplicada
                            </span>
                          ) : (
                            <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-sm flex items-center gap-0.5 animate-pulse">
                              ⏳ Pendiente
                            </span>
                          )}
                        </div>
                        <h6 className="font-bold text-slate-800 text-xs truncate">{vac.name}</h6>
                        <p className="text-[11px] text-slate-400 truncate leading-relaxed">
                          {vac.disease}
                        </p>
                      </div>

                      {!isCompleted && (
                        <button
                          onClick={() => handleMarkComplete(vac)}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-[10px] shadow-xs cursor-pointer transition-all shrink-0"
                        >
                          Registrar
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            
            {childBirthdate && (
              <div className="bg-emerald-50/35 border border-emerald-100/50 p-4 rounded-2xl text-xs font-semibold text-emerald-800 leading-relaxed space-y-1">
                <span className="flex items-center gap-1 font-bold">
                  <ShieldAlert className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Estado de Protección:
                </span>
                <p className="text-[11px] text-emerald-700 font-medium leading-relaxed">
                  {childName} ha completado {upcomingVaccinesNext12Months.filter(v => v.status === 'COMPLETED').length} de {upcomingVaccinesNext12Months.length} vacunas programadas en esta ventana de 12 meses. ¡Sigue así!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch justify-between">
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-slate-300 transition-all"
            placeholder="Buscar vacuna por nombre, dosis o enfermedad..."
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-2 shrink-0">
          <select
            value={filterAge}
            onChange={(e) => setFilterAge(e.target.value)}
            className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">Todas las edades</option>
            {ages.map(age => (
              <option key={age} value={age}>{age}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">Todos los estados</option>
            <option value="PENDING">Pendiente</option>
            <option value="COMPLETED">Aplicada</option>
          </select>
        </div>
      </div>

      {/* Vaccine List Display */}
      <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white">
        {filteredVaccines.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 font-semibold bg-slate-50/50">
            Ninguna vacuna coincide con los filtros especificados.
          </div>
        ) : (
          filteredVaccines.map(vac => {
            const isCompleted = vac.status === 'COMPLETED';
            return (
              <div
                key={vac.id}
                className={`p-6 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-6 ${
                  isCompleted ? 'bg-emerald-50/10' : 'bg-white hover:bg-slate-50/40'
                }`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                    isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {isCompleted ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h4 className="font-bold text-slate-900 text-xs">{vac.name}</h4>
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500">
                        {vac.ageText}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium leading-relaxed">
                      <strong>Protege contra:</strong> {vac.disease}
                    </p>
                    {isCompleted && (
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-500 leading-relaxed bg-emerald-50/30 border border-emerald-100/50 p-2 rounded-lg mt-1 font-mono">
                        <span><strong>Fecha:</strong> {vac.dateAdministered}</span>
                        {vac.batchNumber && <span><strong>Lote:</strong> {vac.batchNumber}</span>}
                        {vac.facility && <span><strong>Centro:</strong> {vac.facility}</span>}
                        {vac.notes && <span className="block w-full text-slate-500 mt-0.5 italic">" {vac.notes} "</span>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {isCompleted ? (
                    <button
                      onClick={() => handleResetStatus(vac.id)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold rounded-lg text-xs transition-all cursor-pointer"
                    >
                      Restablecer
                    </button>
                  ) : (
                    <button
                      onClick={() => handleMarkComplete(vac)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-xs shadow-sm cursor-pointer transition-all"
                    >
                      Registrar Aplicación
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Custom immunization warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-3">
        <ShieldAlert className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5 text-xs text-amber-900">
          <h5 className="font-bold">Advertencia Sanitaria del Esquema PAI:</h5>
          <p className="leading-relaxed">
            Las vacunas son fundamentales para el óptimo desarrollo de tu bebé. El retraso en la dosificación puede comprometer el nivel de protección inmunológica. Siempre consulta a tu pediatra de confianza para resolver inquietudes particulares.
          </p>
        </div>
      </div>

      {/* Modal for Vaccination Entry */}
      {showModal && selectedVaccine && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-100 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <h4 className="text-sm font-black text-slate-900">Registrar Dosis Infantil</h4>
              <button
                onClick={() => { setShowModal(false); setSelectedVaccine(null); }}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-0.5">
                <span className="text-xs text-slate-400 font-bold">VACUNA:</span>
                <p className="font-black text-slate-900">{selectedVaccine.name}</p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Fecha de Administración:</label>
                <input
                  type="date"
                  required
                  value={adminDate}
                  onChange={(e) => setAdminDate(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-lg px-3 py-2 font-semibold text-slate-800 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Número de Lote:</label>
                  <input
                    type="text"
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-lg px-3 py-2 font-bold text-slate-800 focus:outline-none"
                    placeholder="Ej. B4928"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">IPS / Centro de Salud:</label>
                  <input
                    type="text"
                    value={facility}
                    onChange={(e) => setFacility(e.target.value)}
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-lg px-3 py-2 font-bold text-slate-800 focus:outline-none"
                    placeholder="Ej. Clínica Infantil"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Notas adicionales / Síntomas:</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-800 focus:outline-none"
                  placeholder="Ej. Presentó fiebre leve por 12 horas, controlado con paracetamol pediátrico."
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setSelectedVaccine(null); }}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl text-center hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-center shadow-md shadow-emerald-600/10 transition-all cursor-pointer"
                >
                  Confirmar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
