const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Hide header and tabs during print
code = code.replace('<nav className="border-b', '<nav className="border-b no-print');
code = code.replace('<div className="p-2 border-b border-slate-200', '<div className="no-print p-2 border-b border-slate-200');

// Hide Emergency Header in print (we want to print just the content, actually wait)
// Actually we only want to print VaccineTracker right now, let's leave it simple.

fs.writeFileSync('src/App.tsx', code);
