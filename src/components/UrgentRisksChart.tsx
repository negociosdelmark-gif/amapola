import { useState } from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, Filter, Calendar, Download, ExternalLink, Bell, ChevronDown } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { getGoogleCalendarLink, getOutlookCalendarLink, downloadICSFile } from '../utils/calendar';
import { logAnalyticsEvent } from '../lib/firebase';

interface Hazard {
  id: string;
  text: string;
  completed: boolean;
  urgency?: 'Alta' | 'Media' | 'Baja';
  rationale?: string;
}

interface PreventionTopic {
  id: string;
  room: string;
  title: string;
  image: string;
  effort: 'Fácil' | 'Medio' | 'Difícil';
  hazards: Hazard[];
  guideline: string;
  expandedInfo: string;
  selectedIcon?: string;
}

interface UrgentRisksChartProps {
  preventionTopics: PreventionTopic[];
  toggleHazard: (topicId: string, hazardId: string) => void;
  handleDownloadTaskICS?: (taskName: string, roomName: string, frequencyMonths?: number) => void;
}

export default function UrgentRisksChart({ preventionTopics, toggleHazard, handleDownloadTaskICS }: UrgentRisksChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [urgencyFilter, setUrgencyFilter] = useState<'Todas' | 'Alta' | 'Media' | 'Baja'>('Todas');
  const [selectedRoom, setSelectedRoom] = useState<string>('Todas');
  const [timeRange, setTimeRange] = useState<'Semanal' | 'Mensual'>('Mensual');
  const [showCalendarDropdown, setShowCalendarDropdown] = useState(false);

  // Dynamic set of rooms that have pending risks
  const rooms = Array.from(new Set(preventionTopics.map(topic => topic.room)));

  // Gather uncompleted hazards
  const getUrgentRisks = () => {
    const list: {
      id: string;
      text: string;
      room: string;
      topicId: string;
      urgency: 'Alta' | 'Media' | 'Baja';
      urgencyScore: number;
      rationale: string;
      effort: 'Fácil' | 'Medio' | 'Difícil';
    }[] = [];

    preventionTopics.forEach(topic => {
      topic.hazards.forEach(hazard => {
        if (!hazard.completed) {
          const urgency = hazard.urgency || 'Media';
          let urgencyScore = 2;
          if (urgency === 'Alta') urgencyScore = 3;
          if (urgency === 'Baja') urgencyScore = 1;

          list.push({
            id: hazard.id,
            text: hazard.text,
            room: topic.room,
            topicId: topic.id,
            urgency,
            urgencyScore,
            rationale: hazard.rationale || 'Prevención recomendada para la seguridad del bebé.',
            effort: topic.effort,
          });
        }
      });
    });

    // Sort by score desc, then by alphabetical text
    return list.sort((a, b) => b.urgencyScore - a.urgencyScore || a.text.localeCompare(b.text));
  };

  const allUrgentRisks = getUrgentRisks();

  // Filter based on selected urgency level, selected room, and time range
  const filteredRisks = allUrgentRisks.filter(risk => {
    // 1. Urgency Filter
    if (urgencyFilter !== 'Todas' && risk.urgency !== urgencyFilter) {
      return false;
    }

    // 2. Room Filter
    if (selectedRoom !== 'Todas' && risk.room !== selectedRoom) {
      return false;
    }

    // 3. Time Range Filter (Semanal: only Alta urgency or Fácil effort tasks; Mensual: all tasks)
    if (timeRange === 'Semanal') {
      return risk.urgency === 'Alta' || risk.effort === 'Fácil';
    }

    return true;
  });

  // Limit to top 5 for visual chart mapping
  const chartData = filteredRisks.slice(0, 5).map(risk => {
    const shortText = risk.text.length > 20 ? risk.text.substring(0, 20) + '...' : risk.text;
    return {
      name: risk.text,
      shortName: shortText,
      displayName: `[${risk.room}] ${shortText}`,
      room: risk.room,
      score: risk.urgencyScore,
      urgency: risk.urgency,
      rationale: risk.rationale,
      id: risk.id,
      topicId: risk.topicId,
    };
  });

  const getUrgencyColor = (urgency: 'Alta' | 'Media' | 'Baja') => {
    if (urgency === 'Alta') return '#F43F5E'; // rose-500
    if (urgency === 'Media') return '#F59E0B'; // amber-500
    return '#3B82F6'; // blue-500
  };

  const getUrgencyBg = (urgency: 'Alta' | 'Media' | 'Baja') => {
    if (urgency === 'Alta') return 'bg-rose-50 text-rose-700 border-rose-200';
    if (urgency === 'Media') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  if (allUrgentRisks.length === 0) {
    return (
      <div className="bg-gradient-to-br from-emerald-50 via-teal-50/30 to-white border border-emerald-100 rounded-3xl p-6 md:p-8 text-center space-y-4 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <Sparkles className="w-7 h-7 animate-pulse" />
        </div>
        <div className="space-y-1.5 max-w-md mx-auto">
          <h3 className="text-lg font-black text-slate-800">¡Hogar 100% Asegurado!</h3>
          <p className="text-sm font-semibold text-slate-600 leading-relaxed">
            No tienes riesgos pendientes de prevención. Has resuelto todos los puntos críticos para la seguridad de tu bebé. ¡Excelente trabajo de prevención!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6 md:p-8 flex flex-col gap-6 text-left">
      {/* Header */}
      <div className="border-b border-slate-50 pb-4">
        <span className="text-xs font-black uppercase tracking-widest text-rose-600 flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4" /> Alertas de Prioridad
        </span>
        <h3 className="text-xl font-black text-slate-800 mt-1">Lista de Acción Rápida y Gráfico</h3>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Controla, analiza y filtra los riesgos críticos de tu hogar</p>
      </div>

      {/* Unified Interactive Filters Suite */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-100/80">
        
        {/* Temporal Range Selector (3 cols) */}
        <div className="lg:col-span-3 space-y-1.5">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Rango de Análisis
          </span>
          <div className="flex bg-white p-1 rounded-xl border border-slate-100 shadow-sm">
            <button
              type="button"
              onClick={() => {
                setTimeRange('Semanal');
                logAnalyticsEvent('change_time_range_semanal', {});
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer text-center ${
                timeRange === 'Semanal'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Semanal
            </button>
            <button
              type="button"
              onClick={() => {
                setTimeRange('Mensual');
                logAnalyticsEvent('change_time_range_mensual', {});
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer text-center ${
                timeRange === 'Mensual'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Mensual
            </button>
          </div>
          <span className="block text-[9px] text-slate-400 font-semibold italic">
            {timeRange === 'Semanal' 
              ? 'Foco inmediato: Urgencia Alta o Esfuerzo Fácil' 
              : 'Vista global: Todas las tareas pendientes'}
          </span>
        </div>

        {/* Urgency Filter Badges (5 cols) */}
        <div className="lg:col-span-5 space-y-1.5">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-rose-500" /> Nivel de Urgencia
          </span>
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => setUrgencyFilter('Todas')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                urgencyFilter === 'Todas'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200/60 text-slate-500 hover:text-slate-800'
              }`}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => setUrgencyFilter('Alta')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-1 ${
                urgencyFilter === 'Alta'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200/60 text-rose-600 hover:bg-rose-50'
              }`}
            >
              <span className={`w-1 h-1 rounded-full ${urgencyFilter === 'Alta' ? 'bg-white' : 'bg-rose-500'}`} />
              Alta ({allUrgentRisks.filter(r => r.urgency === 'Alta').length})
            </button>
            <button
              type="button"
              onClick={() => setUrgencyFilter('Media')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-1 ${
                urgencyFilter === 'Media'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-white border border-slate-200/60 text-amber-600 hover:bg-amber-50'
              }`}
            >
              <span className={`w-1 h-1 rounded-full ${urgencyFilter === 'Media' ? 'bg-white' : 'bg-amber-500'}`} />
              Media ({allUrgentRisks.filter(r => r.urgency === 'Media').length})
            </button>
            <button
              type="button"
              onClick={() => setUrgencyFilter('Baja')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-1 ${
                urgencyFilter === 'Baja'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200/60 text-blue-600 hover:bg-blue-50'
              }`}
            >
              <span className={`w-1 h-1 rounded-full ${urgencyFilter === 'Baja' ? 'bg-white' : 'bg-blue-500'}`} />
              Baja ({allUrgentRisks.filter(r => r.urgency === 'Baja').length})
            </button>
          </div>
        </div>

        {/* Room Filter Pills (4 cols) */}
        <div className="lg:col-span-4 space-y-1.5">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
            🏠 Por Habitación
          </span>
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none max-w-full">
            <button
              type="button"
              onClick={() => {
                setSelectedRoom('Todas');
                logAnalyticsEvent('change_room_filter_all', {});
              }}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer shrink-0 ${
                selectedRoom === 'Todas'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200/60 text-slate-500 hover:text-slate-800'
              }`}
            >
              Todas
            </button>
            {rooms.map(room => {
              const count = allUrgentRisks.filter(r => r.room === room).length;
              return (
                <button
                  key={room}
                  type="button"
                  onClick={() => {
                    setSelectedRoom(room);
                    logAnalyticsEvent('change_room_filter_specific', { room });
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer shrink-0 ${
                    selectedRoom === room
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white border border-slate-200/60 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {room} ({count})
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {filteredRisks.length === 0 ? (
        <div className="py-12 px-6 text-center bg-slate-50 border border-dashed border-slate-200 rounded-3xl space-y-3">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-black text-slate-700">¡Ningún riesgo pendiente con esta selección!</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed font-semibold">
              No hay riesgos con Urgencia <strong className="text-slate-700">"{urgencyFilter}"</strong> en la habitación <strong className="text-slate-700">"{selectedRoom}"</strong> para el rango <strong className="text-slate-700">"{timeRange}"</strong> sin resolver. ¡Gran trabajo de prevención!
            </p>
            <button
              type="button"
              onClick={() => {
                setUrgencyFilter('Todas');
                setSelectedRoom('Todas');
                setTimeRange('Mensual');
              }}
              className="mt-3 px-4 py-1.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer hover:bg-slate-800 transition-all active:scale-95"
            >
              Restablecer Filtros
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Recharts Bar Chart representing filtered subset */}
          <div className="lg:col-span-7 h-[230px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={chartData}
                margin={{ top: 10, right: 15, left: -10, bottom: 5 }}
              >
                <XAxis 
                  type="number" 
                  domain={[0, 3]} 
                  ticks={[1, 2, 3]} 
                  tickLine={false}
                  axisLine={false}
                  tick={({ x, y, payload }) => {
                    let label = '';
                    if (payload.value === 1) label = 'Baja';
                    if (payload.value === 2) label = 'Media';
                    if (payload.value === 3) label = 'Alta';
                    return (
                      <text x={x} y={y + 12} fill="#94A3B8" fontSize={9} fontWeight="bold" textAnchor="middle">
                        {label}
                      </text>
                    );
                  }}
                />
                <YAxis 
                  type="category" 
                  dataKey="displayName" 
                  stroke="#64748B" 
                  fontSize={9} 
                  fontWeight="black"
                  width={120} 
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: '#F8FAFC' }}
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: 'none',
                    borderRadius: '16px',
                    color: '#FFF',
                    fontSize: '11px',
                    fontWeight: 'semibold',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    maxWidth: '280px'
                  }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 space-y-1.5 text-left text-white max-w-[280px]">
                          <div className="flex items-center gap-1.5 justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 bg-rose-950/50 px-2 py-0.5 rounded-full">
                              {data.room}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                              Urgencia: {data.urgency}
                            </span>
                          </div>
                          <p className="font-bold text-xs text-slate-100">{data.name}</p>
                          <p className="text-[10px] text-slate-300 leading-normal border-t border-slate-700/50 pt-1.5">
                            <strong className="text-slate-400">¿Por qué?:</strong> {data.rationale}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="score" 
                  radius={[0, 8, 8, 0]}
                  barSize={18}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getUrgencyColor(entry.urgency as any)}
                      className="transition-all duration-300"
                      fillOpacity={hoveredIndex === null || hoveredIndex === index ? 1 : 0.6}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Actionable List */}
          <div className="lg:col-span-5 space-y-2">
            <p className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Lista rápida ({filteredRisks.length} pendiente{filteredRisks.length === 1 ? '' : 's'}):</span>
              {urgencyFilter !== 'Todas' && <span className="text-teal-600">Filtrado por: {urgencyFilter}</span>}
            </p>

            {handleDownloadTaskICS && (
              <button
                type="button"
                onClick={() => {
                  handleDownloadTaskICS(
                    'Inspección profunda mensual de seguridad infantil en el hogar',
                    selectedRoom === 'Todas' ? 'Hogar Completo' : selectedRoom,
                    1
                  );
                  logAnalyticsEvent('schedule_monthly_inspection_deep_ics', { room: selectedRoom });
                }}
                className="w-full px-4 py-2 bg-indigo-50 hover:bg-indigo-100 active:scale-[0.98] text-indigo-700 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border border-indigo-200/50 hover:shadow-sm"
              >
                <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Agendar revisión mensual ({selectedRoom === 'Todas' ? 'Hogar' : selectedRoom})</span>
              </button>
            )}
            
            {/* Scrollable container for tasks when they are many */}
            <div className="max-h-[250px] overflow-y-auto pr-1 space-y-2 scrollbar-thin">
              {filteredRisks.map((risk, index) => (
                <div
                  key={risk.id}
                  className={`flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all duration-200 ${
                    hoveredIndex === index 
                      ? 'border-slate-300 bg-slate-50/50 shadow-sm' 
                      : 'border-slate-100 bg-white'
                  }`}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded-md">
                        {risk.room}
                      </span>
                      <span className={`text-[9px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded-md border ${getUrgencyBg(risk.urgency)}`}>
                        {risk.urgency}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-700 leading-normal truncate" title={risk.text}>
                      {risk.text}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      toggleHazard(risk.topicId, risk.id);
                    }}
                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer shrink-0 border border-transparent hover:border-emerald-100"
                    title="Resolver ahora y marcar como asegurado"
                  >
                    <CheckCircle2 className="w-4.5 h-4.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
          <strong>Tip de Seguridad:</strong> Pulsa en el botón redondo <CheckCircle2 className="w-3 h-3 text-slate-400 inline" /> de cualquier riesgo para marcarlo como resuelto al instante desde aquí. Tu gráfico se actualizará automáticamente.
        </p>
      </div>

      {/* Calendar Reminder Banner */}
      <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 border border-indigo-100/60 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-4 mt-2">
        <div className="flex items-start gap-3 flex-1">
          <div className="bg-indigo-100 text-indigo-600 p-2.5 rounded-xl border border-indigo-200/50 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="space-y-1 text-left">
            <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5 flex-wrap">
              Recordatorio Trimestral de Seguridad
              <span className="bg-indigo-100 text-indigo-700 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">Recomendado</span>
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold max-w-xl">
              Agenda una alerta periódica (cada 3 meses) en tu calendario para re-evaluar la seguridad de tu hogar. Mantendrá vigentes las medidas preventivas para tu bebé de forma automática.
            </p>
          </div>
        </div>

        {/* Dropdown Container */}
        <div className="relative shrink-0 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setShowCalendarDropdown(!showCalendarDropdown)}
            className="w-full md:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-500/10 cursor-pointer border border-indigo-500"
          >
            <Bell className="w-4 h-4" />
            <span>Agendar Alerta</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showCalendarDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showCalendarDropdown && (
            <>
              {/* Overlay transparent to close on outside click */}
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowCalendarDropdown(false)}
              />
              <div className="absolute right-0 bottom-full md:bottom-auto md:top-full mt-2 w-64 bg-white border border-slate-100 rounded-2xl shadow-xl p-2 z-20 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
                <span className="block text-[9px] text-slate-400 font-black uppercase tracking-wider px-2.5 py-1.5 border-b border-slate-50 mb-1">
                  Seleccionar Calendario
                </span>
                
                {/* Google Calendar Option */}
                <a
                  href={getGoogleCalendarLink({
                    title: 'Amapola Alerta: Revisión Trimestral de Seguridad Infantil 👶',
                    description: `Es hora de tu revisión periódica de seguridad de Amapola Alerta.\n\nLista de riesgos más urgentes a re-evaluar:\n${allUrgentRisks.slice(0, 5).map(r => `• [${r.room}] ${r.text}`).join('\n')}\n\nEste recordatorio se repite cada 3 meses para garantizar un hogar 100% libre de riesgos para tu bebé.`,
                    recurrenceInterval: 3
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    setShowCalendarDropdown(false);
                    logAnalyticsEvent('schedule_quarterly_google_calendar', { count: allUrgentRisks.length });
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors"
                >
                  <span className="text-base">📅</span>
                  <div className="flex-1 min-w-0">
                    <span className="block truncate">Google Calendar</span>
                    <span className="block text-[9px] text-slate-400 font-medium">Crear evento en la nube</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>

                {/* Outlook Option */}
                <a
                  href={getOutlookCalendarLink({
                    title: 'Amapola Alerta: Revisión Trimestral de Seguridad Infantil 👶',
                    description: `Es hora de tu revisión periódica de seguridad de Amapola Alerta.\n\nLista de riesgos más urgentes a re-evaluar:\n${allUrgentRisks.slice(0, 5).map(r => `• [${r.room}] ${r.text}`).join('\n')}\n\nEste recordatorio se repite cada 3 meses para garantizar un hogar 100% libre de riesgos para tu bebé.`,
                    recurrenceInterval: 3
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    setShowCalendarDropdown(false);
                    logAnalyticsEvent('schedule_quarterly_outlook_calendar', { count: allUrgentRisks.length });
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors"
                >
                  <span className="text-base">📧</span>
                  <div className="flex-1 min-w-0">
                    <span className="block truncate">Outlook / Live</span>
                    <span className="block text-[9px] text-slate-400 font-medium">Abrir en Outlook Web</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>

                {/* ICS Download Option */}
                <button
                  type="button"
                  onClick={() => {
                    downloadICSFile({
                      title: 'Amapola Alerta: Revisión Trimestral de Seguridad Infantil',
                      description: `Es hora de tu revisión periódica de seguridad de Amapola Alerta.\n\nLista de riesgos más urgentes a re-evaluar:\n${allUrgentRisks.slice(0, 5).map(r => `• [${r.room}] ${r.text}`).join('\n')}\n\nEste recordatorio se repite cada 3 meses para garantizar un hogar 100% libre de riesgos para tu bebé.`,
                      recurrenceInterval: 3
                    });
                    setShowCalendarDropdown(false);
                    logAnalyticsEvent('download_quarterly_ics_file', { count: allUrgentRisks.length });
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-indigo-50/50 hover:text-indigo-900 rounded-xl text-xs font-bold text-slate-700 transition-colors text-left cursor-pointer border-0"
                >
                  <Download className="w-4 h-4 text-indigo-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="block truncate">Descargar archivo iCal</span>
                    <span className="block text-[9px] text-slate-400 font-medium">Para Apple Calendar / Otros</span>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
