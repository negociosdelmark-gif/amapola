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
          )}
          </AnimatePresence>`;

// Remove from the wrong place
code = code.replace(wrongContent, `                          </AnimatePresence>`);

// Insert in the correct place, after the end of activeTab === 'prevention'
const endOfPrevention = `            </motion.div>
          )}
        </AnimatePresence>
      </main>`; // wait, let's find the closing of prevention.

fs.writeFileSync('src/App.tsx', code);
