const fs = require('fs');
let code = fs.readFileSync('src/components/EmergencyPanel.tsx', 'utf-8');

if (!code.includes('HeartPulse')) {
  code = code.replace(/Heart,/g, 'Heart, HeartPulse,');
  fs.writeFileSync('src/components/EmergencyPanel.tsx', code);
}
