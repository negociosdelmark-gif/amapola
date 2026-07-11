import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldAlert, Volume2, Square, Info, Phone, Play, 
  Download, Sparkles, Activity, FileText, CheckCircle2, Heart,
  X, VolumeX, ChevronLeft, ChevronRight, AlertTriangle, Zap
} from 'lucide-react';

type ManeuverType = 'rcp_infant' | 'heimlich_infant' | 'rcp_child' | 'heimlich_child';

export default function EmergencyPanel() {
  const [activeAge, setActiveAge] = useState<'infant' | 'child'>('infant');
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [currentSpeechStep, setCurrentSpeechStep] = useState<number | null>(null);
  
  // Interactive Diagram States
  const [selectedManeuver, setSelectedManeuver] = useState<ManeuverType>('rcp_infant');
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Ref for speech synthesis to support offline vocal instructions
  const synthRef = useRef<SpeechSynthesis | null>(typeof window !== 'undefined' ? window.speechSynthesis : null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Panic Mode States
  const [isPanicMode, setIsPanicMode] = useState(false);
  const [panicScenario, setPanicScenario] = useState<'rcp' | 'choking'>('rcp');
  const [panicAge, setPanicAge] = useState<'infant' | 'child'>('infant');
  const [panicStepIndex, setPanicStepIndex] = useState(0);
  const [panicMetronome, setPanicMetronome] = useState(true);
  const [pulseState, setPulseState] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  const panicSteps = {
    rcp: {
      infant: [
        {
          title: "1. COMPROBAR RESPUESTA",
          desc: "Golpea suavemente la planta del pie del bebé y llámalo con fuerza. Si no responde y no respira, ¡PIDE AYUDA o llama al 123 o 911 de inmediato!",
          warning: "No pierdas tiempo. Si estás solo, realiza RCP por 2 minutos antes de llamar."
        },
        {
          title: "2. COMPRESIONES DE PECHO",
          desc: "Coloca DOS DEDOS en el centro del pecho, justo debajo de la línea imaginaria de los pezones. Presiona rápido y firme 30 veces a ritmo de 100-120 por minuto (profundidad de 4 cm).",
          warning: "Presiona siguiendo la luz intermitente del metrónomo visual de abajo."
        },
        {
          title: "3. ABRIR VÍA AÉREA",
          desc: "Coloca al bebé boca arriba en una superficie rígida. Inclina su cabeza hacia atrás ligeramente en posición neutral de 'olfateo'. No extiendas de más la cabeza.",
          warning: "La cabeza debe estar recta, sin presionar la barbilla hacia el cuello."
        },
        {
          title: "4. RESPIRACIONES DE RESCATE",
          desc: "Cubre con tu boca la nariz y la boca del bebé. Da 2 soplos suaves de 1 segundo observando si el pecho se eleva.",
          warning: "Si el pecho no sube, reposiciona la cabeza e intenta otra vez."
        },
        {
          title: "5. MANTENER CICLOS 30:2",
          desc: "Continúa de forma continua e ininterrumpida realizando 30 compresiones rápidas y 2 soplos de rescate.",
          warning: "No te detengas hasta que el bebé llore, se mueva o llegue la ayuda médica profesional."
        }
      ],
      child: [
        {
          title: "1. COMPROBAR CONSCIENCIA",
          desc: "Sacude suavemente los hombros del niño y llámalo fuerte. Si no reacciona y no respira, grita pidiendo que llamen de inmediato al 123 o 911.",
          warning: "Si estás solo, realiza los primeros 5 ciclos de RCP antes de ir a pedir ayuda."
        },
        {
          title: "2. COMPRESIONES FUERTES",
          desc: "Coloca el talón de una mano (o las dos si es grande) en el centro del pecho (mitad inferior del esternón). Realiza 30 compresiones rápidas y profundas (5 cm) a ritmo de 100-120 por minuto.",
          warning: "Sigue el compás del metrónomo visual. Deja que el pecho suba del todo."
        },
        {
          title: "3. ABRIR VÍA AÉREA",
          desc: "Coloca una mano en su frente inclinando la cabeza hacia atrás, y con la otra mano levanta la barbilla con cuidado.",
          warning: "Esto levanta la lengua y despeja la garganta obstruida."
        },
        {
          title: "4. RESPIRACIÓN BOCA A BOCA",
          desc: "Tapa la nariz del niño con tus dedos. Cubre herméticamente su boca con la tuya y realiza 2 soplos lentos de 1 segundo.",
          warning: "Comprueba visualmente que el pecho se eleve con cada soplo."
        },
        {
          title: "5. CONTINUAR CICLOS 30:2",
          desc: "Repite ininterrumpidamente ciclos de 30 compresiones fuertes y 2 respiraciones hasta que llegue la asistencia profesional de urgencia.",
          warning: "Minimiza los descansos para mantener el flujo de sangre al cerebro."
        }
      ]
    },
    choking: {
      infant: [
        {
          title: "1. IDENTIFICAR ATRAGANTAMIENTO",
          desc: "Si el bebé está consciente pero no puede llorar, toser ni emitir ningún sonido, tiene la vía totalmente obstruida. Actúa con urgencia.",
          warning: "Si el bebé tose o llora con fuerza, NO realices maniobras. Déjalo toser."
        },
        {
          title: "2. 5 GOLPES EN LA ESPALDA",
          desc: "Coloca al bebé boca abajo apoyado en tu antebrazo, inclinando la cabeza hacia abajo. Da 5 golpes secos y firmes entre los omóplatos con el talón de tu mano.",
          warning: "Sostén siempre la mandíbula del bebé con tus dedos, sin presionar el cuello."
        },
        {
          title: "3. 5 COMPRESIONES DE PECHO",
          desc: "Gira al bebé boca arriba sobre tu otro antebrazo. Realiza 5 compresiones lentas y profundas en el centro del pecho con dos dedos.",
          warning: "Realiza las compresiones con ritmo firme, aproximadamente 1 por segundo."
        },
        {
          title: "4. REPETIR EL PROCESO",
          desc: "Sigue alternando de forma continua: 5 golpes en la espalda y 5 compresiones de pecho hasta que expulse el objeto o responda.",
          warning: "Mantén la cabeza siempre más baja que el cuerpo."
        },
        {
          title: "5. SI QUEDA INCONSCIENTE",
          desc: "Recuéstalo, llama al 123 o 911 e inicia RCP (30 compresiones). Cada vez que vayas a dar respiración, abre la boca y retira el objeto SOLO si es claramente visible.",
          warning: "NUNCA realices barridos a ciegas con el dedo porque podrías empujar más el objeto."
        }
      ],
      child: [
        {
          title: "1. VERIFICAR ATRAGANTAMIENTO",
          desc: "Niño consciente que se lleva las manos al cuello, con rostro azulado y que es incapaz de hablar, toser, llorar o respirar.",
          warning: "Pregúntale: ¿Te estás ahogando? Si asiente, inicia la maniobra inmediatamente."
        },
        {
          title: "2. COLOCARSE DETRÁS",
          desc: "Colócate de rodillas justo detrás del niño para nivelar tu altura. Rodea su cintura con tus dos brazos.",
          warning: "Mantente firme para dar soporte al peso del niño si se debilita."
        },
        {
          title: "3. POSICIÓN DEL PUÑO",
          desc: "Haz un puño con una mano. Coloca el lado del pulgar contra el abdomen del niño, justo arriba del ombligo y bien por debajo del esternón.",
          warning: "No presiones el hueso del esternón ni las costillas."
        },
        {
          title: "4. COMPRESIÓN ABDOMINAL (HEIMLICH)",
          desc: "Sujeta tu puño con la otra mano y presiona con un movimiento rápido y fuerte hacia adentro y hacia arriba (en forma de J).",
          warning: "Repite las compresiones de forma individual y decidida hasta expulsar el objeto."
        },
        {
          title: "5. SI QUEDA INCONSCIENTE",
          desc: "Si el niño se desmaya, acuéstalo boca arriba en el suelo, llama de urgencia al 123 o 911 e inicia de inmediato RCP (30 compresiones).",
          warning: "Busca visualmente el objeto en la boca antes de dar respiraciones. Retíralo solo si lo ves."
        }
      ]
    }
  };

  const speakPanicStep = (textToSpeak: string) => {
    if (!synthRef.current || isAudioMuted) return;
    synthRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'es-ES';
    utterance.rate = 0.88; // Slightly slow and clear for stressful situations
    utterance.volume = 1;
    
    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  // Metronome beat effect
  useEffect(() => {
    let interval: any = null;
    if (isPanicMode && panicMetronome && panicScenario === 'rcp') {
      const msPerBeat = Math.round(60000 / 110); // ~545ms
      interval = setInterval(() => {
        setPulseState(prev => !prev);
      }, msPerBeat);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPanicMode, panicMetronome, panicScenario]);

  // Handle auto-play of audio instructions on step/setting change
  useEffect(() => {
    if (isPanicMode) {
      const step = panicSteps[panicScenario][panicAge][panicStepIndex];
      if (step && !isAudioMuted) {
        speakPanicStep(`${step.title}. ... ${step.desc}. ... Nota de seguridad: ${step.warning}`);
      }
    } else {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [isPanicMode, panicScenario, panicAge, panicStepIndex, isAudioMuted]);

  const infantSteps = [
    {
      title: "1. Comprobar Respuesta y Llanto",
      desc: "Golpea suavemente la planta del pie del bebé y llámalo en voz alta. Si no responde, no se mueve y no respira, pide ayuda a gritos inmediatamente."
    },
    {
      title: "2. Desatragantamiento (Si se ahoga con objeto)",
      desc: "Coloca al bebé boca abajo sobre tu antebrazo sosteniendo su cabeza con tu mano (más baja que el tronco). Da 5 golpes secos en la espalda entre los omóplatos. Luego gíralo boca arriba y haz 5 compresiones lentas en el pecho con 2 dedos."
    },
    {
      title: "3. Abrir Vía Aérea",
      desc: "Coloca al bebé boca arriba en una superficie dura. Inclina su cabeza hacia atrás ligeramente en posición neutral de 'olfateo' (no la sobreextiendas)."
    },
    {
      title: "4. Iniciar Compresiones (RCP)",
      desc: "Coloca dos dedos en el centro de su pecho, justo debajo de la línea imaginaria de los pezones. Realiza 30 compresiones rápidas (100 a 120 por minuto) hundiéndose unos 4 cm."
    },
    {
      title: "5. Respiraciones de Rescate",
      desc: "Cubre la nariz y la boca del bebé con tu propia boca. Da 2 insuflaciones suaves de 1 segundo observando si el pecho se eleva. Repite ciclos de 30 compresiones y 2 insuflaciones."
    }
  ];

  const childSteps = [
    {
      title: "1. Comprobar Consciencia",
      desc: "Sacude suavemente sus hombros y llámalo fuerte. Si no reacciona, pide a alguien que llame a emergencias (ej. 123 o 911) de inmediato."
    },
    {
      title: "2. Maniobra de Heimlich (Atragantamiento)",
      desc: "Colócate detrás del niño, de rodillas para estar a su altura. Rodea su cintura. Haz un puño con una mano, colócalo arriba del ombligo, y presiona con la otra mano de forma rápida hacia adentro y hacia arriba."
    },
    {
      title: "3. Compresiones de Pecho (RCP)",
      desc: "Coloca el talón de una sola mano (o las dos si es grande) en el centro del pecho (mitad inferior del esternón). Realiza 30 compresiones fuertes y rápidas (profundidad de 5 cm) a un ritmo de 100-120 por minuto."
    },
    {
      title: "4. Respiraciones de Rescate",
      desc: "Inclina la cabeza hacia atrás, levanta la barbilla y tapa su nariz con tus dedos. Cubre su boca con la tuya y realiza 2 respiraciones lentas. Repite ciclos de 30 compresiones y 2 respiraciones."
    }
  ];

  const steps = activeAge === 'infant' ? infantSteps : childSteps;

  const startHandsFreeVoice = () => {
    if (!synthRef.current) return;
    
    // Stop any ongoing speech
    synthRef.current.cancel();
    setIsPlayingVoice(true);
    
    const textToSpeak = `Iniciando guía de emergencia para ${activeAge === 'infant' ? 'lactantes menores de un año' : 'niños mayores de un año'}. ` +
      steps.map((s, idx) => `Paso ${idx + 1}. ${s.title}. ${s.desc}`).join(" ... ");

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'es-ES';
    utterance.rate = 0.9; // Spoken calmly and slowly
    
    utterance.onend = () => {
      setIsPlayingVoice(false);
      setCurrentSpeechStep(null);
    };

    utterance.onerror = () => {
      setIsPlayingVoice(false);
      setCurrentSpeechStep(null);
    };

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  const stopVoice = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsPlayingVoice(false);
    setCurrentSpeechStep(null);
  };

  // Infographic Download Helpers (Vector SVG or raster Canvas PNG)
  const downloadAsSvg = (svgId: string, filename: string) => {
    const svgElement = document.getElementById(svgId);
    if (!svgElement) return;

    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const urlCreator = window.URL || (window as any).webkitURL;
    const blobURL = urlCreator.createObjectURL(svgBlob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = blobURL;
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    urlCreator.revokeObjectURL(blobURL);
  };

  const downloadAsPng = (svgId: string, filename: string) => {
    setDownloadingId(svgId);
    const svgElement = document.getElementById(svgId);
    if (!svgElement) {
      setDownloadingId(null);
      return;
    }

    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const urlCreator = window.URL || (window as any).webkitURL;
    const blobURL = urlCreator.createObjectURL(svgBlob);
    
    const image = new Image();
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1200; // Ultra high-res 3x
        canvas.height = 900;
        const context = canvas.getContext('2d');
        if (context) {
          context.fillStyle = '#0f172a'; // Match bg-slate-950
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0, 1200, 900);
          
          const png = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = png;
          downloadLink.download = filename;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        }
      } catch (err) {
        console.error("PNG rasterization failed, falling back to SVG vector", err);
        downloadAsSvg(svgId, filename.replace('.png', '.svg'));
      } finally {
        setDownloadingId(null);
      }
    };
    image.onerror = () => {
      downloadAsSvg(svgId, filename.replace('.png', '.svg'));
      setDownloadingId(null);
    };
    image.src = blobURL;
  };

  if (isPanicMode) {
    const currentStep = panicSteps[panicScenario][panicAge][panicStepIndex];
    return (
      <div 
        id="panic-mode-overlay" 
        className="fixed inset-0 z-[100] bg-slate-950 text-white flex flex-col font-sans select-none animate-fadeIn"
      >
        {/* Urgent Warning Header Banner */}
        <div className="bg-rose-700 text-white px-4 py-2 text-center text-xs font-black tracking-widest uppercase flex items-center justify-center gap-2 animate-pulse shrink-0">
          <ShieldAlert className="w-4 h-4" />
          <span>MODO PÁNICO ACTIVO — CONSERVE LA CALMA — SIGA LAS INSTRUCCIONES PASO A PASO</span>
        </div>

        {/* Top bar */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-rose-600 rounded-lg text-white font-black text-xs animate-pulse">
              🚨
            </span>
            <div className="text-left">
              <h1 className="text-sm font-black tracking-wider uppercase text-rose-500">ASISTENTE CRÍTICO DE VIDA</h1>
              <p className="text-[10px] text-slate-400">Guías inmediatas guiadas por voz y metrónomo</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Direct Phone Shortcut */}
            <a 
              href="tel:123"
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md transition-all animate-bounce"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>LLAMAR 123</span>
            </a>

            {/* Close / Exit Button */}
            <button
              onClick={() => {
                setIsPanicMode(false);
                if (synthRef.current) synthRef.current.cancel();
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1 transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Salir</span>
            </button>
          </div>
        </div>

        {/* Action Controls / Selectors */}
        <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex flex-col sm:flex-row gap-3 items-stretch justify-between shrink-0">
          {/* Scenario select */}
          <div className="grid grid-cols-2 gap-2 flex-1 max-w-md">
            <button
              onClick={() => {
                setPanicScenario('rcp');
                setPanicStepIndex(0);
              }}
              className={`py-3 px-4 font-black rounded-xl text-xs uppercase tracking-wider border-2 transition-all cursor-pointer ${
                panicScenario === 'rcp'
                  ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/20 scale-[1.02]'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              ❤️ RCP (Paro Cardiaco)
            </button>
            <button
              onClick={() => {
                setPanicScenario('choking');
                setPanicStepIndex(0);
              }}
              className={`py-3 px-4 font-black rounded-xl text-xs uppercase tracking-wider border-2 transition-all cursor-pointer ${
                panicScenario === 'choking'
                  ? 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-600/20 scale-[1.02]'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              💨 Atragantamiento
            </button>
          </div>

          {/* Age selection */}
          <div className="grid grid-cols-2 gap-2 flex-1 max-w-md">
            <button
              onClick={() => {
                setPanicAge('infant');
                setPanicStepIndex(0);
              }}
              className={`py-3 px-4 font-black rounded-xl text-xs uppercase tracking-wider border-2 transition-all cursor-pointer ${
                panicAge === 'infant'
                  ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/20 scale-[1.02]'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              👶 Lactante (&lt;1 año)
            </button>
            <button
              onClick={() => {
                setPanicAge('child');
                setPanicStepIndex(0);
              }}
              className={`py-3 px-4 font-black rounded-xl text-xs uppercase tracking-wider border-2 transition-all cursor-pointer ${
                panicAge === 'child'
                  ? 'bg-cyan-600 border-cyan-500 text-white shadow-lg shadow-cyan-600/20 scale-[1.02]'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              👦 Niño (1 a 10 años)
            </button>
          </div>
        </div>

        {/* MAIN BODY: GIANT HIGH CONTRAST STEP PRESENTATION */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col justify-center items-center max-w-4xl mx-auto w-full">
          
          {/* Progress Indicator Dots */}
          <div className="flex gap-2.5 mb-6 justify-center shrink-0">
            {panicSteps[panicScenario][panicAge].map((_, idx) => (
              <button
                key={idx}
                onClick={() => setPanicStepIndex(idx)}
                className={`w-12 h-2.5 rounded-full transition-all cursor-pointer ${
                  idx === panicStepIndex
                    ? 'bg-rose-500 scale-110'
                    : idx < panicStepIndex
                    ? 'bg-slate-600'
                    : 'bg-slate-800'
                }`}
                title={`Paso ${idx + 1}`}
              />
            ))}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-10 w-full shadow-2xl flex flex-col gap-6 text-center">
            
            {/* Step Counter Label */}
            <div className="flex justify-between items-center shrink-0">
              <span className="text-xs font-extrabold text-rose-500 tracking-widest uppercase">
                PASO {panicStepIndex + 1} DE {panicSteps[panicScenario][panicAge].length}
              </span>
              <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-[10px] text-slate-400 font-bold rounded-lg uppercase tracking-wider">
                {panicScenario === 'rcp' ? 'PROCEDIMIENTO RCP' : 'PROCEDIMIENTO ASFIXIA'}
              </span>
            </div>

            {/* Giant Step Title */}
            <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight uppercase leading-tight">
              {currentStep?.title}
            </h2>

            {/* Giant Step Content */}
            <p className="text-lg md:text-2xl font-semibold text-amber-100 leading-relaxed max-w-3xl mx-auto text-center py-2">
              {currentStep?.desc}
            </p>

            {/* Warning card */}
            {currentStep?.warning && (
              <div className="bg-rose-950/40 border border-rose-900/50 rounded-2xl p-4 flex gap-3 text-left max-w-3xl mx-auto">
                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <h4 className="text-xs font-black text-rose-400 uppercase tracking-wider">PRECAUCIÓN DE SEGURIDAD</h4>
                  <p className="text-xs text-rose-200 mt-1 leading-relaxed">
                    {currentStep?.warning}
                  </p>
                </div>
              </div>
            )}

            {/* Voice Control Indicator */}
            <div className="flex justify-center items-center gap-4 py-1 shrink-0">
              <button
                type="button"
                onClick={() => setIsAudioMuted(!isAudioMuted)}
                className={`py-2 px-4 rounded-xl font-bold text-xs flex items-center gap-2 transition-all border cursor-pointer ${
                  isAudioMuted 
                    ? 'bg-slate-800 border-slate-700 text-slate-500' 
                    : 'bg-emerald-950/50 border-emerald-800 text-emerald-400 hover:bg-emerald-900/50'
                }`}
              >
                {isAudioMuted ? (
                  <>
                    <VolumeX className="w-4 h-4" />
                    <span>AUDIO DESACTIVADO</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 animate-bounce" />
                    <span>AUDIO ACTIVADO (AUTOPLAY)</span>
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  if (currentStep) {
                    speakPanicStep(`${currentStep.title}. ... ${currentStep.desc}. ... Nota: ${currentStep.warning}`);
                  }
                }}
                disabled={isAudioMuted}
                className="py-2 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>REPETIR AUDIO</span>
              </button>
            </div>
          </div>
        </div>

        {/* LOWER SECTION: COMPRESSION METRONOME FOR CPR & EMERGENCY TIPS */}
        {panicScenario === 'rcp' && (
          <div className="bg-slate-900 border-t border-slate-800 p-4 shrink-0">
            <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {/* Pulsing Visual light */}
                <div 
                  className={`w-10 h-10 rounded-full transition-all duration-75 flex items-center justify-center ${
                    pulseState 
                      ? 'bg-rose-500 ring-8 ring-rose-500/30 scale-110 shadow-lg shadow-rose-500/50' 
                      : 'bg-slate-800 ring-2 ring-slate-700 scale-100'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${pulseState ? 'text-white fill-current' : 'text-slate-500'}`} />
                </div>
                <div className="text-left">
                  <h4 className="font-extrabold text-xs text-white uppercase tracking-wider">GUÍA DE TEMPO: 110 COMPRESIONES / MINUTO</h4>
                  <p className="text-[10px] text-slate-400">Presiona fuerte y rápido en cada destello de luz roja.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPanicMetronome(!panicMetronome)}
                className={`py-2 px-4 rounded-xl font-extrabold text-xs transition-all border cursor-pointer ${
                  panicMetronome 
                    ? 'bg-rose-950/60 border-rose-800 text-rose-400 hover:bg-rose-900/60' 
                    : 'bg-slate-800 border-slate-700 text-slate-500'
                }`}
              >
                {panicMetronome ? '🔔 METRÓNOMO ACTIVO' : '🔕 METRÓNOMO APAGADO'}
              </button>
            </div>
          </div>
        )}

        {/* BOTTOM NAVIGATION CONTROLS */}
        <div className="p-4 md:p-6 bg-slate-950 border-t border-slate-900 flex justify-between gap-4 shrink-0">
          <button
            onClick={() => setPanicStepIndex(prev => Math.max(0, prev - 1))}
            disabled={panicStepIndex === 0}
            className="flex-1 py-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 text-slate-300 font-black rounded-2xl transition-all border border-slate-800 text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>ANTERIOR</span>
          </button>

          {panicStepIndex < panicSteps[panicScenario][panicAge].length - 1 ? (
            <button
              onClick={() => setPanicStepIndex(prev => prev + 1)}
              className="flex-1 py-4 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 cursor-pointer"
            >
              <span>SIGUIENTE PASO</span>
              <ChevronRight className="w-5 h-5 animate-pulse" />
            </button>
          ) : (
            <button
              onClick={() => {
                setIsPanicMode(false);
                if (synthRef.current) synthRef.current.cancel();
              }}
              className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              <span>¡ENTENDIDO! FINALIZAR</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-100" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div id="emergency-panel" className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Panic Mode High-Contrast Direct Trigger Card */}
      <button
        onClick={() => {
          setIsPanicMode(true);
          setPanicStepIndex(0);
        }}
        className="w-full bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white border-2 border-red-500 rounded-3xl p-5 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-5 transition-all shadow-xl shadow-red-600/10 cursor-pointer text-left group"
      >
        <div className="flex items-center gap-5">
          <div className="p-3.5 bg-white text-red-600 rounded-2xl shrink-0 shadow-md group-hover:scale-105 transition-all">
            <Zap className="w-8 h-8 fill-current text-red-600" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-white uppercase flex items-center gap-2">
              🚨 MODO PÁNICO (AUDIO GUÍA)
            </h2>
            <p className="text-xs font-semibold text-red-100 leading-relaxed max-w-xl">
              ¿Estás en una emergencia de vida o muerte? Activa el modo de alta visibilidad a pantalla completa con voz guiada automática y metrónomo de tempo para RCP o atragantamiento.
            </p>
          </div>
        </div>
        <div className="w-full sm:w-auto px-6 py-4 bg-white text-red-600 font-extrabold rounded-2xl shadow-md text-center transition-all group-hover:bg-red-50 text-sm tracking-widest shrink-0 uppercase">
          ¡ACTIVAR AHORA!
        </div>
      </button>

      {/* Red Critical Warning Alert */}
      <div className="bg-rose-50 border-2 border-rose-500 rounded-3xl p-5 md:p-6 text-rose-950 flex flex-col sm:flex-row items-center gap-5">
        <div className="p-3.5 bg-rose-500 text-white rounded-full shrink-0 shadow-lg animate-pulse">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-1.5 text-center sm:text-left flex-1">
          <h2 className="text-xl font-black tracking-tight text-rose-900 uppercase">Guía Crítica de Primeros Auxilios 2026</h2>
          <p className="text-xs font-semibold text-rose-800 leading-relaxed">
            Conserva la calma. El tiempo es de vital importancia. Sigue las instrucciones ordenadas. Si te encuentras solo, realiza RCP por 2 minutos antes de ir a buscar ayuda o llamar al teléfono de emergencia.
          </p>
        </div>
        <a
          href="tel:123"
          className="w-full sm:w-auto px-5 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all shrink-0 text-sm tracking-wide cursor-pointer"
        >
          <Phone className="w-4 h-4 animate-bounce" /> Llamar Urgencias (123)
        </a>
      </div>

      {/* Hands-Free Voice Control Board */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-800 text-emerald-400 rounded-xl">
            <Volume2 className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h4 className="font-bold text-sm tracking-wide">Asistente de Emergencia Manos Libres</h4>
            <p className="text-[11px] text-slate-400">Escucha los pasos detallados de primeros auxilios de forma pausada y clara.</p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {!isPlayingVoice ? (
            <button
              onClick={startHandsFreeVoice}
              className="w-full sm:w-auto px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl transition-all text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Reproducir Guía en Voz
            </button>
          ) : (
            <button
              onClick={stopVoice}
              className="w-full sm:w-auto px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl transition-all text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-current" /> Detener Audio
            </button>
          )}
        </div>
      </div>

      {/* Main Tabs for Age Categories */}
      <div className="flex border border-slate-200 rounded-xl p-1 bg-slate-50 gap-1">
        <button
          onClick={() => { stopVoice(); setActiveAge('infant'); setSelectedManeuver('rcp_infant'); }}
          className={`flex-1 py-3 text-center rounded-lg font-bold text-xs md:text-sm transition-all cursor-pointer ${
            activeAge === 'infant'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          Lactantes (Menores de 1 año)
        </button>
        <button
          onClick={() => { stopVoice(); setActiveAge('child'); setSelectedManeuver('rcp_child'); }}
          className={`flex-1 py-3 text-center rounded-lg font-bold text-xs md:text-sm transition-all cursor-pointer ${
            activeAge === 'child'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          Niños Pequeños (1 a 10 años)
        </button>
      </div>

      {/* Interactive Step Timeline Container */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`border rounded-2xl p-5 bg-white space-y-2.5 shadow-sm transition-all duration-300 md:col-span-1 text-left ${
              index === 1 ? 'border-rose-200 bg-rose-50/20' : 'border-slate-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                index === 1 ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white'
              }`}>
                {index + 1}
              </span>
              {index === 1 && (
                <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full uppercase">
                  Vital
                </span>
              )}
            </div>
            <h4 className="font-extrabold text-slate-900 text-sm tracking-tight leading-snug">
              {step.title}
            </h4>
            <p className="text-slate-600 text-xs leading-relaxed">
              {step.desc}
            </p>
          </div>
        ))}
      </div>

      {/* HIGH-CONTRAST INTERACTIVE & DOWNLOADABLE DIAGRAM HUB */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 text-left">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              Centro de Diagramas Médicos e Infografías
            </h3>
            <p className="text-xs text-slate-500">
              Visualiza con precisión la técnica, profundidad, colocación de manos y descarga estas guías para tenerlas siempre listas sin internet.
            </p>
          </div>

          {/* Quick maneuver selector within the diagram frame */}
          <div className="flex flex-wrap gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200/50">
            {activeAge === 'infant' ? (
              <>
                <button
                  onClick={() => setSelectedManeuver('rcp_infant')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    selectedManeuver === 'rcp_infant' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Dos Dedos (RCP)
                </button>
                <button
                  onClick={() => setSelectedManeuver('heimlich_infant')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    selectedManeuver === 'heimlich_infant' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Compresiones/Golpes
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setSelectedManeuver('rcp_child')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    selectedManeuver === 'rcp_child' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Talón de Mano (RCP)
                </button>
                <button
                  onClick={() => setSelectedManeuver('heimlich_child')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    selectedManeuver === 'heimlich_child' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Maniobra Heimlich
                </button>
              </>
            )}
          </div>
        </div>

        {/* Live Vector SVG Board Canvas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Main Visual SVG Frame */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-slate-950 rounded-2xl p-4 border border-slate-900 relative overflow-hidden h-[340px]">
            {/* Grid Pattern overlay background */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <svg width="100%" height="100%">
                <defs>
                  <pattern id="diag-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                    <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#6366f1" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#diag-grid)" />
              </svg>
            </div>

            {/* Neon Status Indicator overlay */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span className="font-mono text-[9px] text-slate-300 font-extrabold uppercase tracking-widest bg-slate-900/80 px-2.5 py-1 rounded-md">
                Blueprint Médico AHA 2026
              </span>
            </div>

            {/* Render selected high-contrast vector SVG diagram */}
            <div className="flex-1 flex items-center justify-center relative">
              {/* RCP LACTANTE (DOS DEDOS) SVG */}
              {selectedManeuver === 'rcp_infant' && (
                <svg id="rcp-infant-blueprint" viewBox="0 0 400 300" className="w-full h-full max-h-[280px]">
                  {/* Infant outline sketch */}
                  <path d="M60 160 C90 160, 110 130, 140 130 C160 130, 180 150, 220 150 C260 150, 280 170, 310 170 C340 170, 350 185, 360 185" fill="none" stroke="rgba(99, 102, 241, 0.4)" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="140" cy="110" r="28" fill="none" stroke="rgba(99, 102, 241, 0.4)" strokeWidth="3" />
                  
                  {/* Lungs schematic */}
                  <path d="M185 145 C190 120, 220 120, 225 145 C220 170, 190 170, 185 145 Z" fill="rgba(16, 185, 129, 0.08)" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="1.5" />
                  
                  {/* Finger Placement Target Circle */}
                  <g onMouseEnter={() => setHoveredZone('target')} onMouseLeave={() => setHoveredZone(null)}>
                    <circle cx="195" cy="148" r="14" fill={hoveredZone === 'target' ? "rgba(16, 185, 129, 0.3)" : "rgba(16, 185, 129, 0.15)"} stroke="#10b981" strokeWidth="2.5" className="cursor-pointer transition-all duration-300" />
                    <circle cx="195" cy="148" r="4" fill="#10b981" />
                    <circle cx="195" cy="148" r="22" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" className="animate-spin duration-3000" />
                  </g>

                  {/* Two fingers illustration schematic vector */}
                  <g stroke="#38bdf8" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" className="translate-x-[5px] translate-y-[-10px]">
                    <path d="M190 100 L190 145" />
                    <path d="M200 95 L200 145" />
                    <path d="M180 115 L180 100 C180 85, 190 85, 190 100" />
                    <path d="M210 115 L210 95 C210 80, 200 80, 200 95" />
                  </g>

                  {/* Compression Arrow and depth lines */}
                  <g stroke="#f43f5e" strokeWidth="2" fill="none">
                    <path d="M150 148 L170 148" />
                    <path d="M150 168 L170 168" />
                    <line x1="160" y1="148" x2="160" y2="168" strokeWidth="2.5" />
                    {/* Arrow head */}
                    <path d="M156 163 L160 168 L164 163" strokeWidth="2.5" />
                  </g>

                  {/* Labels on Blueprint (using inline styles to ensure canvas print accuracy) */}
                  <text x="160" y="110" fontFamily="monospace" fontSize="9" fontWeight="bold" fill="#38bdf8" textAnchor="middle">2 Dedos</text>
                  <text x="115" y="160" fontFamily="monospace" fontSize="10" fontWeight="bold" fill="#f43f5e" textAnchor="middle">4 cm</text>
                  <text x="195" y="185" fontFamily="monospace" fontSize="9.5" fontWeight="black" fill="#10b981" textAnchor="middle">Esternón Medio (Pezones)</text>
                  <text x="195" y="240" fontFamily="monospace" fontSize="11" fontWeight="black" fill="#ffffff" textAnchor="middle">30 COMPRESIONES : 2 INSUFLACIONES</text>
                  <text x="195" y="260" fontFamily="monospace" fontSize="9" fontWeight="bold" fill="#94a3b8" textAnchor="middle">Frecuencia: 100 - 120 lpm (Rápido y Firme)</text>
                </svg>
              )}

              {/* HEIMLICH / DESATRAGANTAMIENTO LACTANTE */}
              {selectedManeuver === 'heimlich_infant' && (
                <svg id="heimlich-infant-blueprint" viewBox="0 0 400 300" className="w-full h-full max-h-[280px]">
                  {/* Adult arm holding infant face down */}
                  <path d="M40 210 L160 170" stroke="#475569" strokeWidth="12" strokeLinecap="round" />
                  
                  {/* Infant face down profile angled downwards */}
                  <g transform="rotate(15, 140, 150)">
                    <path d="M70 140 C100 140, 130 150, 170 150 C200 150, 220 170, 250 170 C270 170, 290 185, 300 185" fill="none" stroke="rgba(99, 102, 241, 0.4)" strokeWidth="3" strokeLinecap="round" />
                    <circle cx="230" cy="180" r="22" fill="none" stroke="rgba(99, 102, 241, 0.4)" strokeWidth="3" />
                  </g>

                  {/* Impact Zone (Between shoulder blades) */}
                  <g onMouseEnter={() => setHoveredZone('blades')} onMouseLeave={() => setHoveredZone(null)}>
                    <circle cx="160" cy="130" r="14" fill={hoveredZone === 'blades' ? "rgba(244, 63, 94, 0.3)" : "rgba(244, 63, 94, 0.15)"} stroke="#f43f5e" strokeWidth="2" />
                    <circle cx="160" cy="130" r="3" fill="#f43f5e" />
                  </g>

                  {/* Adult hand slapping back vector */}
                  <g transform="translate(130, 60)">
                    <path d="M20 20 C25 5, 45 5, 50 20 C45 35, 25 35, 20 20 Z" fill="rgba(16, 185, 129, 0.1)" stroke="#10b981" strokeWidth="2.5" />
                    <path d="M12 40 L30 15" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" />
                    <path d="M12 40 C10 45, 5 35, 15 25" stroke="#10b981" strokeWidth="2" />
                  </g>

                  {/* Firm slap vector direction arrow */}
                  <path d="M170 70 L155 110" stroke="#f43f5e" strokeWidth="3" fill="none" strokeLinecap="round" />
                  <path d="M151 103 L153 112 L161 108" stroke="#f43f5e" strokeWidth="3" fill="none" />

                  {/* Labels */}
                  <text x="210" y="70" fontFamily="monospace" fontSize="10" fontWeight="black" fill="#10b981">Talón de la Mano</text>
                  <text x="160" y="160" fontFamily="monospace" fontSize="9" fontWeight="bold" fill="#f43f5e" textAnchor="middle">Entre Omóplatos</text>
                  <text x="195" y="235" fontFamily="monospace" fontSize="11" fontWeight="black" fill="#ffffff" textAnchor="middle">5 GOLPES FUERTES EN LA ESPALDA</text>
                  <text x="195" y="255" fontFamily="monospace" fontSize="9.5" fontWeight="bold" fill="#38bdf8" textAnchor="middle">Luego gírelo y dé 5 compresiones de pecho</text>
                  <text x="195" y="275" fontFamily="monospace" fontSize="8" fontWeight="bold" fill="#94a3b8" textAnchor="middle">Cabeza siempre más baja que el cuerpo</text>
                </svg>
              )}

              {/* RCP NIÑO (TALÓN DE MANO) SVG */}
              {selectedManeuver === 'rcp_child' && (
                <svg id="rcp-child-blueprint" viewBox="0 0 400 300" className="w-full h-full max-h-[280px]">
                  {/* Child body laying down */}
                  <path d="M40 180 C80 180, 100 130, 150 130 C190 130, 210 160, 260 160 C300 160, 320 180, 360 180" fill="none" stroke="rgba(99, 102, 241, 0.4)" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="150" cy="95" r="32" fill="none" stroke="rgba(99, 102, 241, 0.4)" strokeWidth="3" />
                  
                  {/* ECG Heart beat background lines */}
                  <path d="M40 40 L100 40 L110 20 L120 60 L130 30 L140 40 L200 40" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  <Heart className="w-4 h-4 text-emerald-500 absolute top-5 right-20 opacity-35" />

                  {/* Hand Heel placement target zone */}
                  <g onMouseEnter={() => setHoveredZone('sternum')} onMouseLeave={() => setHoveredZone(null)}>
                    <circle cx="210" cy="158" r="18" fill={hoveredZone === 'sternum' ? "rgba(16, 185, 129, 0.35)" : "rgba(16, 185, 129, 0.15)"} stroke="#10b981" strokeWidth="2.5" />
                    <circle cx="210" cy="158" r="4" fill="#10b981" />
                  </g>

                  {/* Heel of one hand vector sketch */}
                  <g stroke="#38bdf8" strokeWidth="3.5" fill="none" strokeLinecap="round" transform="translate(180, 75)">
                    <path d="M30 40 C15 45, 10 5, 25 15 C30 5, 45 10, 40 25 C45 25, 50 45, 30 40 Z" fill="rgba(56, 189, 248, 0.08)" />
                    <path d="M12 60 L12 40" />
                    <path d="M22 62 L22 45" />
                    <path d="M32 60 L32 45" />
                  </g>

                  {/* Vertical compression force vector */}
                  <g stroke="#f43f5e" strokeWidth="2.5" fill="none">
                    <line x1="210" y1="50" x2="210" y2="120" strokeWidth="3" />
                    <path d="M204 112 L210 120 L216 112" strokeWidth="3" />
                    <text x="225" y="80" fontFamily="monospace" fontSize="10" fontWeight="black" fill="#f43f5e">5 cm</text>
                  </g>

                  {/* Specifications text */}
                  <text x="210" y="195" fontFamily="monospace" fontSize="10" fontWeight="black" fill="#10b981" textAnchor="middle">Mitad Inferior del Esternón</text>
                  <text x="195" y="235" fontFamily="monospace" fontSize="11" fontWeight="black" fill="#ffffff" textAnchor="middle">30 COMPRESIONES : 2 INSUFLACIONES</text>
                  <text x="195" y="255" fontFamily="monospace" fontSize="9" fontWeight="bold" fill="#38bdf8" textAnchor="middle">Presione fuerte e inclina la cabeza para respiraciones</text>
                  <text x="195" y="275" fontFamily="monospace" fontSize="8" fontWeight="bold" fill="#94a3b8" textAnchor="middle">Utilice talón de 1 sola mano (o 2 si el niño es muy grande)</text>
                </svg>
              )}

              {/* HEIMLICH NIÑO (ATRAGANTAMIENTO) SVG */}
              {selectedManeuver === 'heimlich_child' && (
                <svg id="heimlich-child-blueprint" viewBox="0 0 400 300" className="w-full h-full max-h-[280px]">
                  {/* Outline of child from the side */}
                  <path d="M130 250 L130 120 C130 110, 140 100, 150 100 C160 100, 170 115, 170 130 C170 145, 180 180, 180 250" fill="none" stroke="rgba(99, 102, 241, 0.4)" strokeWidth="3.5" strokeLinecap="round" />
                  <circle cx="155" cy="70" r="24" fill="none" stroke="rgba(99, 102, 241, 0.4)" strokeWidth="3" />
                  
                  {/* Outline of adult arms wrapped around from behind */}
                  <path d="M100 135 C115 135, 125 140, 145 140" stroke="#38bdf8" strokeWidth="4.5" fill="none" strokeLinecap="round" />

                  {/* Target placement (Two fingers width above navel) */}
                  <g onMouseEnter={() => setHoveredZone('navel')} onMouseLeave={() => setHoveredZone(null)}>
                    <circle cx="146" cy="142" r="15" fill={hoveredZone === 'navel' ? "rgba(244, 63, 94, 0.35)" : "rgba(244, 63, 94, 0.15)"} stroke="#f43f5e" strokeWidth="2" />
                    <circle cx="146" cy="142" r="3.5" fill="#f43f5e" />
                  </g>

                  {/* Fist placement wrapped by other hand vector */}
                  <g stroke="#10b981" strokeWidth="3" fill="none" transform="translate(136, 128)">
                    <circle cx="10" cy="10" r="8" fill="rgba(16, 185, 129, 0.2)" />
                    <path d="M2 10 L18 10" />
                    <path d="M10 2 L10 18" />
                  </g>

                  {/* Upward and inward 'J' thrust arrow */}
                  <g stroke="#f43f5e" strokeWidth="3" fill="none">
                    <path d="M125 160 C125 150, 135 125, 160 120" strokeWidth="4" />
                    <path d="M152 125 L160 120 L157 112" strokeWidth="3.5" fill="none" />
                  </g>

                  {/* Labels */}
                  <text x="180" y="112" fontFamily="monospace" fontSize="9" fontWeight="bold" fill="#f43f5e">Hacia adentro y arriba (en J)</text>
                  <text x="90" y="130" fontFamily="monospace" fontSize="9" fontWeight="bold" fill="#38bdf8">Puño de Adulto</text>
                  <text x="195" y="235" fontFamily="monospace" fontSize="11" fontWeight="black" fill="#ffffff" textAnchor="middle">PRESIONES ABDOMINALES RÁPIDAS</text>
                  <text x="195" y="255" fontFamily="monospace" fontSize="9.5" fontWeight="bold" fill="#10b981" textAnchor="middle">Coloque el puño justo arriba del ombligo</text>
                  <text x="195" y="275" fontFamily="monospace" fontSize="8" fontWeight="bold" fill="#94a3b8" textAnchor="middle">Evite presionar las costillas inferiores o esternón</text>
                </svg>
              )}
            </div>

            {/* Quick specifications legend footer overlay */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between text-[10px] font-mono font-semibold text-slate-300">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Actualizado AAP/AHA
              </span>
              <span>Visualizado en Alta Resolución</span>
            </div>
          </div>

          {/* Right Text Column: Clinical parameters & download cards */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4 text-left">
            
            {/* Context details card */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4.5 space-y-3 flex-1">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wide">
                Especificaciones Técnicas del Procedimiento
              </h4>
              
              <div className="space-y-2.5">
                {selectedManeuver === 'rcp_infant' && (
                  <>
                    <div className="flex justify-between items-center border-b border-slate-200/50 pb-2 text-xs">
                      <span className="font-medium text-slate-500">Mano / Dedos</span>
                      <span className="font-black text-slate-800">2 dedos en centro del pecho</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-200/50 pb-2 text-xs">
                      <span className="font-medium text-slate-500">Profundidad</span>
                      <span className="font-black text-rose-600">Aproximadamente 4 cm (1.5 in)</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-200/50 pb-2 text-xs">
                      <span className="font-medium text-slate-500">Relación C-V</span>
                      <span className="font-black text-slate-800">30 compresiones : 2 insuflaciones</span>
                    </div>
                    <div className="flex justify-between items-center pb-1 text-xs">
                      <span className="font-medium text-slate-500">Ritmo</span>
                      <span className="font-black text-slate-800">100 a 120 por minuto</span>
                    </div>
                  </>
                )}

                {selectedManeuver === 'heimlich_infant' && (
                  <>
                    <div className="flex justify-between items-center border-b border-slate-200/50 pb-2 text-xs">
                      <span className="font-medium text-slate-500">Posición</span>
                      <span className="font-black text-slate-800">Boca abajo en antebrazo (inclinado)</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-200/50 pb-2 text-xs">
                      <span className="font-medium text-slate-500">Golpes traseros</span>
                      <span className="font-black text-rose-600">5 golpes secos con talón de la mano</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-200/50 pb-2 text-xs">
                      <span className="font-medium text-slate-500">Compresiones de pecho</span>
                      <span className="font-black text-slate-800">5 lentas en el pecho boca arriba</span>
                    </div>
                    <div className="flex justify-between items-center pb-1 text-xs">
                      <span className="font-medium text-slate-500">Advertencia</span>
                      <span className="font-black text-amber-600">No meta los dedos a ciegas en la boca</span>
                    </div>
                  </>
                )}

                {selectedManeuver === 'rcp_child' && (
                  <>
                    <div className="flex justify-between items-center border-b border-slate-200/50 pb-2 text-xs">
                      <span className="font-medium text-slate-500">Mano</span>
                      <span className="font-black text-slate-800">Talón de 1 sola mano (o las dos)</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-200/50 pb-2 text-xs">
                      <span className="font-medium text-slate-500">Profundidad</span>
                      <span className="font-black text-rose-600">Aproximadamente 5 cm (2 in)</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-200/50 pb-2 text-xs">
                      <span className="font-medium text-slate-500">Relación C-V</span>
                      <span className="font-black text-slate-800">30 compresiones : 2 insuflaciones</span>
                    </div>
                    <div className="flex justify-between items-center pb-1 text-xs">
                      <span className="font-medium text-slate-500">Fuerza</span>
                      <span className="font-black text-slate-800">Permitir expansión total del tórax</span>
                    </div>
                  </>
                )}

                {selectedManeuver === 'heimlich_child' && (
                  <>
                    <div className="flex justify-between items-center border-b border-slate-200/50 pb-2 text-xs">
                      <span className="font-medium text-slate-500">Colocación</span>
                      <span className="font-black text-slate-800">Rodee cintura detrás de rodillas</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-200/50 pb-2 text-xs">
                      <span className="font-medium text-slate-500">Punto de presión</span>
                      <span className="font-black text-slate-800">Justo arriba del ombligo</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-200/50 pb-2 text-xs">
                      <span className="font-medium text-slate-500">Vector de fuerza</span>
                      <span className="font-black text-rose-600">Rápido hacia adentro y arriba (en J)</span>
                    </div>
                    <div className="flex justify-between items-center pb-1 text-xs">
                      <span className="font-medium text-slate-500">Si pierde consciencia</span>
                      <span className="font-black text-rose-600">Inicie RCP de inmediato</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Quick Export Panel triggers */}
            <div className="space-y-2">
              <button
                onClick={() => {
                  const svgId = selectedManeuver === 'rcp_infant' ? 'rcp-infant-blueprint' 
                    : selectedManeuver === 'heimlich_infant' ? 'heimlich-infant-blueprint'
                    : selectedManeuver === 'rcp_child' ? 'rcp-child-blueprint'
                    : 'heimlich-child-blueprint';
                  
                  const filename = `Amapola_Ficha_Emergencia_${selectedManeuver}.png`;
                  downloadAsPng(svgId, filename);
                }}
                disabled={downloadingId !== null}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-white font-extrabold rounded-xl transition-all text-xs inline-flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                {downloadingId ? (
                  <>
                    <Activity className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    <span>Renderizando Tarjeta HD...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Descargar Ficha Médica HD (PNG)</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  const svgId = selectedManeuver === 'rcp_infant' ? 'rcp-infant-blueprint' 
                    : selectedManeuver === 'heimlich_infant' ? 'heimlich-infant-blueprint'
                    : selectedManeuver === 'rcp_child' ? 'rcp-child-blueprint'
                    : 'heimlich-child-blueprint';
                  
                  const filename = `Amapola_Ficha_Vectorial_${selectedManeuver}.svg`;
                  downloadAsSvg(svgId, filename);
                }}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-200 rounded-xl transition-all text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-slate-500" />
                <span>Exportar Guía Vectorial Escalable (SVG)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Instruction Guide Diagram Fallbacks */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
        <h4 className="font-bold text-sm text-slate-800 inline-flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-600" /> Notas de Seguridad AHA/AAP 2026:
        </h4>
        <ul className="text-xs text-slate-600 list-disc list-inside space-y-2 leading-relaxed text-left">
          <li><strong>Compresiones:</strong> Mantén los brazos rectos si es un niño grande, presionando rápido y permitiendo que el pecho vuelva completamente a su posición original antes de volver a presionar.</li>
          <li><strong>Ventilaciones:</strong> Si no te sientes cómodo realizando ventilaciones, realiza **únicamente compresiones continuas** a ritmo constante. Las manos continúan salvando vidas.</li>
          <li><strong>Atragantamiento:</strong> Realiza las maniobras únicamente si el niño no puede respirar o emitir sonidos. Si tose con fuerza, anímalo a continuar tosiendo sin golpearle la espalda.</li>
        </ul>
      </div>
    </div>
  );
}
