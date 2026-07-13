const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const oldImageRender = `                      {topic.image && (
                        <div className="absolute top-0 right-0 w-24 h-24 opacity-10 pointer-events-none -mr-4 -mt-4">
                           <img src={topic.image} alt={topic.room} className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                        </div>
                      )}
                      <div className="space-y-3 relative z-10">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            {topic.image && (
                              <img src={topic.image} alt="" className="w-6 h-6 rounded-full object-cover shadow-sm" referrerPolicy="no-referrer" />
                            )}
                            <span className="text-xs font-black text-blue-500 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                              {topic.room}
                            </span>`;

const newImageRender = `                      {topic.selectedIcon && AMAPOLA_ICONS[topic.selectedIcon] ? (
                        <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.03] pointer-events-none -mr-6 -mt-6">
                           {(() => {
                             const BigIcon = AMAPOLA_ICONS[topic.selectedIcon].icon;
                             return <BigIcon className="w-full h-full text-slate-900" />;
                           })()}
                        </div>
                      ) : topic.image && (
                        <div className="absolute top-0 right-0 w-24 h-24 opacity-10 pointer-events-none -mr-4 -mt-4">
                           <img src={topic.image} alt={topic.room} className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                        </div>
                      )}
                      
                      <button 
                        onClick={(e) => { e.stopPropagation(); setIconModalOpenId(topic.id); }}
                        className={\`absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 \${isNightMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white' : 'bg-white text-slate-400 hover:bg-slate-100 hover:text-slate-700 shadow-sm border border-slate-100'}\`}
                        title="Cambiar icono ilustrado"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <div className="space-y-3 relative z-10">
                        <div className="flex items-center justify-between mt-1">
                          <span className="flex items-center gap-2">
                            {topic.selectedIcon && AMAPOLA_ICONS[topic.selectedIcon] ? (
                               (() => {
                                 const SmallIcon = AMAPOLA_ICONS[topic.selectedIcon].icon;
                                 const color = AMAPOLA_ICONS[topic.selectedIcon].color;
                                 const bg = AMAPOLA_ICONS[topic.selectedIcon].bgColor;
                                 return (
                                   <div className={\`w-7 h-7 rounded-full flex items-center justify-center \${bg} shadow-sm border border-white\`}>
                                     <SmallIcon className={\`w-3.5 h-3.5 \${color}\`} />
                                   </div>
                                 );
                               })()
                            ) : topic.image && (
                              <img src={topic.image} alt="" className="w-7 h-7 rounded-full object-cover shadow-sm" referrerPolicy="no-referrer" />
                            )}
                            <span className="text-xs font-black text-blue-500 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                              {topic.room}
                            </span>`;

code = code.replace(oldImageRender, newImageRender);

// Also need to add "group" to className of the card so `group-hover:opacity-100` works
code = code.replace(/className={\`rounded-3xl p-5 shadow-sm space-y-4 text-left flex flex-col justify-between h-full overflow-hidden relative transition-all duration-300 hover:scale-\[1.02\] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 \${isNightMode \? 'bg-slate-900 border border-slate-800' : isAccessibilityMode \? 'bg-white border-\[3px\] border-black' : 'bg-white border-0 shadow-\[0_8px_30px_rgb\\(0,0,0,0.04\\)\]'}\`}/g, 
`className={\`group rounded-3xl p-5 shadow-sm space-y-4 text-left flex flex-col justify-between h-full overflow-hidden relative transition-all duration-300 hover:scale-[1.02] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 \${isNightMode ? 'bg-slate-900 border border-slate-800' : isAccessibilityMode ? 'bg-white border-[3px] border-black' : 'bg-white border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}\`}`);

fs.writeFileSync('src/App.tsx', code);
