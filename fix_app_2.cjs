const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf-8');

const strToFind = `                                    {activeTab === 'wellbeing' && (
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

code = code.replace(strToFind, '');
fs.writeFileSync('src/App.tsx', code);
