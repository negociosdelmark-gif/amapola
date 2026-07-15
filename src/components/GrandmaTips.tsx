import { useState, useEffect } from 'react';
import { Star, Wind, Thermometer, Users, HeartHandshake, Volume2, VolumeX } from 'lucide-react';
import { speakText, stopSpeaking } from '../lib/tts';

export default function GrandmaTips() {
  const [activeSpeakingTip, setActiveSpeakingTip] = useState<string | null>(null);

  // Listen for speech status events from the TTS engine
  useEffect(() => {
    const handleSpeechStatus = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        if (customEvent.detail.speaking) {
          // Find which tip is being spoken based on text content
          const text = customEvent.detail.text || '';
          if (text.includes('gases') || text.includes('hombro')) {
            setActiveSpeakingTip('gases');
          } else if (text.includes('temperatura') || text.includes('capa')) {
            setActiveSpeakingTip('temperatura');
          } else if (text.includes('visitas') || text.includes('besar')) {
            setActiveSpeakingTip('visitas');
          }
        } else {
          setActiveSpeakingTip(null);
        }
      }
    };

    window.addEventListener('amapola_speech_status', handleSpeechStatus);
    return () => {
      window.removeEventListener('amapola_speech_status', handleSpeechStatus);
    };
  }, []);

  const handleSpeak = (tipId: string, text: string) => {
    if (activeSpeakingTip === tipId) {
      stopSpeaking();
      setActiveSpeakingTip(null);
    } else {
      speakText(text, true); // Force-speak on manual click
      setActiveSpeakingTip(tipId);
    }
  };

  const gasesText = "Consejo para Sacar los gases y evitar reflujo. El truco del hombro: Pon una toallita en tu hombro, apoya al bebé alto de modo que su barriguita quede en tu pecho, y da palmaditas suaves de abajo hacia arriba. La bicicleta: Acuéstalo boca arriba y mueve sus piernitas suavemente hacia su barriguita como si pedaleara. Pausas: Si toma biberón, hazle eructar a la mitad de la toma.";
  
  const temperaturaText = "Consejo para Conservar la temperatura. La regla de una capa más: El bebé debe tener solo una capa de ropa más de la que tú llevas puesta. El termómetro real no son las manos: Tócales la nuca o el pecho para comprobar su calor real. Gorritos: Usa gorritos solo los primeros días o si salen al frío real, pero no para dormir.";

  const visitasText = "Manual para Visitas y poner límites. Reglas de oro: Prohibido besar al bebé cerca de la cara o manos. Lavado de manos riguroso como entrada sin ofenderse. Si estás enfermo, no vengas. Visitas útiles: Una buena visita te trae comida hecha, lava platos o te cuida al bebé mientras duermes.";

  return (
    <div className="space-y-6 text-left">
      <div className="bg-gradient-to-r from-amber-100 to-yellow-50 p-6 rounded-3xl border border-amber-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-amber-900 mb-2 flex items-center gap-2">
            <Star className="w-6 h-6 text-amber-500 fill-current animate-spin-slow" />
            Consejos de Abuela (Seguros)
          </h2>
          <p className="text-sm text-amber-800 font-semibold leading-relaxed">
            Esa sabiduría tradicional que pasa de generación en generación, filtrada y aprobada para que sea 100% segura para tu bebé hoy.
          </p>
        </div>
        
        <button
          onClick={() => {
            stopSpeaking();
            setActiveSpeakingTip(null);
          }}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-amber-600/15 cursor-pointer flex items-center gap-1.5 self-start md:self-auto shrink-0"
        >
          <VolumeX className="w-3.5 h-3.5" />
          Silenciar Todo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gases */}
        <div className={`bg-white border p-5 rounded-3xl shadow-sm hover:shadow-md transition-all relative overflow-hidden ${activeSpeakingTip === 'gases' ? 'border-amber-400 ring-2 ring-amber-100' : 'border-slate-200'}`}>
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
              <Wind className="w-5 h-5" />
            </div>
            
            <button
              onClick={() => handleSpeak('gases', gasesText)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${activeSpeakingTip === 'gases' ? 'bg-amber-500 border-amber-500 text-white animate-pulse' : 'bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border-slate-200'}`}
              title={activeSpeakingTip === 'gases' ? "Pausar lectura" : "Escuchar consejo en voz alta"}
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
          
          <h3 className="text-lg font-black text-slate-900 mb-2 flex items-center gap-2">
            Sacar los Gases (Evitar Reflujo)
            {activeSpeakingTip === 'gases' && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed mb-4 font-semibold">
            Las abuelas tienen razón: un bebé con gases es un bebé incómodo que no duerme bien.
          </p>
          <ul className="text-xs text-slate-700 space-y-2 list-disc pl-4 font-medium">
            <li><strong>El truco del hombro:</strong> Pon una toallita en tu hombro, apoya al bebé alto (que su barriguita quede en tu pecho) y da palmaditas suaves en su espalda de abajo hacia arriba.</li>
            <li><strong>La "bicicleta":</strong> Acuéstalo boca arriba y mueve sus piernitas suavemente hacia su barriguita como si pedaleara. ¡Santo remedio!</li>
            <li><strong>Pausas:</strong> Si toma biberón, hazle eructar a la mitad de la toma.</li>
          </ul>
        </div>

        {/* Temperatura */}
        <div className={`bg-white border p-5 rounded-3xl shadow-sm hover:shadow-md transition-all relative overflow-hidden ${activeSpeakingTip === 'temperatura' ? 'border-amber-400 ring-2 ring-amber-100' : 'border-slate-200'}`}>
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center">
              <Thermometer className="w-5 h-5" />
            </div>
            
            <button
              onClick={() => handleSpeak('temperatura', temperaturaText)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${activeSpeakingTip === 'temperatura' ? 'bg-amber-500 border-amber-500 text-white animate-pulse' : 'bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border-slate-200'}`}
              title={activeSpeakingTip === 'temperatura' ? "Pausar lectura" : "Escuchar consejo en voz alta"}
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
          
          <h3 className="text-lg font-black text-slate-900 mb-2 flex items-center gap-2">
            Conservar la Temperatura
            {activeSpeakingTip === 'temperatura' && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed mb-4 font-semibold">
            "¡Abrígalo que le da un aire!" - Aunque no debemos sobreabrigar, los recién nacidos pierden calor rápido.
          </p>
          <ul className="text-xs text-slate-700 space-y-2 list-disc pl-4 font-medium">
            <li><strong>La regla de la +1 capa:</strong> El bebé debe tener solo UNA capa de ropa más de la que tú llevas puesta para sentirte cómodo.</li>
            <li><strong>El termómetro real no son las manos:</strong> Es normal que tengan manos y pies fríos. Para saber si tienen frío o calor, tócales la nuca o el pecho. Si suda ahí, quítale ropa.</li>
            <li><strong>Gorritos:</strong> Usa gorrito solo los primeros días o si salen al frío real, pero no para dormir en casa (riesgo de sobrecalentamiento).</li>
          </ul>
        </div>

        {/* Visitas */}
        <div className={`bg-white border p-5 rounded-3xl shadow-sm hover:shadow-md transition-all relative overflow-hidden md:col-span-2 ${activeSpeakingTip === 'visitas' ? 'border-amber-400 ring-2 ring-amber-100' : 'border-slate-200'}`}>
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            
            <button
              onClick={() => handleSpeak('visitas', visitasText)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${activeSpeakingTip === 'visitas' ? 'bg-amber-500 border-amber-500 text-white animate-pulse' : 'bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border-slate-200'}`}
              title={activeSpeakingTip === 'visitas' ? "Pausar lectura" : "Escuchar consejo en voz alta"}
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
          
          <h3 className="text-lg font-black text-slate-900 mb-2 flex items-center gap-2">
            Manual para Visitas (Y cómo poner límites)
            {activeSpeakingTip === 'visitas' && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed mb-4 font-semibold">
            El instinto de protección es real. Las abuelas sabían que los primeros días son sagrados para el núcleo familiar.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl">
              <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-1"><HeartHandshake className="w-4 h-4 text-emerald-500" /> Reglas de Oro</h4>
              <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-4 font-medium">
                <li><strong>Prohibido besar:</strong> NINGUNA visita debe besar al bebé cerca del rostro o las manos (peligro de herpes y virus respiratorios).</li>
                <li><strong>Lavado de manos:</strong> Exígelo como peaje de entrada. Sin ofenderse.</li>
                <li><strong>Si estás enfermo, no vengas:</strong> Ni siquiera con "es solo una alergia".</li>
              </ul>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl">
              <h4 className="font-bold text-slate-800 text-sm mb-2">Visitas Útiles vs. Molestas</h4>
              <p className="text-xs text-slate-700 mb-2 font-medium">Una buena visita no viene a cargar al bebé para que tú atiendas; viene a traerte comida, lavar platos o dejarte dormir.</p>
              <p className="text-xs text-slate-500 italic font-semibold">"Las visitas cortas (máximo 45 min) y avisadas con tiempo son las que conservan la amistad."</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
