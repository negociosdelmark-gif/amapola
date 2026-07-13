const fs = require('fs');
let code = fs.readFileSync('src/components/EmergencyPanel.tsx', 'utf-8');

const oldVoicePanel = `          {/* Hands-Free Voice Controller panel */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 space-y-4 flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic className={\`w-4 h-4 \${isListening ? 'text-rose-500 animate-pulse' : 'text-slate-400'}\`} />
                <h5 className="text-sm font-black uppercase tracking-widest text-slate-300">Control por Voz Manos Libres</h5>
              </div>
              <span className={\`px-2 py-0.5 rounded text-xs font-bold \${isListening ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}\`}>
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
              className={\`w-full py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer \${
                isListening 
                  ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }\`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4" /> Detener Escucha
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" /> Activar Control Manos Libres
                </>
              )}
            </button>
          </div>`;

const newVoicePanel = `          {/* Informative Panel - Replacing Voice Control for Simplicity */}
          <div className="bg-blue-50 text-slate-900 rounded-2xl p-5 border border-blue-100 space-y-4 flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-blue-500" />
                <h5 className="text-sm font-black uppercase tracking-widest text-blue-900">Actuar con Calma</h5>
              </div>
            </div>

            <p className="text-sm text-blue-800 leading-relaxed font-medium">
              En una emergencia, el pánico es el principal enemigo. Lee las instrucciones de la guía paso a paso y asegúrate de pedir a alguien más que llame al <strong>123</strong> mientras actúas.
            </p>
            
            <div className="p-3 bg-white rounded-xl border border-blue-100">
              <p className="text-xs text-slate-600 font-semibold mb-1">Tu rol principal es:</p>
              <ul className="text-xs text-slate-500 space-y-1 list-disc pl-4">
                <li>Garantizar que el entorno sea seguro.</li>
                <li>Activar el sistema de emergencias médicas.</li>
                <li>Brindar soporte vital básico (RCP) si es necesario.</li>
              </ul>
            </div>
          </div>`;

code = code.replace(oldVoicePanel, newVoicePanel);
fs.writeFileSync('src/components/EmergencyPanel.tsx', code);
