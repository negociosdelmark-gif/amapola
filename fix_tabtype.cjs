const fs = require('fs');

let appCode = fs.readFileSync('src/App.tsx', 'utf-8');
appCode = appCode.replace(
  "type TabType = 'emergency' | 'vaccines' | 'prevention';", 
  "type TabType = 'emergency' | 'vaccines' | 'prevention' | 'wellbeing' | 'tips';"
);
fs.writeFileSync('src/App.tsx', appCode);

let vacCode = fs.readFileSync('src/components/VaccineTracker.tsx', 'utf-8');
// Fix unused CalendarPlus error. Wait, if it said it's unused, that means the itemMatch regex didn't replace correctly!
// Let's check how the button was inserted.
const btnCheck = vacCode.includes('<CalendarPlus');
if (btnCheck) {
  // It is used, maybe there's a duplicate import or something?
  // Error was: "src/components/VaccineTracker.tsx(3,26): error TS6133: 'CalendarPlus' is declared but its value is never read."
  // I'll just check if it's there.
} else {
  console.log("CalendarPlus not found in JSX!");
}
