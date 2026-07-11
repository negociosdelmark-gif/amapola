import React, { useState } from 'react';
import { Star, Check, Sparkles, CreditCard, Lock, RefreshCw, CheckCircle2, ShieldCheck, HelpCircle } from 'lucide-react';

interface PremiumSimulationProps {
  isPremium: boolean;
  onActivatePremium: () => void;
}

export default function PremiumSimulation({ isPremium, onActivatePremium }: PremiumSimulationProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'idle' | 'processing' | 'success'>('idle');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentStep('processing');
    
    // Simulate payment authorization delay
    setTimeout(() => {
      setPaymentStep('success');
      onActivatePremium();
    }, 2000);
  };

  const planPrice = selectedPlan === 'monthly' ? '$4.99' : '$39.99';
  const planPeriod = selectedPlan === 'monthly' ? '/mes' : '/año';

  return (
    <div id="premium-simulation" className="space-y-8 max-w-4xl mx-auto">
      {/* Upper overview header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
          <Star className="w-3.5 h-3.5 fill-current animate-spin" /> Suscripción Premium Amapola
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          La máxima protección para lo que más quieres
        </h2>
        <p className="text-slate-500 text-xs md:text-sm max-w-xl mx-auto leading-relaxed">
          Haz el upgrade hoy para desbloquear el historial completo de tus hijos, evaluaciones ilimitadas asistidas por IA y síntesis de voz premium paso a paso.
        </p>
      </div>

      {isPremium ? (
        /* Active Premium member banner card */
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-500 rounded-3xl p-6 md:p-8 text-center space-y-4 shadow-sm max-w-xl mx-auto">
          <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-xl font-black text-slate-900">¡Ya eres Miembro Premium!</h3>
            <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
              Tu suscripción se encuentra activa. Disfrutas de consultas ilimitadas con nuestra IA, almacenamiento ilimitado de perfiles e instrucciones de voz en emergencias.
            </p>
          </div>
          <div className="text-xs bg-emerald-200 text-emerald-800 px-3 py-1 rounded-full font-bold inline-block uppercase tracking-wide">
            Suscripción Anual Activa (Renovación automática)
          </div>
        </div>
      ) : (
        /* Pricing & comparison options */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Plan Choice Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 flex flex-col justify-between space-y-6 shadow-sm">
            <div className="space-y-4">
              <div className="font-extrabold text-slate-400 text-xs uppercase tracking-wide">Elige tu Plan</div>
              
              {/* Plan Switcher */}
              <div className="flex border border-slate-200 rounded-xl p-1 bg-slate-50 gap-1 text-xs">
                <button
                  onClick={() => setSelectedPlan('monthly')}
                  className={`flex-1 py-2 text-center rounded-lg font-bold transition-all ${
                    selectedPlan === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Mensual
                </button>
                <button
                  onClick={() => setSelectedPlan('yearly')}
                  className={`flex-1 py-2 text-center rounded-lg font-bold transition-all flex items-center justify-center gap-1 ${
                    selectedPlan === 'yearly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Anual <span className="bg-emerald-100 text-emerald-800 text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase">Ahorra 50%</span>
                </button>
              </div>

              {/* Cost indicator */}
              <div className="pt-2 flex items-baseline gap-2">
                <span className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">{planPrice}</span>
                <span className="text-slate-500 font-medium text-sm">{planPeriod}</span>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                {selectedPlan === 'monthly' 
                  ? "Suscripción sin plazos forzosos. Cancela en cualquier momento de forma digital desde tu panel."
                  : "Facturado anualmente ($39.99). Obtienes un ahorro equivalente a más de 4 meses de suscripción mensual."}
              </p>
            </div>

            {/* CTA action button */}
            <button
              onClick={() => setShowCheckout(true)}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-sm hover:shadow transition-all text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2"
            >
              Comenzar Suscripción <Sparkles className="w-4 h-4 fill-current text-amber-300" />
            </button>
          </div>

          {/* Features check table */}
          <div className="bg-slate-50 border border-slate-200/60 rounded-3xl p-6 md:p-8 space-y-6">
            <div className="font-extrabold text-slate-400 text-xs uppercase tracking-wide">Comparación de Características</div>
            
            <div className="space-y-4">
              {/* Row 1 */}
              <div className="flex gap-3 items-start pb-3 border-b border-slate-200/50">
                <div className="w-5 h-5 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs">
                  <h4 className="font-bold text-slate-900">Consultas de IA de urgencia</h4>
                  <p className="text-slate-500 text-[11px] leading-normal">
                    Límitada a 3 en el nivel gratis vs **Ilimitadas** en premium. Sin límites en momentos críticos.
                  </p>
                </div>
              </div>

              {/* Row 2 */}
              <div className="flex gap-3 items-start pb-3 border-b border-slate-200/50">
                <div className="w-5 h-5 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs">
                  <h4 className="font-bold text-slate-900">Historial Médico Pediátrico</h4>
                  <p className="text-slate-500 text-[11px] leading-normal">
                    Expediente completo para cada uno de tus hijos con almacenamiento de síntomas e hitos de vacunación.
                  </p>
                </div>
              </div>

              {/* Row 3 */}
              <div className="flex gap-3 items-start pb-3 border-b border-slate-200/50">
                <div className="w-5 h-5 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs">
                  <h4 className="font-bold text-slate-900">Instrucciones de Voz (TTS) y Diagramas</h4>
                  <p className="text-slate-500 text-[11px] leading-normal">
                    Lecturas por voz pausadas y guías ilustrativas generadas al momento para actuar con manos libres.
                  </p>
                </div>
              </div>

              {/* Row 4 */}
              <div className="flex gap-3 items-start">
                <div className="w-5 h-5 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs">
                  <h4 className="font-bold text-slate-900">Modo de Emergencias sin Conexión</h4>
                  <p className="text-slate-500 text-[11px] leading-normal">
                    Descarga del manual de primeros auxilios y guías de RCP para acceso instantáneo aún sin cobertura de red.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal Simulator Overlay */}
      {showCheckout && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-slate-200 shadow-2xl relative animate-scaleIn">
            
            {paymentStep === 'idle' && (
              <form onSubmit={handleSubscribe} className="space-y-4">
                <div className="text-center space-y-1 pb-2 border-b border-slate-100">
                  <h3 className="font-extrabold text-slate-900 text-base">Pasarela de Pago Simulada</h3>
                  <p className="text-[11px] text-slate-500">Completa tus datos simulados para activar la suscripción Premium.</p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Nombre del Titular</label>
                    <input
                      type="text"
                      required
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="ej. Dr. Mark"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Número de Tarjeta de Crédito</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        maxLength={16}
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="4111 2222 3333 4444"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600">Vencimiento</label>
                      <input
                        type="text"
                        required
                        maxLength={5}
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        placeholder="MM/AA"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600">CVV</label>
                      <input
                        type="password"
                        required
                        maxLength={3}
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                        placeholder="***"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex gap-2.5 text-[10px] text-slate-500 leading-normal">
                  <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Transacción Simulada Segura:</strong> No se realizarán cargos monetarios reales. Se trata de un simulador funcional para evaluar flujos premium de la aplicación.
                  </span>
                </div>

                <div className="flex gap-2 text-xs font-bold pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCheckout(false)}
                    className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 text-center transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-center transition-all uppercase tracking-wide"
                  >
                    Autorizar Pago ({planPrice})
                  </button>
                </div>
              </form>
            )}

            {paymentStep === 'processing' && (
              <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
                <RefreshCw className="w-12 h-12 text-emerald-600 animate-spin" />
                <h3 className="font-extrabold text-slate-900 text-sm">Procesando Pago Seguro...</h3>
                <p className="text-xs text-slate-500 max-w-xs leading-normal">Estamos autorizando el token de suscripción de primeros auxilios con tu entidad financiera virtual.</p>
              </div>
            )}

            {paymentStep === 'success' && (
              <div className="py-10 flex flex-col items-center justify-center space-y-5 text-center">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-black text-slate-900 text-lg">Suscripción Premium Activada</h3>
                  <p className="text-xs text-slate-500 max-w-xs leading-relaxed">¡Felicitaciones! Has activado correctamente el plan Premium de <strong>Amapola - Guía Pediátrica</strong>.</p>
                </div>
                <button
                  onClick={() => {
                    setShowCheckout(false);
                    setPaymentStep('idle');
                  }}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs uppercase"
                >
                  Regresar a la Aplicación
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
