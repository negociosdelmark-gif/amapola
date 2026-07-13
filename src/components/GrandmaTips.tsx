import { Star, Wind, Thermometer, Users, HeartHandshake } from 'lucide-react';

export default function GrandmaTips() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-100 to-yellow-50 p-6 rounded-3xl border border-amber-100">
        <h2 className="text-2xl font-black text-amber-900 mb-2 flex items-center gap-2">
          <Star className="w-6 h-6 text-amber-500 fill-current" />
          Consejos de Abuela (Seguros)
        </h2>
        <p className="text-sm text-amber-800 font-medium leading-relaxed">
          Esa sabiduría tradicional que pasa de generación en generación, filtrada y aprobada para que sea 100% segura para tu bebé hoy.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gases */}
        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <Wind className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-black text-slate-900 mb-2">Sacar los Gases (Evitar Reflujo)</h3>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">
            Las abuelas tienen razón: un bebé con gases es un bebé incómodo que no duerme bien.
          </p>
          <ul className="text-xs text-slate-700 space-y-2 list-disc pl-4">
            <li><strong>El truco del hombro:</strong> Pon una toallita en tu hombro, apoya al bebé alto (que su barriguita quede en tu pecho) y da palmaditas suaves en su espalda de abajo hacia arriba.</li>
            <li><strong>La "bicicleta":</strong> Acuéstalo boca arriba y mueve sus piernitas suavemente hacia su barriguita como si pedaleara. ¡Santo remedio!</li>
            <li><strong>Pausas:</strong> Si toma biberón, hazle eructar a la mitad de la toma.</li>
          </ul>
        </div>

        {/* Temperatura */}
        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-4">
            <Thermometer className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-black text-slate-900 mb-2">Conservar la Temperatura</h3>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">
            "¡Abrígalo que le da un aire!" - Aunque no debemos sobreabrigar, los recién nacidos pierden calor rápido.
          </p>
          <ul className="text-xs text-slate-700 space-y-2 list-disc pl-4">
            <li><strong>La regla de la +1 capa:</strong> El bebé debe tener solo UNA capa de ropa más de la que tú llevas puesta para sentirte cómodo.</li>
            <li><strong>El termómetro real no son las manos:</strong> Es normal que tengan manos y pies fríos. Para saber si tienen frío o calor, tócales la nuca o el pecho. Si suda ahí, quítale ropa.</li>
            <li><strong>Gorritos:</strong> Usa gorrito solo los primeros días o si salen al frío real, pero no para dormir en casa (riesgo de sobrecalentamiento).</li>
          </ul>
        </div>

        {/* Visitas */}
        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm hover:shadow-md transition-shadow md:col-span-2">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-black text-slate-900 mb-2">Manual para Visitas (Y cómo poner límites)</h3>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">
            El instinto de protección es real. Las abuelas sabían que los primeros días son sagrados para el núcleo familiar.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl">
              <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-1"><HeartHandshake className="w-4 h-4 text-emerald-500" /> Reglas de Oro</h4>
              <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-4">
                <li><strong>Prohibido besar:</strong> NINGUNA visita debe besar al bebé cerca del rostro o las manos (peligro de herpes y virus respiratorios).</li>
                <li><strong>Lavado de manos:</strong> Exígelo como peaje de entrada. Sin ofenderse.</li>
                <li><strong>Si estás enfermo, no vengas:</strong> Ni siquiera con "es solo una alergia".</li>
              </ul>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl">
              <h4 className="font-bold text-slate-800 text-sm mb-2">Visitas Útiles vs. Molestas</h4>
              <p className="text-xs text-slate-700 mb-2">Una buena visita no viene a cargar al bebé para que tú atiendas; viene a traerte comida, lavar platos o dejarte dormir.</p>
              <p className="text-xs text-slate-500 italic">"Las visitas cortas (máximo 45 min) y avisadas con tiempo son las que conservan la amistad."</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
