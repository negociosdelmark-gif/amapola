import { useEffect } from 'react';
import { Award, ShieldCheck, Sparkles, Star, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

interface AreaCompletionMedalProps {
  roomName: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AreaCompletionMedal({ roomName, isOpen, onClose }: AreaCompletionMedalProps) {
  
  // Trigger spectacular confetti patterns when the medal is opened
  useEffect(() => {
    if (isOpen && roomName) {
      // First immediate burst
      confetti({
        particleCount: 140,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899']
      });

      // Staggered secondary fireworks-like bursts
      const duration = 2 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#F59E0B', '#10B981', '#EC4899']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#3B82F6', '#8B5CF6', '#EC4899']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      
      // Delay starting secondary bursts slightly
      const timer = setTimeout(() => {
        frame();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isOpen, roomName]);

  // Clean room name or provide a default fallback
  const displayRoomName = roomName || 'Habitación';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Overlay with elegant blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md cursor-pointer"
          />

          {/* Celebration Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              transition: { type: 'spring', damping: 15, stiffness: 100 }
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.8, 
              y: 30,
              transition: { duration: 0.25 }
            }}
            className="relative bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl p-6 md:p-8 max-w-md w-full text-center shadow-2xl overflow-hidden"
          >
            {/* Background glowing halo elements */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Radiant Rotating Sunray behind the medal */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 15, ease: 'linear' }}
              className="absolute top-20 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 opacity-20 pointer-events-none"
            >
              <svg viewBox="0 0 100 100" className="w-full h-full text-amber-400">
                <path d="M50 0 L55 35 L90 10 L65 42 L100 50 L65 58 L90 90 L55 65 L50 100 L45 65 L10 90 L35 58 L0 50 L35 42 L10 10 L45 35 Z" fill="currentColor" />
              </svg>
            </motion.div>

            {/* Glowing Medal Illustration */}
            <div className="relative h-44 flex items-center justify-center mb-4">
              {/* Spinning orbiting stars */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
                className="absolute inset-0 w-full h-full pointer-events-none"
              >
                <Star className="absolute top-4 left-1/4 w-4 h-4 fill-amber-400 text-amber-300 filter drop-shadow animate-ping" />
                <Star className="absolute bottom-6 right-1/4 w-5 h-5 fill-teal-400 text-teal-300 filter drop-shadow animate-bounce" />
                <Star className="absolute top-1/2 right-12 w-3.5 h-3.5 fill-pink-400 text-pink-300 filter drop-shadow" />
              </motion.div>

              {/* Animated Medal Structure */}
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  scale: [1, 1.03, 1]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 4, 
                  ease: "easeInOut" 
                }}
                className="relative z-10 filter drop-shadow-[0_10px_20px_rgba(245,158,11,0.3)] cursor-pointer"
              >
                {/* Outer Shiny Glow */}
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-500 to-amber-300 rounded-full blur-xl opacity-40 animate-pulse" />
                
                {/* Ribbon Backing */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex gap-4 h-16 w-14 justify-between -z-10">
                  <div className="w-5 h-full bg-blue-600 rounded-b-md transform -rotate-12 border-t-4 border-blue-800" />
                  <div className="w-5 h-full bg-rose-600 rounded-b-md transform rotate-12 border-t-4 border-rose-800" />
                </div>

                {/* Main Medallion */}
                <div className="w-28 h-28 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-600 rounded-full p-1.5 border-4 border-amber-200 flex items-center justify-center shadow-lg relative overflow-hidden">
                  {/* Subtle inner metallic rings */}
                  <div className="absolute inset-1 rounded-full border border-yellow-200/40" />
                  <div className="absolute inset-2.5 rounded-full border-2 border-yellow-300/30" />
                  
                  {/* Shimmer effect */}
                  <motion.div 
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut', repeatDelay: 1.5 }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent transform -skew-x-20"
                  />

                  {/* Icon Emblem */}
                  <div className="w-full h-full rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 flex flex-col items-center justify-center relative">
                    <ShieldCheck className="w-12 h-12 text-slate-900 fill-amber-200/30 filter drop-shadow-md" />
                    <Award className="w-5 h-5 text-amber-100 absolute bottom-3" />
                  </div>
                </div>

                {/* Micro badge indicator */}
                <div className="absolute -bottom-2 right-1 bg-teal-500 text-white rounded-full p-1 border-2 border-slate-950 shadow">
                  <Check className="w-3.5 h-3.5 stroke-[3px]" />
                </div>
              </motion.div>
            </div>

            {/* Typography Content */}
            <div className="space-y-3 relative z-10">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" /> MEDALLA DE PREVENCIÓN
              </span>
              
              <h4 className="text-2xl font-black tracking-tight text-white leading-tight">
                ¡Área 100% Protegida!
              </h4>

              {/* Room name display badge */}
              <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-amber-400 text-xs font-black uppercase tracking-wide">
                <Award className="w-3.5 h-3.5 fill-amber-400/20" />
                <span>{displayRoomName}</span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-semibold max-w-xs mx-auto">
                ¡Excelente trabajo de seguridad! Has eliminado todos los riesgos detectados en esta área. Tu hogar es ahora un nido mucho más seguro para la exploración de tu bebé.
              </p>
            </div>

            {/* Achievements stats progress preview */}
            <div className="mt-5 p-3.5 bg-slate-800/40 border border-slate-800 rounded-2xl flex items-center justify-between text-left gap-3">
              <div className="space-y-0.5">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Estado de Habitación</span>
                <p className="text-xs font-bold text-white flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                  Asegurada &amp; Certificada
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
                  100%
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col gap-2 relative z-10">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 active:scale-[0.98] text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/10 hover:shadow-amber-500/25 cursor-pointer transition-all"
              >
                ¡Estupendo! Seguir Previniendo
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
