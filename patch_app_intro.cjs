const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const oldText = `<p className="text-xs text-blue-100 leading-relaxed">
                        El 90% de los accidentes domésticos infantiles son evitables. Completa la lista de verificación para eliminar peligros potenciales en tu cocina, baño y sala de estar.
                      </p>`;

const newText = `<div className="space-y-3 mt-4">
                        <p className="text-sm md:text-base text-white leading-relaxed font-semibold">
                          👋 <strong>¿Para qué sirve esta sección?</strong> Aquí puedes realizar una auditoría de seguridad de tu hogar. 
                        </p>
                        <p className="text-xs md:text-sm text-blue-100 leading-relaxed bg-blue-900/50 p-3 rounded-xl border border-blue-500/30">
                          <strong>Cómo usarla:</strong> Desplázate hacia abajo y selecciona las diferentes habitaciones (Cocina, Baño, Sala). Lee las sugerencias de seguridad y marca la casilla cuando hayas asegurado ese elemento en la vida real. Tu progreso se guardará automáticamente y verás cómo tu hogar se vuelve más seguro.
                        </p>
                      </div>`;

code = code.replace(oldText, newText);
fs.writeFileSync('src/App.tsx', code);
