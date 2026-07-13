const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Hide sidebar in print
code = code.replace('<aside className="hidden lg:flex lg:col-span-3 flex-col bg-white border-r border-slate-200 h-screen sticky top-0 overflow-hidden shadow-sm">', '<aside className="hidden lg:flex lg:col-span-3 flex-col bg-white border-r border-slate-200 h-screen sticky top-0 overflow-hidden shadow-sm no-print">');

// Hide tab navigation in print
code = code.replace('<div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">', '<div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl no-print">');

fs.writeFileSync('src/App.tsx', code);
