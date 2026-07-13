const fs = require('fs');
let code = fs.readFileSync('src/components/VaccineTracker.tsx', 'utf-8');

const regex = /\{isCompleted \? \([\s\S]*?\} \: \([\s\S]*?Registrar Aplicación\n\s*<\/button>\n\s*\)\}/;
const match = regex.exec(code);

if (match) {
  const newCode = `{isCompleted ? (
                    <button
                      onClick={() => handleResetStatus(vac.id)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold rounded-lg text-xs transition-all cursor-pointer"
                    >
                      Restablecer
                    </button>
                  ) : (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleMarkComplete(vac)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-xs shadow-sm cursor-pointer transition-all"
                      >
                        Registrar Aplicación
                      </button>
                      <button
                        onClick={() => downloadVaccineReminder(vac.name, vac.ageMonths)}
                        className="p-1.5 bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-600 border border-slate-200 hover:border-blue-300 rounded-lg shadow-sm cursor-pointer transition-all"
                        title="Agendar recordatorio en calendario (.ics)"
                      >
                        <CalendarPlus className="w-4 h-4" />
                      </button>
                    </div>
                  )}`;
  code = code.replace(match[0], newCode);
  fs.writeFileSync('src/components/VaccineTracker.tsx', code);
}
