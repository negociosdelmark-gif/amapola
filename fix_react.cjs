const fs = require('fs');
let code = fs.readFileSync('src/components/VaccineTracker.tsx', 'utf-8');
code = "import { useState, useEffect } from 'react';\n" + code;
fs.writeFileSync('src/components/VaccineTracker.tsx', code);
