const fs = require('fs');

let app = fs.readFileSync('src/App.tsx', 'utf-8');
app = app.replace('Image, LayoutGrid', '');
app = app.replace('Image,  LayoutGrid', ''); // handle spacing just in case
app = app.replace(', Image, LayoutGrid', '');
fs.writeFileSync('src/App.tsx', app);

let em = fs.readFileSync('src/components/EmergencyPanel.tsx', 'utf-8');
em = em.replace(/HeartPulse, /g, '');
fs.writeFileSync('src/components/EmergencyPanel.tsx', em);

let hf = fs.readFileSync('src/components/HospitalFinder.tsx', 'utf-8');
hf = hf.replace(/import React from 'react';\n/g, '');
hf = hf.replace(/  const isNightMode = false;\n/g, '');
fs.writeFileSync('src/components/HospitalFinder.tsx', hf);

