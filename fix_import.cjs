const fs = require('fs');
let code = fs.readFileSync('src/components/VaccineTracker.tsx', 'utf-8');
code = code.replace(/import \{[\s\S]*?\} from 'lucide-react';/, "import { Calendar, CheckCircle, Clock, Search, Printer, ShieldAlert, CheckCircle2, Award } from 'lucide-react';");
fs.writeFileSync('src/components/VaccineTracker.tsx', code);
