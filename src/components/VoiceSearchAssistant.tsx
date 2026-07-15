import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Search, Sparkles, Volume2, Trash2, HelpCircle, Lightbulb, X, Clock, History } from 'lucide-react';

interface VoiceSearchAssistantProps {
  preventionSearch: string;
  setPreventionSearch: (query: string) => void;
  viewMode: 'Checklists' | 'Vista Anual' | 'Historial';
  setViewMode: (view: 'Checklists' | 'Vista Anual' | 'Historial') => void;
  statusFilter: 'Todos' | 'Pendientes';
  setStatusFilter: (status: 'Todos' | 'Pendientes') => void;
  urgencySort: boolean;
  setUrgencySort: (sort: boolean) => void;
  effortFilter: 'Todos' | 'Fácil' | 'Medio' | 'Difícil';
  setEffortFilter: (effort: 'Todos' | 'Fácil' | 'Medio' | 'Difícil') => void;
}

interface VoiceCommand {
  phrase: string;
  actionDesc: string;
  category: string;
}

interface RecentCommandItem {
  phrase: string;
  count: number;
  lastUsed: number;
}

export default function VoiceSearchAssistant({
  preventionSearch,
  setPreventionSearch,
  viewMode,
  setViewMode,
  statusFilter,
  setStatusFilter,
  urgencySort,
  setUrgencySort,
  effortFilter,
  setEffortFilter
}: VoiceSearchAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [commandFeedback, setCommandFeedback] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  const [showOnboardingTooltip, setShowOnboardingTooltip] = useState(() => {
    try {
      return localStorage.getItem('amapola_voice_tooltip_dismissed') !== 'true';
    } catch (e) {
      return true;
    }
  });
  
  const [recentCommands, setRecentCommands] = useState<RecentCommandItem[]>(() => {
    try {
      const saved = localStorage.getItem('amapola_recent_voice_commands');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  
  const recognitionRef = useRef<any>(null);

  const registerCommandInHistory = (phrase: string) => {
    if (!phrase || phrase.trim() === '') return;
    const cleaned = phrase.trim();
    
    // Ignore initial placeholder string or generic listening messages
    if (cleaned === 'Escuchando voz...' || cleaned.startsWith('Simulado:')) return;

    setRecentCommands(prev => {
      const existingIndex = prev.findIndex(item => item.phrase.toLowerCase() === cleaned.toLowerCase());
      let updated;
      if (existingIndex > -1) {
        updated = [...prev];
        updated[existingIndex] = {
          phrase: updated[existingIndex].phrase,
          count: updated[existingIndex].count + 1,
          lastUsed: Date.now()
        };
      } else {
        updated = [
          { phrase: cleaned, count: 1, lastUsed: Date.now() },
          ...prev
        ];
      }
      
      const sorted = updated.sort((a, b) => b.lastUsed - a.lastUsed).slice(0, 6);
      localStorage.setItem('amapola_recent_voice_commands', JSON.stringify(sorted));
      return sorted;
    });
  };

  const clearCommandHistory = () => {
    setRecentCommands([]);
    localStorage.removeItem('amapola_recent_voice_commands');
    setCommandFeedback('🧹 Historial de comandos limpiado');
  };

  const voiceCommands: VoiceCommand[] = [
    { phrase: 'cocina', actionDesc: 'Busca peligros en la cocina', category: 'Lugares' },
    { phrase: 'baño', actionDesc: 'Busca peligros en el baño', category: 'Lugares' },
    { phrase: 'sala', actionDesc: 'Busca peligros en la sala', category: 'Lugares' },
    { phrase: 'dormitorio', actionDesc: 'Busca peligros en el cuarto', category: 'Lugares' },
    { phrase: 'jardín', actionDesc: 'Busca peligros en el jardín', category: 'Lugares' },
    { phrase: 'enchufe', actionDesc: 'Filtra peligros relacionados con electricidad', category: 'Peligros' },
    { phrase: 'medicamentos', actionDesc: 'Filtra peligros por intoxicación', category: 'Peligros' },
    { phrase: 'pendientes', actionDesc: 'Filtra solo tareas pendientes', category: 'Estado' },
    { phrase: 'todos', actionDesc: 'Muestra todas las tareas', category: 'Estado' },
    { phrase: 'alta', actionDesc: 'Ordena tareas por urgencia alta', category: 'Filtro' },
    { phrase: 'limpiar', actionDesc: 'Limpia la barra de búsqueda', category: 'Acciones' },
    { phrase: 'vista anual', actionDesc: 'Cambia a la vista de calendario anual', category: 'Vistas' },
    { phrase: 'lista', actionDesc: 'Vuelve a la vista de checklists', category: 'Vistas' }
  ];

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setRecognitionSupported(false);
    } else {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('Escuchando voz...');
        setCommandFeedback(null);
      };

      recognition.onresult = (event: any) => {
        const currentTranscript = event.results[0][0].transcript;
        setTranscript(currentTranscript);

        if (event.results[0].isFinal) {
          processVoiceCommand(currentTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setTranscript('Permiso de micrófono denegado.');
        } else {
          setTranscript(`Error de voz: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const startListening = () => {
    if (!recognitionSupported) {
      setCommandFeedback('Búsqueda de voz no soportada por este navegador.');
      return;
    }

    try {
      if (isListening) {
        recognitionRef.current?.stop();
      } else {
        recognitionRef.current?.start();
      }
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  const processVoiceCommand = (rawText: string) => {
    const text = rawText.toLowerCase().trim();
    
    // Commands implementation
    if (text.includes('cocina')) {
      setPreventionSearch('Cocina');
      setCommandFeedback('🔍 Filtrado por: Cocina');
    } else if (text.includes('baño') || text.includes('bano')) {
      setPreventionSearch('Baño');
      setCommandFeedback('🔍 Filtrado por: Baño');
    } else if (text.includes('sala')) {
      setPreventionSearch('Sala');
      setCommandFeedback('🔍 Filtrado por: Sala');
    } else if (text.includes('dormitorio') || text.includes('cuarto') || text.includes('habitación') || text.includes('habitacion')) {
      setPreventionSearch('Dormitorio');
      setCommandFeedback('🔍 Filtrado por: Dormitorio');
    } else if (text.includes('jardín') || text.includes('jardin') || text.includes('patio')) {
      setPreventionSearch('Jardín');
      setCommandFeedback('🔍 Filtrado por: Jardín');
    } else if (text.includes('enchufe') || text.includes('corriente') || text.includes('electricidad') || text.includes('cable')) {
      setPreventionSearch('enchufe');
      setCommandFeedback('🔌 Filtrado por: Enchufe');
    } else if (text.includes('medicamento') || text.includes('remedio') || text.includes('pastilla')) {
      setPreventionSearch('medicamento');
      setCommandFeedback('💊 Filtrado por: Medicamentos');
    } else if (text.includes('pendiente')) {
      setStatusFilter('Pendientes');
      setCommandFeedback('📋 Filtrado por: Tareas Pendientes');
    } else if (text.includes('todos') || text.includes('todo')) {
      setStatusFilter('Todos');
      setPreventionSearch('');
      setCommandFeedback('🔄 Reseteado: Mostrando todos los peligros');
    } else if (text.includes('alta') || text.includes('urgente') || text.includes('prioridad')) {
      setUrgencySort(true);
      setCommandFeedback('⚡ Ordenado por: Urgencia Alta');
    } else if (text.includes('normal') || text.includes('predeterminado')) {
      setUrgencySort(false);
      setCommandFeedback('⚖️ Ordenado por: Predeterminado');
    } else if (text.includes('limpiar') || text.includes('borrar') || text.includes('quitar')) {
      setPreventionSearch('');
      setCommandFeedback('🧹 Búsqueda limpiada');
    } else if (text.includes('vista anual') || text.includes('calendario') || text.includes('anual')) {
      setViewMode('Vista Anual');
      setCommandFeedback('📅 Cambiado a: Vista Anual');
    } else if (text.includes('lista') || text.includes('checklist') || text.includes('checklists')) {
      setViewMode('Checklists');
      setCommandFeedback('📝 Cambiado a: Vista Checklists');
    } else {
      // Default fallback search
      setPreventionSearch(rawText);
      setCommandFeedback(`🔎 Buscando: "${rawText}"`);
    }
    
    // Save successfully processed commands/phrases in history
    registerCommandInHistory(rawText);
  };

  const simulateCommand = (cmd: string) => {
    setTranscript(`Simulado: "${cmd}"`);
    processVoiceCommand(cmd);
  };

  // Check if any filter is active to show quick reset options
  const hasActiveFilters = preventionSearch || statusFilter !== 'Todos' || urgencySort || effortFilter !== 'Todos';

  const clearAllFilters = () => {
    setPreventionSearch('');
    setStatusFilter('Todos');
    setUrgencySort(false);
    setEffortFilter('Todos');
    setCommandFeedback('🧹 Todos los filtros y búsquedas han sido limpiados');
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
      {/* Input Header & Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar área, peligro, o habla mediante el micrófono..."
            className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all font-medium text-slate-700"
            value={preventionSearch}
            onChange={(e) => setPreventionSearch(e.target.value)}
          />
          {preventionSearch && (
            <button
              onClick={() => {
                setPreventionSearch('');
                setCommandFeedback('🧹 Búsqueda limpiada');
              }}
              className="absolute inset-y-0 right-12 pr-1 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              title="Limpiar búsqueda"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Voice Search Toggle Trigger */}
          <button
            onClick={startListening}
            className={`absolute inset-y-0 right-0 pr-3.5 flex items-center transition-colors focus:outline-none ${
              isListening ? 'text-rose-500' : 'text-slate-400 hover:text-rose-600'
            }`}
            title="Buscar por comando de voz"
          >
            {isListening ? (
              <span className="relative flex h-4 w-4 justify-center items-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <Mic className="relative inline-flex rounded-full h-4 w-4 text-rose-600" />
              </span>
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </button>

          {/* Popover Tooltip for onboarding / explanation */}
          <AnimatePresence>
            {showOnboardingTooltip && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                className="absolute right-0 bottom-[calc(100%+14px)] z-50 w-72 sm:w-85 bg-slate-900 text-white rounded-2xl p-4 shadow-xl border border-slate-800 text-left"
              >
                {/* Arrow pointing down to Mic icon */}
                <div className="absolute -bottom-1.5 right-4 w-3 h-3 bg-slate-900 rotate-45 border-r border-b border-slate-800" />
                
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-rose-400 font-extrabold text-xs uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                    <span>🎙️ ¡Prueba los comandos de voz!</span>
                  </div>
                  <button 
                    onClick={() => {
                      setShowOnboardingTooltip(false);
                      try {
                        localStorage.setItem('amapola_voice_tooltip_dismissed', 'true');
                      } catch (e) {}
                    }}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <div className="space-y-2.5 text-xs text-slate-200">
                  <p className="leading-relaxed">
                    Facilita tu navegación. Toca el micrófono de arriba a la derecha y di comandos directos en español como:
                  </p>
                  
                  <div className="bg-slate-800/60 p-2.5 rounded-xl space-y-2 border border-slate-700/50">
                    <div className="flex items-start gap-2">
                      <span className="font-extrabold text-rose-300 bg-rose-500/15 px-1.5 py-0.25 rounded text-[10px] shrink-0">"cocina"</span>
                      <p className="text-[11px] leading-tight text-slate-300">Filtra peligros específicos de la cocina.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-extrabold text-rose-300 bg-rose-500/15 px-1.5 py-0.25 rounded text-[10px] shrink-0">"pendientes"</span>
                      <p className="text-[11px] leading-tight text-slate-300">Muestra solo las medidas preventivas pendientes.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-extrabold text-rose-300 bg-rose-500/15 px-1.5 py-0.25 rounded text-[10px] shrink-0">"vista anual"</span>
                      <p className="text-[11px] leading-tight text-slate-300">Cambia a la vista de calendario anual de tareas.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-extrabold text-rose-300 bg-rose-500/15 px-1.5 py-0.25 rounded text-[10px] shrink-0">"limpiar"</span>
                      <p className="text-[11px] leading-tight text-slate-300">Elimina el filtro activo y restaura la vista.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-800">
                    <span className="text-[10px] text-slate-400 font-semibold">Soporta Chrome, Safari y Edge</span>
                    <button
                      onClick={() => {
                        setShowOnboardingTooltip(false);
                        try {
                          localStorage.setItem('amapola_voice_tooltip_dismissed', 'true');
                        } catch (e) {}
                      }}
                      className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-sm"
                    >
                      ¡Entendido!
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className={`flex items-center gap-1 px-3 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider border transition-all cursor-pointer ${
              showHelp 
                ? 'bg-rose-50 border-rose-100 text-rose-700 shadow-xs' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Mostrar comandos de voz de ayuda"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Comandos</span>
          </button>
        </div>
      </div>

      {/* Recent Voice Searches & Frecuentes Section */}
      {recentCommands.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-1.5 px-3 bg-slate-50/50 rounded-2xl border border-slate-100 text-xs animate-fadeIn">
          <div className="flex items-center gap-1.5 text-slate-500 font-extrabold uppercase tracking-wider text-[10px] shrink-0">
            <History className="w-3.5 h-3.5 text-slate-400" />
            <span>Comandos Recientes:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 py-0.5 flex-1">
            {recentCommands.map((item) => (
              <button
                key={`${item.phrase}-${item.lastUsed}`}
                onClick={() => {
                  setTranscript(`Repetido: "${item.phrase}"`);
                  processVoiceCommand(item.phrase);
                }}
                className="flex items-center gap-1 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all duration-150 border border-slate-200/60 hover:border-rose-100 cursor-pointer shadow-2xs max-w-[150px] truncate"
                title={`Buscar "${item.phrase}" (usado ${item.count} veces)`}
              >
                <Clock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                <span className="truncate">{item.phrase}</span>
                {item.count > 1 && (
                  <span className="bg-rose-100 text-rose-800 text-[9px] font-extrabold px-1.5 py-0.25 rounded-full shrink-0" title="Búsqueda Frecuente">
                    {item.count}
                  </span>
                )}
              </button>
            ))}
            <button
              onClick={clearCommandHistory}
              className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors ml-auto cursor-pointer flex items-center gap-1"
              title="Borrar historial de voz"
            >
              <Trash2 className="w-3 h-3 text-slate-400 hover:text-rose-600" />
              <span className="text-[10px] font-bold text-slate-400 hover:text-rose-600">Limpiar Historial</span>
            </button>
          </div>
        </div>
      )}

      {/* Active State / Filters Ribbon */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-50">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-1">
          Filtros Activos:
        </span>

        {/* Re-trigger Tooltip help */}
        <button
          onClick={() => setShowOnboardingTooltip(prev => !prev)}
          className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 cursor-pointer transition-all ${
            showOnboardingTooltip 
              ? 'bg-rose-600 text-white shadow-xs' 
              : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
          }`}
          title="Ver tutorial y ejemplos de comandos de voz"
        >
          <Sparkles className="w-3 h-3" />
          <span>¿Cómo usar la voz?</span>
        </button>
        
        {/* View Mode Indicator */}
        <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full flex items-center gap-1">
          Vista: {viewMode === 'Checklists' ? 'Checklists' : viewMode === 'Vista Anual' ? 'Anual' : 'Historial'}
        </span>

        {/* Search Query Chip */}
        {preventionSearch && (
          <span className="text-[10px] font-extrabold bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full flex items-center gap-1 animate-fadeIn">
            Busca: "{preventionSearch}"
            <button onClick={() => setPreventionSearch('')} className="hover:text-rose-950 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </span>
        )}

        {/* Status Filter Chip */}
        {statusFilter !== 'Todos' && (
          <span className="text-[10px] font-extrabold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full flex items-center gap-1 animate-fadeIn">
            Estado: {statusFilter}
            <button onClick={() => setStatusFilter('Todos')} className="hover:text-amber-950 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </span>
        )}

        {/* Urgency Sort Chip */}
        {urgencySort && (
          <span className="text-[10px] font-extrabold bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full flex items-center gap-1 animate-fadeIn">
            Orden: Prioridad Alta
            <button onClick={() => setUrgencySort(false)} className="hover:text-purple-950 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </span>
        )}

        {/* Effort Filter Chip */}
        {effortFilter !== 'Todos' && (
          <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full flex items-center gap-1 animate-fadeIn">
            Esfuerzo: {effortFilter}
            <button onClick={() => setEffortFilter('Todos')} className="hover:text-emerald-950 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </span>
        )}

        {/* Clear All Button */}
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-[10px] font-black text-rose-600 hover:text-rose-800 hover:underline uppercase tracking-wider ml-auto flex items-center gap-1 cursor-pointer"
          >
            Limpiar Todo
          </button>
        )}
      </div>

      {/* Voice Assistant Visual Panel */}
      <AnimatePresence>
        {(isListening || commandFeedback || transcript) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl border bg-slate-50/50 border-slate-100 space-y-3 relative overflow-hidden"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${isListening ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500">
                  {isListening ? 'Asistente de Voz Activo' : 'Comando Reconocido'}
                </span>
              </div>
              
              <div className="flex items-center gap-1.5">
                {isListening && (
                  <div className="flex items-end gap-1 h-3.5 px-1 bg-rose-50 rounded-md border border-rose-100">
                    <span className="w-0.5 bg-rose-600 animate-[bounce_0.8s_infinite_100ms] h-1.5" />
                    <span className="w-0.5 bg-rose-600 animate-[bounce_0.8s_infinite_200ms] h-3" />
                    <span className="w-0.5 bg-rose-600 animate-[bounce_0.8s_infinite_300ms] h-2" />
                    <span className="w-0.5 bg-rose-600 animate-[bounce_0.8s_infinite_400ms] h-1" />
                  </div>
                )}
                {!isListening && (
                  <button 
                    onClick={() => {
                      setTranscript('');
                      setCommandFeedback(null);
                    }}
                    className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider"
                  >
                    Cerrar
                  </button>
                )}
              </div>
            </div>

            {/* Transcript Area */}
            <div className="space-y-1.5">
              {transcript && (
                <p className="text-xs text-slate-500 italic font-medium leading-relaxed flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Dijiste: "{transcript}"</span>
                </p>
              )}
              {commandFeedback && (
                <p className="text-sm font-black text-slate-800 flex items-center gap-1.5 animate-fadeIn">
                  <Sparkles className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{commandFeedback}</span>
                </p>
              )}
            </div>

            {/* Help Prompt */}
            {isListening && !transcript.includes('Escuchando') && (
              <p className="text-[10px] text-slate-400 font-bold leading-normal">
                💡 Di comandos rápidos como <span className="text-rose-600">"cocina"</span>, <span className="text-rose-600">"baño"</span>, <span className="text-rose-600">"limpiar"</span> o <span className="text-rose-600">"pendientes"</span>.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Commands Help Drawer */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-rose-50/20 border border-rose-100/50 rounded-2xl p-4 space-y-3.5">
              <div className="flex items-center gap-1.5 text-rose-800 font-bold text-xs">
                <Lightbulb className="w-4 h-4 text-rose-500 shrink-0 animate-bounce" />
                <span>¿Cómo usar el Asistente por Comandos de Voz?</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Presiona el ícono del micrófono <Mic className="inline h-3.5 w-3.5 text-rose-500" /> y pronuncia uno de los siguientes comandos de voz estructurados en español para automatizar tu búsqueda de seguridad infantil:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {voiceCommands.map((cmd) => (
                  <div 
                    key={cmd.phrase} 
                    onClick={() => simulateCommand(cmd.phrase)}
                    className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-100 hover:border-rose-200 hover:shadow-xs transition-all cursor-pointer group text-xs"
                  >
                    <div className="space-y-0.5">
                      <p className="font-extrabold text-slate-800 group-hover:text-rose-700 transition-colors flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded">
                          {cmd.phrase}
                        </span>
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {cmd.actionDesc}
                      </p>
                    </div>
                    <span className="text-[9px] font-bold bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full shrink-0 group-hover:bg-rose-100 group-hover:text-rose-600 transition-colors">
                      {cmd.category}
                    </span>
                  </div>
                ))}
              </div>

              {!recognitionSupported && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-800 leading-relaxed font-semibold">
                  ⚠️ Tu navegador actual no tiene habilitada la Web Speech API o está en un entorno iframe con permisos restringidos. No te preocupes: puedes pulsar cualquiera de los comandos anteriores para simular la búsqueda por voz con un click.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
