const fs = require('fs');

for (const file of ['src/components/VaccineTracker.tsx', 'src/components/EmergencyPanel.tsx']) {
  let code = fs.readFileSync(file, 'utf-8');

  // Make cards more spacious and modern
  code = code.replace(/p-5 md:p-6/g, "p-6 md:p-8");
  code = code.replace(/p-4/g, "p-6");
  code = code.replace(/bg-white border border-slate-100/g, "bg-white border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)]");
  
  // Replace dense tiny fonts
  code = code.replace(/text-xs text-slate-500/g, "text-sm text-slate-500 leading-relaxed");
  code = code.replace(/text-xs text-slate-600/g, "text-sm text-slate-600 leading-relaxed");

  fs.writeFileSync(file, code);
}
