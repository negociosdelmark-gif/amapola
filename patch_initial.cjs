const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(/id: '1',\n    room: 'Cocina',/g, "id: '1',\n    room: 'Cocina',\n    selectedIcon: 'Utensils',");
code = code.replace(/id: '2',\n    room: 'Baño',/g, "id: '2',\n    room: 'Baño',\n    selectedIcon: 'Bath',");
code = code.replace(/id: '3',\n    room: 'Sala y Dormitorio',/g, "id: '3',\n    room: 'Sala y Dormitorio',\n    selectedIcon: 'Sofa',");

fs.writeFileSync('src/App.tsx', code);
