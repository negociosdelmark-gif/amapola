
import { useState, useEffect, useRef } from "react";
import { Send, User, Sparkles, AlertCircle, ExternalLink, HelpCircle, ArrowRight, Mic } from "lucide-react";
import Markdown from "react-markdown";
import { logAnalyticsEvent } from "../lib/firebase";

// Mascot component...
const AmapolaMascot = ({ className = "w-6 h-6" }: { className?: string }) => (
  <div className={`relative flex items-center justify-center ${className}`}>
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
      <defs>
        <radialGradient id="faceGrad" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="45" fill="url(#faceGrad)" stroke="#334155" strokeWidth="2.5" />
      <path
        d="M20 50 Q50 10 80 50"
        fill="none"
        stroke="#F43F5E"
        strokeWidth="6"
        strokeLinecap="round"
        className="animate-pulse"
      />
      <circle cx="35" cy="45" r="4" fill="#334155" />
      <circle cx="65" cy="45" r="4" fill="#334155" />
      <path
        d="M40 60 Q50 70 60 60"
        fill="none"
        stroke="#334155"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M30 35 L40 25"
        stroke="#F43F5E"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M70 35 L60 25"
        stroke="#F43F5E"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M48 28 L52 28"
        stroke="#F43F5E"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  </div>
);

type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: { title: string; uri: string }[];
};

export default function FirstAidChat() {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('amapola_chat_history');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return [
      {
        role: "assistant",
        content: "¡Hola! Soy **Amapola Alerta 🌸**, tu asistente inteligente en primeros auxilios pediátricos.\n\nEstoy aquí para guiarte de forma segura paso a paso. ¿Tienes alguna pregunta o necesitas saber qué hacer ante un accidente o síntoma? Por favor, dime qué ocurre.",
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('amapola_chat_history', JSON.stringify(messages));
  }, [messages]);

  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of the chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

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
  };

  const SUGGESTIONS = [
    { text: "¿Qué hacer si se quema con agua caliente?", label: "Quemaduras" },
    { text: "Mi bebé se está atragantando, ayuda", label: "Atragantamiento" },
    { text: "Se golpeó la cabeza muy fuerte", label: "Golpe en la Cabeza" },
    { text: "¿Qué hago ante una convulsión por fiebre?", label: "Fiebre / Convulsión" },
  ];

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    logAnalyticsEvent("send_chat_message", { length: text.length });

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo obtener respuesta del asistente virtual.");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
          sources: data.sources || [],
        },
      ]);
    } catch (err: any) {
      console.error("Chat error:", err);
      setError(err?.message || "Ocurrió un error de conexión con Amapola Alerta.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="first-aid-chat-container"
      className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col h-[550px] text-left"
    >
      {/* Chat Header */}
      <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            {/* Round framed Amapola Mascot with a pulsating green online dot */}
            <div className="w-10 h-10 bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner p-0.5">
              <AmapolaMascot className="w-9 h-9" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-slate-900 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-sm font-black tracking-tight text-white">Amapola Alerta</h4>
              <span className="text-[9px] bg-rose-500/20 text-rose-300 font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                Copiloto RAG
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Asistente Virtual de Primeros Auxilios</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
          <span className="text-[10px] font-bold text-rose-300 tracking-tight">Gemini 3.5 Grounded</span>
        </div>
      </div>

      {/* Chat Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((message, idx) => {
          const isAssistant = message.role === "assistant";
          return (
            <div
              key={idx}
              className={`flex gap-3 max-w-[85%] ${
                isAssistant ? "mr-auto text-left" : "ml-auto flex-row-reverse text-right"
              }`}
            >
              {isAssistant ? (
                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                  <AmapolaMascot className="w-6.5 h-6.5" />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-lg bg-rose-600 text-white shrink-0 flex items-center justify-center text-xs font-bold shadow-sm">
                  <User className="w-4 h-4" />
                </div>
              )}

              <div className="space-y-2">
                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed font-medium ${
                    isAssistant
                      ? "bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm"
                      : "bg-rose-600 text-white rounded-tr-sm shadow-sm"
                  }`}
                >
                  <div className={`markdown-body ${isAssistant ? "text-slate-800" : "text-white prose-invert"}`}>
                    <Markdown>{message.content}</Markdown>
                  </div>
                </div>

                {/* Grounding Sources */}
                {isAssistant && message.sources && message.sources.length > 0 && (
                  <div className="pl-1 space-y-1">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      Fuentes de consulta confiables:
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {message.sources.map((source, sIdx) => (
                        <a
                          key={sIdx}
                          href={source.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-600 font-bold transition-all shadow-sm"
                        >
                          <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                          <span>{source.title.length > 25 ? `${source.title.substring(0, 25)}...` : source.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 max-w-[80%] mr-auto text-left">
            <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-sm animate-pulse">
              <AmapolaMascot className="w-6.5 h-6.5" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-4 shadow-sm flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-800 flex items-start gap-2 max-w-[90%] mr-auto">
            <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
            <div>
              <p className="leading-normal font-semibold">
                {error}
              </p>
              <button
                onClick={() => handleSend(messages[messages.length - 1].content)}
                className="block text-rose-700 hover:underline mt-1 font-bold flex items-center gap-1 cursor-pointer"
              >
                Reintentar consulta <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips when thread is short/just started */}
      {messages.length === 1 && (
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 mb-1.5">
            <HelpCircle className="w-3 h-3" /> Preguntas frecuentes de ejemplo:
          </span>
          <div className="flex flex-wrap gap-1.5 pb-1">
            {SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(s.text)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl text-[10px] text-slate-600 font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="p-3 bg-white border-t border-slate-200 flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isListening ? "Escuchando..." : "Escribe tu consulta o usa el micrófono..."}
          className={`flex-1 px-3.5 py-2.5 bg-slate-50 border ${isListening ? 'border-rose-500 ring-2 ring-rose-200' : 'border-slate-200 focus:border-slate-900'} rounded-xl text-xs font-semibold focus:outline-none transition-all placeholder:text-slate-400`}
        />
        <button
          type="button"
          onClick={toggleListen}
          className={`p-2.5 rounded-xl transition-all flex items-center justify-center shrink-0 cursor-pointer ${isListening ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
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
        </button>
      </form>
    </div>
  );
}
