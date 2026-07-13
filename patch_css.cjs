const fs = require('fs');
let code = fs.readFileSync('src/index.css', 'utf-8');

if (!code.includes('@media print')) {
  code += `\n
@media print {
  .no-print {
    display: none !important;
  }
  .print-only {
    display: block !important;
  }
  body {
    background: white;
  }
  .print-container {
    padding: 0 !important;
    margin: 0 !important;
    max-width: 100% !important;
    box-shadow: none !important;
    border: none !important;
  }
}
`;
  fs.writeFileSync('src/index.css', code);
}
