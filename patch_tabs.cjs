const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Imports
code = code.replace("import VaccineTracker from './components/VaccineTracker';", "import VaccineTracker from './components/VaccineTracker';\nimport MaternalWellbeing from './components/MaternalWellbeing';\nimport GrandmaTips from './components/GrandmaTips';");
// Tab buttons
const tabsRegex = /<button[\s\S]*?onClick=\{\(\) => setActiveTab\('prevention'\)\}[\s\S]*?<\/button>/;
const match = tabsRegex.exec(code);
if (match) {
  const newTabs = match[0] + `
            <button
              onClick={() => setActiveTab('wellbeing')}
              className={\`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 \${
                activeTab === 'wellbeing'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }\`}
            >
              <Heart className="w-3.5 h-3.5 text-purple-500" />
              <span className="hidden md:inline">Mamá</span>
            </button>
            <button
              onClick={() => setActiveTab('tips')}
              className={\`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 \${
                activeTab === 'tips'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }\`}
            >
              <Star className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden md:inline">Abuela</span>
            </button>`;
  code = code.replace(match[0], newTabs);
}

// Tab Content
const contentRegex = /activeTab === 'prevention' && \([\s\S]*?\}\)[\s\S]*?<\/div>\n[\s\S]*?\n[\s\S]*?<\/AnimatePresence>/;
const match2 = contentRegex.exec(code);
if (match2) {
  // We need to insert the new tab content just before the end of AnimatePresence
  const lastIndex = match2[0].lastIndexOf('</AnimatePresence>');
  const newContent = match2[0].substring(0, lastIndex) + `
          {activeTab === 'wellbeing' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <MaternalWellbeing />
            </motion.div>
          )}

          {activeTab === 'tips' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <GrandmaTips />
            </motion.div>
          )}
          </AnimatePresence>`;
  code = code.replace(match2[0], newContent);
}

fs.writeFileSync('src/App.tsx', code);
