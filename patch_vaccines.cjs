const fs = require('fs');
let code = fs.readFileSync('src/components/VaccineTracker.tsx', 'utf-8');

// Add CalendarPlus icon import
code = code.replace("Calendar, CheckCircle", "Calendar, CheckCircle, CalendarPlus");

// Find the mapping where each vaccine is rendered, usually 'vaccines.map'
const renderRegex = /<h3 className="font-bold text-slate-800 text-sm">\{vaccine\.name\}<\/h3>/;
const match = renderRegex.exec(code);
if (match) {
  // Let's add a button to download ICS for pending vaccines
  const downloadIcsFunction = `
  const downloadVaccineReminder = (vaccineName: string, months: number) => {
    // Generates a simple .ics file for today + 7 days as an example,
    // or calculate based on birthdate
    let d = new Date();
    d.setDate(d.getDate() + 7); // Remind in a week by default
    
    // If we have birthdate and months > 0, we can calculate approximate date
    if (childBirthdate) {
        const bdate = new Date(childBirthdate);
        bdate.setMonth(bdate.getMonth() + months);
        if (bdate > new Date()) {
            d = bdate;
        }
    }
    
    const formattedDate = d.toISOString().replace(/-|:|\.\\d+/g, '');
    const endDate = new Date(d.getTime() + 60 * 60 * 1000).toISOString().replace(/-|:|\.\\d+/g, '');
    
    const icsContent = \`BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:\${formattedDate}
DTEND:\${endDate}
SUMMARY:Vacuna: \${vaccineName}
DESCRIPTION:Recordatorio para aplicar la vacuna \${vaccineName} a \${childName}
END:VEVENT
END:VCALENDAR\`;
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', \`vacuna-\${vaccineName.toLowerCase().replace(/\\s+/g, '-')}.ics\`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    logAnalyticsEvent('download_vaccine_ics', { vaccineName });
  };
  `;
  
  // Insert function before return
  const returnIndex = code.indexOf('return (');
  code = code.slice(0, returnIndex) + downloadIcsFunction + code.slice(returnIndex);
  
  // Add button to UI
  const itemStatusRegex = /\{vaccine\.status === 'PENDING' && \([\s\S]*?<\/button>\n\s*\)}/;
  const itemMatch = itemStatusRegex.exec(code);
  if (itemMatch) {
    const newButton = `
                  <button
                    onClick={() => downloadVaccineReminder(vaccine.name, vaccine.ageMonths)}
                    className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                    title="Añadir a Calendario"
                  >
                    <CalendarPlus className="w-4 h-4" />
                  </button>
    `;
    const replaceStr = itemMatch[0].replace('</div>', newButton + '</div>');
    // But itemMatch doesn't have </div>, it's just the button
    code = code.replace(itemMatch[0], itemMatch[0] + `
                  {vaccine.status === 'PENDING' && (
                    <button
                      onClick={() => downloadVaccineReminder(vaccine.name, vaccine.ageMonths)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-colors flex items-center gap-1.5 text-xs font-bold bg-white"
                      title="Descargar Recordatorio de Calendario"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Recordatorio</span>
                    </button>
                  )}`);
  }
}

fs.writeFileSync('src/components/VaccineTracker.tsx', code);
