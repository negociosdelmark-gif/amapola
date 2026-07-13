const fs = require('fs');
let code = fs.readFileSync('src/components/VaccineTracker.tsx', 'utf-8');
code = code.replace("Award }", "Award, CalendarPlus }");
fs.writeFileSync('src/components/VaccineTracker.tsx', code);
