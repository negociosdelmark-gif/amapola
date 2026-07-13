const fs = require('fs');

// Fix TabType
let typesCode = fs.readFileSync('src/types.ts', 'utf-8');
typesCode = typesCode.replace("export type TabType = 'emergency' | 'vaccines' | 'prevention' | 'reports';", "export type TabType = 'emergency' | 'vaccines' | 'prevention' | 'reports' | 'wellbeing' | 'tips';");
fs.writeFileSync('src/types.ts', typesCode);

// Fix unused imports
let tipsCode = fs.readFileSync('src/components/GrandmaTips.tsx', 'utf-8');
tipsCode = tipsCode.replace("import { useState } from 'react';\n", "");
fs.writeFileSync('src/components/GrandmaTips.tsx', tipsCode);

let momCode = fs.readFileSync('src/components/MaternalWellbeing.tsx', 'utf-8');
momCode = momCode.replace("Baby, ", "");
fs.writeFileSync('src/components/MaternalWellbeing.tsx', momCode);
