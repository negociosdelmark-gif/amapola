const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const find1 = `            <button
              onClick={() => setActiveTab('emergency')}
              className={\`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 \${
                activeTab === 'emergency'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }\`}
            >`;
const replace1 = `            <button
              onClick={() => setActiveTab('emergency')}
              className={\`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 \${
                activeTab === 'emergency'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }\`}
            >`;

const find2 = `            <button
              onClick={() => setActiveTab('vaccines')}
              className={\`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 \${
                activeTab === 'vaccines'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }\`}
            >`;
const replace2 = `            <button
              onClick={() => setActiveTab('vaccines')}
              className={\`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 \${
                activeTab === 'vaccines'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }\`}
            >`;

const find3 = `            <button
              onClick={() => setActiveTab('prevention')}
              className={\`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 \${
                activeTab === 'prevention'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }\`}
            >`;
const replace3 = `            <button
              onClick={() => setActiveTab('prevention')}
              className={\`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 \${
                activeTab === 'prevention'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }\`}
            >`;

code = code.replace(find1, replace1).replace(find2, replace2).replace(find3, replace3);
fs.writeFileSync('src/App.tsx', code);
