import { useState, useEffect, useRef } from 'react';
import { 
  Heart, ShieldAlert, Phone, Play, Square,
  ChevronLeft, ChevronRight, AlertTriangle, Mic, MicOff, Info
} from 'lucide-react';
import HospitalFinder from './HospitalFinder';
import FirstAidChat from './FirstAidChat';
import { ManeuverType } from '../types';
import { logAnalyticsEvent } from '../lib/firebase';

interface Step {
  title: string;
  desc: string;
  alert?: string;
  hasMetronome?: boolean;
}

const MANEUVERS: Record<ManeuverType, { name: string; steps: Step[] }> = {
  rcp_infant: {
    name: 'RCP en Lactantes (Menores de 1 año)',
    steps: [
      {
        title: 'Verificar respuesta y respiración',
        desc: 'Golpea suavemente la planta del pie del bebé y llámalo en voz alta. Observa si el pecho se mueve por no más de 10 segundos. Si no responde ni respira con normalidad, prepárate.',
        alert: '¡No sacudas al bebé bajo ninguna circunstancia!'
      },
      {
        title: 'Llama a Emergencias (123 / 911)',
        desc: 'Si estás acompañado, pide que llamen a emergencias de inmediato y consigan un DEA. Si estás solo, inicia 2 minutos de RCP primero, luego llama tú mismo.',
        alert: 'Pon el teléfono en altavoz al llamar para mantener tus manos libres.'
      },
      {
        title: 'Posición y compresiones de pecho',
        desc: 'Coloca al bebé boca arriba en una superficie firme y plana. Coloca 2 dedos en el centro del pecho, justo debajo de la línea de los pezones (en la mitad inferior del esternón).',
        alert: 'Usa una mano para mantener la cabeza del bebé ligeramente inclinada hacia atrás (posición de olfateo).'
      },
      {
        title: 'Realizar 30 Compresiones de Pecho',
        desc: 'Comprime el pecho aproximadamente 4 cm (1.5 pulgadas) a una velocidad de 100 a 120 compresiones por minuto. Deja que el pecho regrese por completo después de cada compresión.',
        alert: 'Usa el metrónomo integrado abajo para guiar el ritmo exacto (110 BPM).',
        hasMetronome: true
      },
      {
        title: 'Dar 2 Ventilaciones de rescate',
        desc: 'Cubre firmemente la boca y la nariz del bebé con tu boca para sellarlas. Da 2 soplos suaves (de 1 segundo cada uno) observando que el pecho se eleve.',
        alert: 'No soples con demasiada fuerza; solo la cantidad de aire que cabe en tus mejillas.'
      },
      {
        title: 'Repetir el ciclo',
        desc: 'Continúa con ciclos de 30 compresiones y 2 ventilaciones de rescate de forma ininterrumpida hasta que llegue ayuda médica calificada, el bebé comience a responder o tengas un DEA listo.',
        alert: 'Si estás extremadamente cansado, turnarse con otra persona cada 2 minutos.'
      }
    ]
  },
  heimlich_infant: {
    name: 'Atragantamiento Lactantes (Menores de 1 año)',
    steps: [
      {
        title: 'Evaluar gravedad del atragantamiento',
        desc: 'Si el bebé tose con fuerza o llora, déjalo toser. Si la tos es débil, no emite sonido, se pone morado o no puede respirar, actúa de inmediato.',
        alert: 'NUNCA realices barridos a ciegas con el dedo en la boca, podrías empujar más el objeto.'
      },
      {
        title: 'Dar 5 palmadas en la espalda',
        desc: 'Coloca al bebé boca abajo sobre tu antebrazo, apoyando tu mano en su mandíbula para sostener su cabeza. Inclina al bebé de modo que su cabeza quede más baja que su tronco. Da 5 palmadas firmes entre sus omóplatos con el talón de tu otra mano.',
        alert: 'Mantén los dedos libres de su garganta para no obstruir las vías.'
      },
      {
        title: 'Dar 5 compresiones de pecho',
        desc: 'Gira al bebé boca arriba apoyando su cabeza sobre tu otro antebrazo, con la cabeza hacia abajo. Coloca 2 dedos en la mitad inferior del esternón y realiza 5 compresiones rápidas hacia abajo.',
        alert: 'Comprime aproximadamente 4 cm de profundidad.'
      },
      {
        title: 'Repetir la secuencia',
        desc: 'Alterna 5 palmadas en la espalda y 5 compresiones en el pecho hasta que el objeto sea expulsado o el bebé pierda el conocimiento.',
        alert: 'Si el bebé se desmaya o pierde la respuesta, inicia RCP de inmediato.'
      }
    ]
  },
  rcp_child: {
    name: 'RCP en Niños (De 1 año a la Pubertad)',
    steps: [
      {
        title: 'Verificar conciencia y respiración',
        desc: 'Toca los hombros del niño con firmeza y pregúntale en voz alta "¿estás bien?". Observa su pecho para comprobar si respira con normalidad.',
        alert: 'Haz esto rápidamente, sin demorar más de 10 segundos.'
      },
      {
        title: 'Activar emergencias',
        desc: 'Pide auxilio a gritos. Envía a alguien a llamar al 123 o 911 y buscar un DEA. Si estás solo, realiza 2 minutos de reanimación antes de llamar.',
        alert: 'Pon el altavoz en tu celular si debes llamar tú mismo.'
      },
      {
        title: 'Posicionar el talón de una mano',
        desc: 'Coloca al niño en una superficie rígida. Apoya el talón de una sola mano (o dos si es un niño grande) en la mitad inferior de su esternón (centro del pecho).',
        alert: 'Mantén tus brazos completamente rectos y posiciona tus hombros directamente sobre tu mano.'
      },
      {
        title: 'Realizar 30 Compresiones de Pecho',
        desc: 'Comprime el pecho unos 5 cm (2 pulgadas) a un ritmo constante de 100 a 120 por minuto. Deja que el tórax se expanda completamente después de presionar.',
        alert: 'Usa el metrónomo interactivo para sincronizar tus movimientos.',
        hasMetronome: true
      },
      {
        title: 'Dar 2 Ventilaciones con inclinación de cabeza',
        desc: 'Realiza la maniobra frente-mentón inclinando la cabeza hacia atrás y levantando la barbilla. Pinza la nariz del niño e insufla aire por su boca hasta ver elevarse el tórax.',
        alert: 'Cada ventilación debe durar 1 segundo.'
      },
      {
        title: 'Continuar reanimación',
        desc: 'Mantén el ritmo de 30 compresiones y 2 insuflaciones hasta la llegada de los paramédicos o el despertar del niño.',
        alert: 'Si hay un DEA disponible, enciéndelo inmediatamente y sigue las instrucciones de voz.'
      }
    ]
  },
  heimlich_child: {
    name: 'Atragantamiento Niños (Mayores de 1 año)',
    steps: [
      {
        title: 'Reconocer la obstrucción severa',
        desc: 'El niño se lleva las manos al cuello, no puede hablar, toser con fuerza ni respirar, y sus labios comienzan a tornarse azulados.',
        alert: 'Pregúntale: "¿Te estás ahogando?" Si asiente, inicia la maniobra de inmediato.'
      },
      {
        title: 'Posicionarse detrás del niño',
        desc: 'Colócate de rodillas o de pie detrás del niño. Pasa tus brazos alrededor de su cintura e inclínalo ligeramente hacia adelante.',
        alert: 'Estar a su nivel de estatura mejora la efectividad de las compresiones.'
      },
      {
        title: 'Realizar compresiones abdominales',
        desc: 'Cierra un puño con el pulgar hacia adentro, colócalo justo por encima del ombligo del niño y debajo del esternón. Sujeta tu puño con la otra mano y presiona con fuerza hacia adentro y hacia arriba en forma de "J".',
        alert: 'Realiza compresiones individuales y deliberadas para intentar desalojar el objeto.'
      },
      {
        title: 'Continuar hasta expulsar o desmayo',
        desc: 'Repite las compresiones abdominales de manera ininterrumpida hasta que expulse el objeto o pierda el conocimiento.',
        alert: 'Si el niño queda inconsciente, colócalo en el suelo de inmediato e inicia RCP.'
      }
    ]
  }
};

