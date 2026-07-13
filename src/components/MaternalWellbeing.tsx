import { useState } from 'react';
import { Heart, Moon, Coffee, Smile, Frown, Shield, Sun } from 'lucide-react';

export default function MaternalWellbeing() {
  const [activeTopic, setActiveTopic] = useState('mood');

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-100 to-pink-50 p-6 rounded-3xl border border-purple-100">
        <h2 className="text-2xl font-black text-purple-900 mb-2 flex items-center gap-2">
          <Heart className="w-6 h-6 text-purple-500 fill-current" />
          Espacio de la Mamá
        </h2>
        <p className="text-sm text-purple-800 font-medium leading-relaxed">
          Cuidar de ti es el primer paso para cuidar de tu bebé. Aquí encontrarás recursos para tu bienestar emocional y físico durante la maternidad.
        </p>
      </div>

      <div className="flex overflow-x-auto gap-2 pb-2">
        <button
          onClick={() => setActiveTopic('mood')}
          className={`shrink-0 px-4 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer ${
            activeTopic === 'mood' ? 'bg-purple-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Smile className="w-4 h-4" /> Estados de Ánimo
        </button>
        <button
          onClick={() => setActiveTopic('fears')}
          className={`shrink-0 px-4 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer ${
            activeTopic === 'fears' ? 'bg-purple-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Shield className="w-4 h-4" /> Miedos Comunes
        </button>
        <button
          onClick={() => setActiveTopic('routines')}
          className={`shrink-0 px-4 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer ${
            activeTopic === 'routines' ? 'bg-purple-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Moon className="w-4 h-4" /> Rutinas y Descanso
        </button>
        <button
          onClick={() => setActiveTopic('feeding')}
          className={`shrink-0 px-4 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer ${
            activeTopic === 'feeding' ? 'bg-purple-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Coffee className="w-4 h-4" /> Alimentación
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm min-h-[300px]">
        {activeTopic === 'mood' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <h3 className="text-lg font-black text-slate-900">Montaña Rusa Emocional</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Es completamente normal sentir una mezcla de alegría, tristeza, ansiedad y agotamiento. Los cambios hormonales (Baby Blues) afectan hasta al 80% de las madres.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                <h4 className="font-bold text-purple-900 mb-2 flex items-center gap-1.5"><Sun className="w-4 h-4" /> Lo Normal (Baby Blues)</h4>
                <ul className="text-xs text-purple-800 space-y-1.5 list-disc pl-4">
                  <li>Llanto repentino sin razón aparente</li>
                  <li>Cambios de humor rápidos</li>
                  <li>Sentirse abrumada</li>
                  <li>Dura entre 1 y 2 semanas tras el parto</li>
                </ul>
              </div>
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                <h4 className="font-bold text-rose-900 mb-2 flex items-center gap-1.5"><Frown className="w-4 h-4" /> Señales de Alerta</h4>
                <ul className="text-xs text-rose-800 space-y-1.5 list-disc pl-4">
                  <li>Tristeza profunda que no desaparece</li>
                  <li>Dificultad para vincularse con el bebé</li>
                  <li>Insomnio grave o dormir demasiado</li>
                  <li>Pensamientos de hacerse daño. <strong>Busca ayuda médica de inmediato.</strong></li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTopic === 'fears' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <h3 className="text-lg font-black text-slate-900">Miedos de las Primerizas</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Casi todas las madres comparten las mismas preocupaciones. Aquí desmitificamos algunas:
            </p>
            <div className="space-y-3">
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="font-bold text-slate-800 text-sm mb-1">"¿Está respirando bien?"</p>
                <p className="text-xs text-slate-600">Es el miedo #1. La respiración de un recién nacido es irregular (respira rápido y luego hace pausas breves). Es normal siempre y cuando no se ponga morado ni se le hundan las costillas.</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="font-bold text-slate-800 text-sm mb-1">"¿Lo estoy alimentando suficiente?"</p>
                <p className="text-xs text-slate-600">Si moja al menos 6 pañales al día con orina clara, hace deposiciones y gana peso en los controles pediátricos, lo estás haciendo excelente.</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="font-bold text-slate-800 text-sm mb-1">"Siento que no sé lo que hago"</p>
                <p className="text-xs text-slate-600">Nadie nace sabiendo ser madre. Confía en tu instinto, pide ayuda sin culpa y recuerda que el bebé solo necesita tu amor, no la perfección.</p>
              </div>
            </div>
          </div>
        )}

        {activeTopic === 'routines' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <h3 className="text-lg font-black text-slate-900">Supervivencia y Descanso</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              La privación de sueño es la prueba más dura. Estrategias reales para sobrevivir:
            </p>
            <ul className="space-y-3 mt-4">
              <li className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">1</div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Duerme cuando el bebé duerma</p>
                  <p className="text-xs text-slate-600 mt-0.5">Ignora el desorden de la casa. Los platos pueden esperar, tu salud mental no. Si el bebé duerme 40 minutos, tú también acuéstate.</p>
                </div>
              </li>
              <li className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">2</div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Turnos nocturnos</p>
                  <p className="text-xs text-slate-600 mt-0.5">Si tienes pareja, dividan la noche. Si amamantas, tu pareja puede encargarse de sacar los gases, cambiar el pañal y dormir al bebé después de la toma.</p>
                </div>
              </li>
              <li className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">3</div>
                <div>
                  <p className="text-sm font-bold text-slate-800">15 minutos para ti</p>
                  <p className="text-xs text-slate-600 mt-0.5">Exige 15 minutos diarios innegociables para darte una ducha caliente sola o tomarte un té en silencio. Cambia todo el panorama del día.</p>
                </div>
              </li>
            </ul>
          </div>
        )}

        {activeTopic === 'feeding' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <h3 className="text-lg font-black text-slate-900">Alimentación de la Madre</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Si estás amamantando (o recuperándote del parto), tu cuerpo es una máquina trabajando al 200%.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                <h4 className="font-bold text-emerald-900 mb-2">Hidratación Extrema</h4>
                <p className="text-xs text-emerald-800">
                  La lactancia da muchísima sed. Mantén un termo gigante de agua en tu "estación de lactancia". Intenta tomar entre 2.5 y 3 litros diarios.
                </p>
              </div>
              <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                <h4 className="font-bold text-orange-900 mb-2">Snacks a la mano</h4>
                <p className="text-xs text-orange-800">
                  El hambre ataca en la madrugada. Ten a la mano nueces, almendras, fruta picada, o barras de avena. Necesitas unas 500 calorías extra al día.
                </p>
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-4 bg-slate-100 p-3 rounded-xl">
              💡 Mito: "Ciertos alimentos le dan gases al bebé". La ciencia dice que la leche materna se forma de la sangre, no directamente del estómago. Come variado y sano; solo restringe alimentos si el pediatra nota alergias.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
