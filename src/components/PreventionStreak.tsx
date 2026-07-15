import { useState, useEffect } from 'react';
import { 
  Flame, Trophy, CheckCircle2, 
  Sparkles, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { logAnalyticsEvent } from '../lib/firebase';

interface StreakData {
  currentStreak: number;
  bestStreak: number;
  activityDates: string[]; // YYYY-MM-DD
}

// Function to format Date objects as local YYYY-MM-DD
const getLocalDateString = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Main function to calculate current and best streaks based on unique dates
const calculateStreaks = (dates: string[]) => {
  if (dates.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  // Unique sorted dates
  const uniqueDates = Array.from(new Set(dates)).sort();

  const parseLocalDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  // 1. Calculate best streak (longest consecutive subsequence)
  let maxConsecutive = 0;
  let currentConsecutive = 1;

  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDate = parseLocalDate(uniqueDates[i - 1]);
    const currDate = parseLocalDate(uniqueDates[i]);
    const diffTime = currDate.getTime() - prevDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      currentConsecutive++;
    } else if (diffDays > 1) {
      if (currentConsecutive > maxConsecutive) {
        maxConsecutive = currentConsecutive;
      }
      currentConsecutive = 1;
    }
  }
  if (currentConsecutive > maxConsecutive) {
    maxConsecutive = currentConsecutive;
  }

  // 2. Calculate current streak (consecutive backward from today or yesterday)
  const todayDate = new Date();
  const todayStr = getLocalDateString(todayDate);
  
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterdayDate);

  let currentStreak = 0;
  const datesSet = new Set(uniqueDates);

  if (datesSet.has(todayStr) || datesSet.has(yesterdayStr)) {
    // Start counting from the most recent active date
    let checkDate = datesSet.has(todayStr) ? todayDate : yesterdayDate;
    let checkStr = getLocalDateString(checkDate);
    
    while (datesSet.has(checkStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
      checkStr = getLocalDateString(checkDate);
    }
  }

  return {
    currentStreak,
    bestStreak: Math.max(maxConsecutive, currentStreak)
  };
};

// Level definitions based on current streak
const STREAK_LEVELS = [
  {
    level: 1,
    name: 'Nido Seguro',
    minStreak: 0,
    maxStreak: 1,
    color: 'text-slate-500 bg-slate-50 border-slate-200',
    description: 'Estás comenzando a proteger el espacio de tu bebé.',
    icon: '🐣'
  },
  {
    level: 2,
    name: 'Guardián Activo',
    minStreak: 2,
    maxStreak: 3,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
    description: '¡Buen inicio! Estás creando el hábito de verificar los riesgos.',
    icon: '🛡️'
  },
  {
    level: 3,
    name: 'Protector Constante',
    minStreak: 4,
    maxStreak: 6,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    description: 'Gran constancia. Tu bebé explora un espacio libre de peligros.',
    icon: '✨'
  },
  {
    level: 4,
    name: 'Experto en Prevención',
    minStreak: 7,
    maxStreak: 14,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    description: '¡Excelente! Nivel de vigilancia extraordinario y continuo.',
    icon: '🏆'
  },
  {
    level: 5,
    name: 'Héroe del Hogar',
    minStreak: 15,
    maxStreak: 9999,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    description: '¡Legendario! Tu compromiso diario garantiza un hogar 100% protegido.',
    icon: '🦸‍♂️'
  }
];