export default function EmergencyPanel() {
  const [activeManeuver, setActiveManeuver] = useState<ManeuverType>('rcp_infant');
  const [stepIndex, setStepIndex] = useState(0);
  
  // Audio Metronome States
  const [isMetronomeActive, setIsMetronomeActive] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const metronomeIntervalRef = useRef<any>(null);

  // Speech Recognition States
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const maneuverData = MANEUVERS[activeManeuver];
  const currentStep = maneuverData.steps[stepIndex];

  // Metronome Sound Engine (using Web Audio API so it's 100% native and offline-ready)
  const toggleMetronome = () => {
    if (isMetronomeActive) {
      stopMetronome();
    } else {
      startMetronome();
    }
  };

  const startMetronome = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      setIsMetronomeActive(true);
      logAnalyticsEvent('start_metronome', { maneuver: activeManeuver });

      // 110 compressions per minute -> interval in ms = 60000 / 110 = 545.45 ms
      const intervalMs = 60000 / 110;

      metronomeIntervalRef.current = setInterval(() => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        // High click sound
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      }, intervalMs);
    } catch (e) {
      console.error("Failed to start metronome audio context:", e);
    }
  };

  const stopMetronome = () => {
    if (metronomeIntervalRef.current) {
      clearInterval(metronomeIntervalRef.current);
      metronomeIntervalRef.current = null;
    }
    setIsMetronomeActive(false);
    logAnalyticsEvent('stop_metronome');
  };

  useEffect(() => {
    return () => stopMetronome();
  }, []);

  // Hands-Free Speech Recognition Engine
  const startSpeechRecognition = () => {
    const SpeechLib = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechLib) {
      setSpeechError("Tu navegador o iFrame no soporta reconocimiento de voz continuo.");
      return;
    }

    try {
      const recognition = new SpeechLib();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'es-ES';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
        logAnalyticsEvent('speech_recognition_started');
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === 'not-allowed') {
          setSpeechError("Permiso de micrófono denegado. Habilita el acceso en el navegador.");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        const lastResultIndex = event.results.length - 1;
        const text = event.results[lastResultIndex][0].transcript.trim().toLowerCase();
        
        console.log("Voice Command Recognized:", text);

        if (text.includes('siguiente') || text.includes('adelante') || text.includes('próximo')) {
          handleNextStep();
        } else if (text.includes('atrás') || text.includes('anterior') || text.includes('regresar')) {
          handlePrevStep();
        } else if (text.includes('repetir') || text.includes('reiniciar')) {
          setStepIndex(0);
          logAnalyticsEvent('voice_command_reset');
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Speech recognition start failed:", err);
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const toggleSpeechRecognition = () => {
    if (isListening) {
      stopSpeechRecognition();
    } else {
      startSpeechRecognition();
    }
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleNextStep = () => {
    if (stepIndex < maneuverData.steps.length - 1) {
      setStepIndex(prev => prev + 1);
      logAnalyticsEvent('next_emergency_step', { step: stepIndex + 1 });
    }
  };

  const handlePrevStep = () => {
    if (stepIndex > 0) {
      setStepIndex(prev => prev - 1);
      logAnalyticsEvent('prev_emergency_step', { step: stepIndex - 1 });
    }
  };

  const handleManeuverChange = (type: ManeuverType) => {
    stopMetronome();
    setActiveManeuver(type);
    setStepIndex(0);
    logAnalyticsEvent('change_maneuver', { maneuver: type });
  };

  return (
    <div id="emergency-panel-root" className="space-y-6">
      
      {/* Rapid Action Buttons & Urgent Header */}
      <div className="bg-red-600 text-white rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-lg border border-red-500">
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-6 translate-y-6 pointer-events-none">
          <Heart className="w-64 h-64 fill-white" />
        </div>

        <div className="relative space-y-4 text-left">
          <div className="flex items-center gap-2.5">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
            </span>
            <span className="text-xs font-black uppercase tracking-widest bg-red-700/60 text-red-100 px-2.5 py-1 rounded-full border border-red-500/50">
              Urgencia Pediátrica Activa
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-none">Guía de Primeros Auxilios de Emergencia</h2>
            <p className="text-xs text-red-100 max-w-2xl leading-relaxed">
              Conserva la calma. Selecciona la maniobra adecuada y sigue las instrucciones paso a paso. Llama a las líneas de emergencia inmediatamente si el niño no respira.
            </p>
          </div>

          {/* Quick Dial Buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            <a
              href="tel:123"
              onClick={() => logAnalyticsEvent('emergency_call_123')}
              className="px-5 py-3 bg-white text-red-700 hover:bg-red-50 font-black rounded-xl text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <Phone className="w-4 h-4 fill-red-700 animate-pulse" />
              <span>Llamar Emergencias 123</span>
            </a>
            <a
              href="tel:911"
              onClick={() => logAnalyticsEvent('emergency_call_911')}
              className="px-5 py-3 bg-red-800 text-white hover:bg-red-900 font-black rounded-xl text-xs flex items-center gap-2 transition-all border border-red-700 shadow-sm cursor-pointer"
            >
              <Phone className="w-4 h-4" />
              <span>Marcar 911</span>
            </a>
          </div>
        </div>
      </div>

      {/* Maneuver Selection Tab Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {(Object.keys(MANEUVERS) as ManeuverType[]).map((type) => {
          const isActive = activeManeuver === type;
          const isCPR = type.startsWith('rcp');
          return (
            <button
              key={type}
              onClick={() => handleManeuverChange(type)}
              className={`p-3.5 rounded-2xl text-xs font-bold text-left transition-all border flex flex-col justify-between gap-2.5 cursor-pointer h-full ${
                isActive
                  ? 'bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-900/10'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className={`p-1.5 rounded-lg ${isActive ? 'bg-white/10 text-rose-400' : 'bg-slate-100 text-slate-500'}`}>
                  {isCPR ? <Heart className="w-4 h-4 fill-current" /> : <ShieldAlert className="w-4 h-4" />}
                </div>
                {isActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                )}
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400 block truncate">
                  {type.endsWith('infant') ? 'Lactante' : 'Niño'}
                </span>
                <span className="leading-tight block font-black line-clamp-2">
                  {isCPR ? 'RCP Reanimación' : 'Atragantamiento'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Step-by-Step Card Dashboard */}
      <div className="bg-white border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-5 md:p-8 shadow-sm text-left grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Interactive Panel (Step Instructions) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Header containing Step Number indicator */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="space-y-0.5">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Maniobra Activa</span>
              <h3 className="text-sm font-black text-slate-900">{maneuverData.name}</h3>
            </div>
            <div className="text-right">
              <span className="font-mono text-xs font-black bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md">
                Paso {stepIndex + 1} de {maneuverData.steps.length}
              </span>
            </div>
          </div>

          {/* Active Step Details */}
          <div className="space-y-4 py-2">
            <h4 className="text-base md:text-lg font-black text-slate-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-black">
                {stepIndex + 1}
              </span>
              {currentStep.title}
            </h4>
            
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              {currentStep.desc}
            </p>

            {currentStep.alert && (
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 flex items-start gap-3">
                <AlertTriangle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-950 font-bold leading-relaxed">
                  <strong>IMPORTANTE:</strong> {currentStep.alert}
                </p>
              </div>
            )}
          </div>

          {/* Step Navigation Controls */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handlePrevStep}
              disabled={stepIndex === 0}
              className="flex-1 py-3 px-4 border border-slate-200 hover:bg-slate-50 disabled:opacity-40 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Anterior</span>
            </button>
            <button
              onClick={handleNextStep}
              disabled={stepIndex === maneuverData.steps.length - 1}
              className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Siguiente</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* CPR Chest Compressions Metronome Board */}
          {currentStep.hasMetronome && (
            <div className="bg-rose-50/40 border border-rose-100 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center sm:text-left">
                <h5 className="font-black text-rose-950 text-xs flex items-center justify-center sm:justify-start gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                  Metrónomo de Compresiones Integrado
                </h5>
                <p className="text-xs text-rose-800 max-w-md leading-relaxed font-semibold">
                  Mantiene un ritmo constante de <strong>110 BPM</strong> para lograr la máxima eficacia en el bombeo de sangre. Presiona Iniciar y comprime al ritmo de los clics.
                </p>
              </div>

              <button
                onClick={toggleMetronome}
                className={`py-3 px-5 font-black text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-sm shrink-0 w-full sm:w-auto justify-center ${
                  isMetronomeActive 
                    ? 'bg-rose-600 text-white animate-pulse' 
                    : 'bg-white border border-rose-200 text-rose-700 hover:bg-rose-50'
                }`}
              >
                {isMetronomeActive ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Detener (110 BPM)</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Iniciar Metrónomo</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Right Interactive Sidebar (Instructions/Tools) */}
        <div className="lg:col-span-4 space-y-4 self-stretch flex flex-col justify-between">
          
          {/* Hands-Free Voice Controller panel */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 space-y-4 flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic className={`w-4 h-4 ${isListening ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`} />
                <h5 className="text-sm font-black uppercase tracking-widest text-slate-300">Control por Voz Manos Libres</h5>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${isListening ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                {isListening ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              ¿Tienes las manos sucias o mojadas? Activa la escucha de voz y di fuerte <strong>"Siguiente"</strong> o <strong>"Atrás"</strong> para navegar los pasos de primeros auxilios sin tocar la pantalla.
            </p>

            {speechError && (
              <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 leading-snug">
                {speechError}
              </div>
            )}

            <button
              onClick={toggleSpeechRecognition}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isListening 
                  ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-3.5 h-3.5" />
                  <span>Apagar Escucha Activa</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" />
                  <span>Activar Control Manos Libres</span>
                </>
              )}
            </button>
          </div>

          {/* Quick FAQ / Safety Warnings */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-3">
            <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              ¿Cuándo detener la maniobra?
            </h5>
            <ul className="text-sm text-slate-600 leading-relaxed space-y-2 leading-relaxed">
              <li className="flex items-start gap-1.5 font-medium">
                <span className="text-slate-400 mt-0.5">•</span>
                <span>Cuando el bebé o niño comience a toser, llorar, moverse o respirar con total normalidad.</span>
              </li>
              <li className="flex items-start gap-1.5 font-medium">
                <span className="text-slate-400 mt-0.5">•</span>
                <span>Al arribo inmediato de personal médico de urgencia certificado.</span>
              </li>
              <li className="flex items-start gap-1.5 font-medium">
                <span className="text-slate-400 mt-0.5">•</span>
                <span>Cuando se coloque un DEA y comience a guiar la descarga.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Chat Asistente de Primeros Auxilios con Inteligencia Artificial */}
      <div className="space-y-3">
        <div className="text-left space-y-1">
          <h3 className="text-lg font-black text-slate-900">Consulta de Primeros Auxilios</h3>
          <p className="text-sm text-slate-500 leading-relaxed leading-relaxed font-semibold">
            Haz preguntas al asistente virtual de Amapola Alerta sobre urgencias infantiles, accidentes domésticos y síntomas. Recibe guías paso a paso confiables.
          </p>
        </div>
        <FirstAidChat />
      </div>

      {/* Hospital Finder Maps Service Component integrated */}
      <HospitalFinder />
    </div>
  );
}
