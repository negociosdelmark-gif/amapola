const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Redesign Header
code = code.replace(/<header className="sticky top-0 z-40 bg-white\/95 backdrop-blur-sm border-b border-slate-100\/80 transition-all">[\s\S]*?(?=<\/header>)/m, 
`<header className="sticky top-0 z-40 bg-slate-900 text-white shadow-xl transition-all border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-4 md:py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center text-white shadow-lg shadow-rose-900/50">
              <Heart className="w-6 h-6 fill-white" />
            </div>
            <div>
              <span className="text-lg md:text-xl font-black tracking-tight block text-white">Amapola Alerta</span>
              <span className="text-xs text-rose-300 font-bold tracking-widest uppercase block">Asistente Pediátrico</span>
            </div>
          </div>
          
          <div className="flex bg-slate-800 p-1.5 rounded-2xl shadow-inner gap-1">
            <button
              onClick={() => setActiveTab('emergency')}
              className={\`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 \${
                activeTab === 'emergency'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }\`}
            >
              <Heart className="w-4 h-4 fill-current" />
              <span className="hidden sm:inline">Urgencias</span>
            </button>
            <button
              onClick={() => setActiveTab('vaccines')}
              className={\`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 \${
                activeTab === 'vaccines'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }\`}
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Vacunas</span>
            </button>
            <button
              onClick={() => setActiveTab('prevention')}
              className={\`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 \${
                activeTab === 'prevention'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }\`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Prevención</span>
            </button>
          </div>
        </div>`);

// 2. Reduce dense text in prevention
code = code.replace(/text-xs text-slate-500 font-semibold/g, "text-sm text-slate-500 leading-relaxed font-medium");
code = code.replace(/text-xs text-slate-600 leading-relaxed font-semibold/g, "text-sm text-slate-600 leading-relaxed font-medium");
code = code.replace(/text-\[10px\]/g, "text-sm");
code = code.replace(/text-\[9px\]/g, "text-xs");

// 3. Make cards more spacious
code = code.replace(/p-5 md:p-6/g, "p-6 md:p-8");
code = code.replace(/bg-white border border-slate-100/g, "bg-white border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)]");

fs.writeFileSync('src/App.tsx', code);
