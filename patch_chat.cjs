const fs = require('fs');
let code = fs.readFileSync('src/components/FirstAidChat.tsx', 'utf-8');

// Imports
code = code.replace('Send, User', 'Send, User, Mic');

// State
const stateRegex = /const \[input, setInput\] = useState\(""\);/;
const newState = `const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechLib = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechLib) {
      alert("Tu navegador no soporta el dictado por voz. Por favor, escribe tu mensaje.");
      return;
    }

    try {
      const recognition = new SpeechLib();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'es-ES';
      
      let finalTranscript = '';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setInput(prev => {
          const base = prev.replace(interimTranscript, '');
          return base + finalTranscript + interimTranscript;
        });
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };`;
code = code.replace(stateRegex, newState);

// Input Form
const inputRegex = /<input[\s\S]*?\/>/;
const newInput = `<input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isListening ? "Escuchando..." : "Escribe tu consulta o usa el micrófono..."}
          className={\`flex-1 px-3.5 py-2.5 bg-slate-50 border \${isListening ? 'border-rose-500 ring-2 ring-rose-200' : 'border-slate-200 focus:border-slate-900'} rounded-xl text-xs font-semibold focus:outline-none transition-all placeholder:text-slate-400\`}
        />`;
code = code.replace(inputRegex, newInput);

const btnRegex = /<button[\s\S]*?className="p-2\.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-45 text-white rounded-xl transition-all flex items-center justify-center shrink-0 cursor-pointer"[\s\S]*?>[\s\S]*?<Send className="w-4 h-4" \/>[\s\S]*?<\/button>/;

const newBtn = `<button
          type="button"
          onClick={toggleListen}
          className={\`p-2.5 rounded-xl transition-all flex items-center justify-center shrink-0 cursor-pointer \${isListening ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}\`}
          title="Dictar por voz"
        >
          <Mic className="w-4 h-4" />
        </button>
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="p-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-45 text-white rounded-xl transition-all flex items-center justify-center shrink-0 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>`;
code = code.replace(btnRegex, newBtn);

fs.writeFileSync('src/components/FirstAidChat.tsx', code);