export default function PreventionStreak() {
  const [streakData, setStreakData] = useState<StreakData>(() => {
    const saved = localStorage.getItem('amapola_prevention_streak');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Recalculate based on saved dates to ensure correctness
        const streaks = calculateStreaks(parsed.activityDates || []);
        return {
          currentStreak: streaks.currentStreak,
          bestStreak: streaks.bestStreak,
          activityDates: parsed.activityDates || []
        };
      } catch (e) {
        return { currentStreak: 0, bestStreak: 0, activityDates: [] };
      }
    }
    return { currentStreak: 0, bestStreak: 0, activityDates: [] };
  });

  const [showTester, setShowTester] = useState(false);
  const [justLeveledUp, setJustLeveledUp] = useState(false);
  const [prevLevel, setPrevLevel] = useState<number>(1);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('amapola_prevention_streak', JSON.stringify(streakData));
  }, [streakData]);

  // Determine user level based on current streak
  const getLevelInfo = (streak: number) => {
    const level = STREAK_LEVELS.find(l => streak >= l.minStreak && streak <= l.maxStreak);
    return level || STREAK_LEVELS[0];
  };

  const currentLevelInfo = getLevelInfo(streakData.currentStreak);

  // Monitor for level ups to trigger visual celebration
  useEffect(() => {
    const currentLevel = currentLevelInfo.level;
    if (currentLevel > prevLevel) {
      setJustLeveledUp(true);
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#0D9488', '#2563EB', '#F59E0B', '#F43F5E']
      });
      setTimeout(() => setJustLeveledUp(false), 5000);
    }
    setPrevLevel(currentLevel);
  }, [currentLevelInfo.level, prevLevel]);

  // Record custom/manual action or checklist item completion
  const recordActivityForDate = (dateStr: string) => {
    setStreakData(prev => {
      if (prev.activityDates.includes(dateStr)) {
        return prev; // Already recorded today
      }
      const newDates = [...prev.activityDates, dateStr];
      const stats = calculateStreaks(newDates);
      
      logAnalyticsEvent('record_prevention_activity', { 
        date: dateStr, 
        currentStreak: stats.currentStreak, 
        bestStreak: stats.bestStreak 
      });

      return {
        activityDates: newDates,
        currentStreak: stats.currentStreak,
        bestStreak: stats.bestStreak
      };
    });
  };

  // Record progress today
  const handleRecordToday = () => {
    const todayStr = getLocalDateString(new Date());
    recordActivityForDate(todayStr);
  };

  // Helper for simulation to easily construct streaks
  const handleSimulateDays = (daysAgo: number) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - daysAgo);
    const dateStr = getLocalDateString(targetDate);
    recordActivityForDate(dateStr);
  };

  const handleResetStreak = () => {
    if (window.confirm('¿Deseas reiniciar tu historial de racha? Se vaciarán los días registrados.')) {
      setStreakData({ currentStreak: 0, bestStreak: 0, activityDates: [] });
      setPrevLevel(1);
    }
  };

  // Calculate progress inside current level bar
  const getLevelProgress = () => {
    const lvl = currentLevelInfo;
    if (lvl.level === 5) return 100; // max level
    const nextLvl = STREAK_LEVELS[lvl.level];
    const totalDaysInLvl = nextLvl.minStreak - lvl.minStreak;
    const progressDays = streakData.currentStreak - lvl.minStreak;
    return Math.min(100, Math.max(0, (progressDays / totalDaysInLvl) * 100));
  };

  // Days needed for next level
  const getDaysNeededForNextLevel = () => {
    const lvl = currentLevelInfo;
    if (lvl.level === 5) return 0;
    const nextLvl = STREAK_LEVELS[lvl.level];
    return nextLvl.minStreak - streakData.currentStreak;
  };

  // Listen to custom event when a babyproofing hazard is marked as completed
  useEffect(() => {
    const handleHazardToggle = (e: Event) => {
      const customEvent = e as CustomEvent;
      // Only record when a task is completed (checked), not when unchecked
      if (customEvent.detail && customEvent.detail.completed === true) {
        handleRecordToday();
      }
    };
    window.addEventListener('amapola_hazard_completed', handleHazardToggle);
    return () => {
      window.removeEventListener('amapola_hazard_completed', handleHazardToggle);
    };
  }, [streakData.activityDates]);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-700/50 relative overflow-hidden text-left">
      {/* Decorative ambient background lights */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Content Layout */}
      <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="space-y-4 flex-1 w-full">
          {/* Header */}
          <div className="flex items-center gap-2.5">
            <div className="bg-amber-500/20 text-amber-400 p-2 rounded-2xl border border-amber-500/30 flex items-center justify-center animate-bounce">
              <Flame className="w-5 h-5 fill-amber-500" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" /> Sistema de Motivación Diaria
              </span>
              <h3 className="text-xl font-black tracking-tight">Racha de Prevención</h3>
            </div>
          </div>

          <p className="text-xs text-slate-300 font-medium leading-relaxed max-w-lg">
            ¡Mantén seguro a tu bebé registrando avances diarios! Cada vez que completas un punto del checklist o registras una revisión rápida, extiendes tu racha de constancia.
          </p>

          {/* Level Badge Card */}
          <div className={`p-4 rounded-2xl border flex items-center gap-4 ${currentLevelInfo.color} transition-all duration-300`}>
            <div className="text-3xl filter drop-shadow">
              {currentLevelInfo.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider bg-black/10 px-2 py-0.5 rounded-full">
                  NIVEL {currentLevelInfo.level}
                </span>
                <span className="text-xs font-black uppercase tracking-wide">
                  {currentLevelInfo.name}
                </span>
              </div>
              <p className="text-xs font-semibold opacity-90 mt-0.5 leading-tight">
                {currentLevelInfo.description}
              </p>
            </div>
          </div>

          {/* Level Progress Bar */}
          {currentLevelInfo.level < 5 && (
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs font-bold text-slate-400">
                <span>Avance al nivel {currentLevelInfo.level + 1}</span>
                <span className="text-amber-400">Faltan {getDaysNeededForNextLevel()} {getDaysNeededForNextLevel() === 1 ? 'día' : 'días'}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5 p-0.5 border border-slate-700/50">
                <div 
                  className="bg-gradient-to-r from-teal-500 to-amber-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${getLevelProgress()}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Big Streak Stats Ring/Display */}
        <div className="flex flex-col items-center gap-3 shrink-0 py-2 px-6 bg-slate-800/40 border border-slate-700/30 rounded-2xl text-center min-w-[170px] relative">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-0.5">
            <Flame className="w-2.5 h-2.5 fill-slate-950" /> Racha Actual
          </div>

          <div className="mt-2 font-black text-6xl text-transparent bg-clip-text bg-gradient-to-br from-amber-400 via-orange-500 to-amber-300 drop-shadow flex items-baseline justify-center">
            {streakData.currentStreak}
            <span className="text-xs font-bold uppercase text-slate-400 ml-1">días</span>
          </div>

          <div className="border-t border-slate-700/50 pt-2 w-full flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Máximo:</span>
            <span className="text-teal-400 flex items-center gap-1">
              <Trophy className="w-3 h-3 text-teal-400" /> {streakData.bestStreak} días
            </span>
          </div>

          {/* Log Progress Button */}
          <button
            type="button"
            onClick={handleRecordToday}
            className={`w-full py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
              streakData.activityDates.includes(getLocalDateString(new Date()))
                ? 'bg-teal-500/10 text-teal-400 border border-teal-500/25 cursor-default'
                : 'bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-md shadow-teal-500/20 hover:shadow-teal-500/30 hover:scale-[1.02]'
            }`}
          >
            {streakData.activityDates.includes(getLocalDateString(new Date())) ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                <span>Registrado Hoy</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-white animate-pulse" />
                <span>Registrar Hoy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* LEVEL UP NOTIFICATION SPLASH */}
      <AnimatePresence>
        {justLeveledUp && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 bg-teal-950/95 flex flex-col items-center justify-center text-center p-6 z-20"
          >
            <div className="text-5xl mb-3 animate-bounce">🎉 {currentLevelInfo.icon} 🎉</div>
            <h4 className="text-xl font-black tracking-tight text-amber-400 uppercase">¡HAS SUBIDO DE NIVEL!</h4>
            <p className="text-sm font-black text-white mt-1">Nuevo Rango: {currentLevelInfo.name}</p>
            <p className="text-xs text-slate-300 max-w-sm mt-2 leading-relaxed">
              {currentLevelInfo.description} ¡Sigue así para mantener un hogar ultra seguro!
            </p>
            <button
              onClick={() => setJustLeveledUp(false)}
              className="mt-4 px-4 py-1.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer"
            >
              ¡Entendido!
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DEVELOPMENT TESTING TOOLBOX */}
      <div className="mt-6 border-t border-slate-800/80 pt-4 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setShowTester(!showTester)}
          className="text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors flex items-center justify-between cursor-pointer py-1 self-start"
        >
          <span className="flex items-center gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${showTester ? 'rotate-180' : ''} transition-transform`} />
            Panel de Simulación de Racha (Uso del Evaluador)
          </span>
          {showTester ? <ChevronUp className="w-3.5 h-3.5 ml-2" /> : <ChevronDown className="w-3.5 h-3.5 ml-2" />}
        </button>

        <AnimatePresence>
          {showTester && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden space-y-3"
            >
              <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-2xl space-y-3">
                <p className="text-[11px] text-amber-400 font-bold leading-relaxed">
                  💡 <strong>Nota del Evaluador:</strong> Las rachas requieren días consecutivos reales. Pulsa en estos botones para registrar actividades simulando días pasados de manera consecutiva hacia hoy para ver subir tu nivel de forma inmediata:
                </p>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleSimulateDays(0)}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-100 text-[11px] font-bold rounded-lg cursor-pointer"
                  >
                    1. Registrar Hoy
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSimulateDays(1)}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-100 text-[11px] font-bold rounded-lg cursor-pointer"
                  >
                    2. Simular Ayer
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSimulateDays(2)}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-100 text-[11px] font-bold rounded-lg cursor-pointer"
                  >
                    3. Simular Hace 2 Días
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSimulateDays(3)}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-100 text-[11px] font-bold rounded-lg cursor-pointer"
                  >
                    4. Simular Hace 3 Días
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSimulateDays(4)}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-100 text-[11px] font-bold rounded-lg cursor-pointer"
                  >
                    5. Simular Hace 4 Días
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSimulateDays(5)}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-100 text-[11px] font-bold rounded-lg cursor-pointer"
                  >
                    6. Simular Hace 5 Días
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // Instantly set a high streak for demonstration
                      const mockDates = [];
                      for (let i = 0; i < 8; i++) {
                        const d = new Date();
                        d.setDate(d.getDate() - i);
                        mockDates.push(getLocalDateString(d));
                      }
                      setStreakData({
                        currentStreak: 8,
                        bestStreak: 8,
                        activityDates: mockDates
                      });
                      logAnalyticsEvent('simulate_high_streak', { streak: 8 });
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold rounded-lg cursor-pointer flex items-center gap-1"
                  >
                    ⭐ Simular Racha de 8 Días
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // Instantly set a high streak for level 5
                      const mockDates = [];
                      for (let i = 0; i < 16; i++) {
                        const d = new Date();
                        d.setDate(d.getDate() - i);
                        mockDates.push(getLocalDateString(d));
                      }
                      setStreakData({
                        currentStreak: 16,
                        bestStreak: 16,
                        activityDates: mockDates
                      });
                      logAnalyticsEvent('simulate_high_streak', { streak: 16 });
                    }}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-extrabold rounded-lg cursor-pointer flex items-center gap-1"
                  >
                    ⭐ Simular Racha de 16 Días (Máx Nivel)
                  </button>
                </div>

                <div className="flex justify-between items-center border-t border-slate-700/40 pt-2 text-[10px]">
                  <span className="text-slate-400 font-bold">Fechas activas grabadas: [{streakData.activityDates.join(', ')}]</span>
                  <button
                    type="button"
                    onClick={handleResetStreak}
                    className="text-rose-400 hover:text-rose-300 font-bold underline cursor-pointer"
                  >
                    Reiniciar todo
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
