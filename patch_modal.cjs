const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const iconModalCode = `
      {/* Icon Management Modal */}
      <AnimatePresence>
        {iconModalOpenId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIconModalOpenId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className={\`rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6 relative \${isNightMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'}\`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={\`text-lg font-black \${isNightMode ? 'text-white' : 'text-slate-900'}\`}>Asignar Icono</h3>
                  <p className="text-xs text-slate-500 font-medium">Personaliza la identidad visual de la habitación</p>
                </div>
                <button
                  onClick={() => setIconModalOpenId(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  <Plus className="w-4 h-4 rotate-45" />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {Object.entries(AMAPOLA_ICONS).map(([key, config]) => {
                  const IconComp = config.icon;
                  const isSelected = preventionTopics.find(t => t.id === iconModalOpenId)?.selectedIcon === key;
                  
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        setPreventionTopics(prev => prev.map(t => 
                          t.id === iconModalOpenId ? { ...t, selectedIcon: key } : t
                        ));
                        setIconModalOpenId(null);
                      }}
                      className={\`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all \${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : isNightMode 
                            ? 'border-slate-800 hover:border-slate-700 bg-slate-800/50' 
                            : 'border-slate-100 hover:border-blue-100 bg-white'
                      }\`}
                    >
                      <div className={\`w-10 h-10 rounded-full flex items-center justify-center mb-2 \${config.bgColor}\`}>
                        <IconComp className={\`w-5 h-5 \${config.color}\`} />
                      </div>
                      <span className={\`text-[9px] font-bold uppercase tracking-wider \${isNightMode ? 'text-slate-400' : 'text-slate-500'}\`}>
                        {config.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
`;

code = code.replace(/<AnimatePresence>\s*{hazardDetailModalData\.isOpen && hazardDetailModalData\.hazard/m, iconModalCode + '\n      <AnimatePresence>\n        {hazardDetailModalData.isOpen && hazardDetailModalData.hazard');

fs.writeFileSync('src/App.tsx', code);
