const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const wrongContent = `                                    {activeTab === 'wellbeing' && (
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
          )}`;

// Let's use a simpler regex to remove the blocks
const cleanWellbeing = /{activeTab === 'wellbeing' && \([\s\S]*?<MaternalWellbeing \/>\n\s*<\/motion\.div>\n\s*\)}/g;
const cleanTips = /{activeTab === 'tips' && \([\s\S]*?<GrandmaTips \/>\n\s*<\/motion\.div>\n\s*\)}/g;

// Now let's remove ALL of them!
code = code.replace(cleanWellbeing, '');
code = code.replace(cleanTips, '');

fs.writeFileSync('src/App.tsx', code);
