import React, { useState, useRef, useEffect } from 'react';
import { 
  Activity, Send, Sparkles, AlertCircle, CheckCircle2, Info, 
  Volume2, ShieldAlert, FileText, Square, Baby, RefreshCw,
  Mic, MicOff, Camera, X, Image as ImageIcon, Radio, HelpCircle, User
} from 'lucide-react';
import { ChatMessage, SymptomAssessment, ChildProfile } from '../types';

interface SymptomCheckerProps {
  freeAssessmentsLeft: number;
  decrementFreeAssessments: () => void;
  activeProfile: ChildProfile | null;
  profiles: ChildProfile[];
  onSelectProfile: (profile: ChildProfile | null) => void;
  onNavigateToPremium: () => void;
  onSaveAssessment: (assessment: SymptomAssessment) => void;
}

export default function SymptomChecker({
  freeAssessmentsLeft,
  decrementFreeAssessments,
  activeProfile,
  profiles,
  onSelectProfile,
  onNavigateToPremium,
  onSaveAssessment
}: SymptomCheckerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [latestAssessment, setLatestAssessment] = useState<SymptomAssessment | null>(null);
  
  // Right Column Tab Switch: "assessment" or "live_voice"
  const [rightTab, setRightTab] = useState<'assessment' | 'live_voice'>('assessment');

  // Audio state (Text To Speech)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const browserSynthRef = useRef<SpeechSynthesis | null>(typeof window !== 'undefined' ? window.speechSynthesis : null);

  // Audio Recording (Speech to Text)
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<any>(null);

  // Web Speech API - Speech Recognition state
  const recognitionRef = useRef<any>(null);
  const [isUsingWebSpeech, setIsUsingWebSpeech] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);

  // Image Upload state
  const [selectedImage, setSelectedImage] = useState<{ data: string, mimeType: string } | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Thinking Mode toggle state
  const [thinkingMode, setThinkingMode] = useState(false);

  // Live Voice API states
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [liveStatus, setLiveStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking'>('idle');
  const liveWsRef = useRef<WebSocket | null>(null);
  const liveAudioContextRef = useRef<AudioContext | null>(null);
  const liveWorkletNodeRef = useRef<any>(null);
  const liveAudioSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quick Log State
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [quickLogState, setQuickLogState] = useState({
    activity: 'active',
    hydration: 'good',
    skin: 'normal',
    breathing: 'normal',
    fever: 'none'
  });

  const generateQuickLogText = (): string => {
    const activityLabels: Record<string, string> = {
      active: '🟢 Activo y juguetón (comportamiento normal)',
      sleepy: '🟡 Decaído / Duerme más de lo usual (apático)',
      lethargic: '🔴 Letárgico / Muy débil / Difícil de despertar (Señal de Alarma)'
    };

    const hydrationLabels: Record<string, string> = {
      good: '🟢 Hidratado (toma bien líquidos, saliva normal, pañales mojados)',
      medium: '🟡 Toma menos líquidos, boca algo seca o menos lágrimas/orina',
      bad: '🔴 Deshidratado (rechaza líquidos, boca muy seca, >8h sin orinar)'
    };

    const skinLabels: Record<string, string> = {
      normal: '🟢 Color de piel normal/rosado',
      pale: '🟡 Pálido o muy ruborizado/caliente',
      cyanotic: '🔴 Azulado, morado o con pequeñas manchas rojas/moradas (Señal de Alarma)'
    };

    const breathingLabels: Record<string, string> = {
      normal: '🟢 Respiración normal (tranquila, sin esfuerzo ni ruidos)',
      cough: '🟡 Con tos, congestión nasal o sibilancia leve',
      struggling: '🔴 Dificultad para respirar / Respiración muy rápida o hundimiento de costillas (Señal de Alarma)'
    };

    const feverLabels: Record<string, string> = {
      none: '🟢 Sin fiebre detectable (<37.8 °C)',
      mild: '🟡 Fiebre leve o febrícula (37.8 °C - 38.9 °C)',
      high: '🔴 Fiebre alta (igual o mayor a 39.0 °C)'
    };

    const name = activeProfile ? activeProfile.name : 'el pequeño';

    return `He registrado los siguientes indicadores para ${name} usando la herramienta de Registro Rápido:
- Nivel de Actividad: ${activityLabels[quickLogState.activity]}
- Hidratación y Alimentación: ${hydrationLabels[quickLogState.hydration]}
- Color de Piel: ${skinLabels[quickLogState.skin]}
- Respiración: ${breathingLabels[quickLogState.breathing]}
- Temperatura (Fiebre): ${feverLabels[quickLogState.fever]}

Por favor, evalúa de forma inmediata la condición con base en las directrices de primeros auxilios AAP/AHA 2026.`;
  };

  const handleQuickLogLoad = () => {
    setInputText(generateQuickLogText());
    setShowQuickLog(false);
  };

  const handleQuickLogSubmit = () => {
    const text = generateQuickLogText();
    setShowQuickLog(false);
    handleSendMessage(text);
  };

  // Initialize helper welcoming messages
  useEffect(() => {
    if (messages.length === 0) {
      const childGreeting = activeProfile 
        ? `Hola. He seleccionado el perfil de **${activeProfile.name}** (${calculateAgeText(activeProfile.birthDate)}).`
        : 'Hola. He iniciado una sesión anónima.';
        
      setMessages([
        {
          role: 'model',
          text: `${childGreeting} Por favor, cuéntame en detalle qué síntomas tiene el pequeño y hace cuánto tiempo comenzaron (ej. fiebre superior a 38 grados, tos áspera, llanto recurrente, rechazo de comida). Estoy listo para ayudarte con base en las directrices de primeros auxilios de la AAP/AHA 2026.`
        }
      ]);
    }
  }, [activeProfile]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudioPlayback();
      stopLiveVoiceSession();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  // Helper age calculator
  function calculateAgeText(birthDateStr: string): string {
    try {
      const birth = new Date(birthDateStr);
      const now = new Date();
      let years = now.getFullYear() - birth.getFullYear();
      let months = now.getMonth() - birth.getMonth();
      if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
        years--;
        months += 12;
      }
      return years === 0 ? `${months} meses` : `${years} años y ${months} meses`;
    } catch {
      return "0 años";
    }
  }

  // Common symptoms quick helper triggers
  const quickSymptomOptions = [
    { label: "🌡️ Fiebre alta", text: "Tiene temperatura de 38.5°C, escalofríos y está algo decaído" },
    { label: "🤕 Golpe cabeza", text: "Se cayó jugando y se golpeó la frente. Le salió un chichón y lloró de inmediato" },
    { label: "🤮 Vómito y diarrea", text: "Lleva 3 de diarrea, no tolera líquidos y tiene la boca un poco seca" },
    { label: "🥜 Alergia o Ronchas", text: "Le salieron ronchas rojas en todo el cuerpo que le pican mucho tras comer maní" }
  ];

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() && !selectedImage) return;

    // Check freemium limit
    if (freeAssessmentsLeft <= 0) {
      onNavigateToPremium();
      return;
    }

    const userText = textToSend || "Consulta visual con fotografía adjunta.";
    const newUserMessage: ChatMessage = { role: 'user', text: userText };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setInputText('');
    setIsLoading(true);
    setLatestAssessment(null);
    stopAudioPlayback();

    const requestBody = {
      messages: updatedMessages,
      childProfile: activeProfile,
      image: selectedImage,
      thinkingMode: thinkingMode
    };

    // Clean up photo preview after preparing request
    setSelectedImage(null);
    setImagePreview(null);

    try {
      const response = await fetch('/api/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Add Gemini model text response
      setMessages(prev => [...prev, {
        role: 'model',
        text: data.conversationalResponse || "He completado la evaluación médica."
      }]);

      // Formulate detailed structured assessment card
      const assessmentResult: SymptomAssessment = {
        id: Math.random().toString(36).substring(7),
        childId: activeProfile?.id,
        childName: activeProfile?.name || 'Invitado',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        symptoms: userText,
        severity: data.severity as 'leve' | 'moderada' | 'severa',
        summary: data.summary,
        reassurance: data.reassurance,
        steps: data.steps || [],
        redFlags: data.redFlags || [],
        naturalRemedies: data.naturalRemedies || [],
        remediesWarning: data.remediesWarning || '',
        references: data.references || 'AHA/AAP Guidelines 2026',
        messages: [...updatedMessages, { role: 'model', text: data.conversationalResponse }]
      };

      setLatestAssessment(assessmentResult);
      onSaveAssessment(assessmentResult);
      decrementFreeAssessments();
      setRightTab('assessment'); // Ensure the user sees the report

    } catch (error) {
      console.error("Error evaluating symptoms:", error);
      setMessages(prev => [...prev, {
        role: 'model',
        text: "Lo siento, ha ocurrido un error al intentar conectarme con mi servidor médico. Por favor intenta de nuevo en unos momentos o consulta a un profesional."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Synthesis Voice Playback (Premium Voice / Client fallback)
  const handlePlayVoiceReport = async (text: string) => {
    if (isPlayingAudio) {
      stopAudioPlayback();
      return;
    }

    setTtsLoading(true);

    try {
      const response = await fetch('/api/generate-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      const data = await response.json();

      if (data.audio) {
        const audioBuffer = base64ToArrayBuffer(data.audio);
        await playRawAudioBuffer(audioBuffer);
      } else {
        speakWithBrowserSpeech(text);
      }
    } catch (err) {
      console.warn("API voice generation failed. Falling back to native browser speech.", err);
      speakWithBrowserSpeech(text);
    } finally {
      setTtsLoading(false);
    }
  };

  const speakWithBrowserSpeech = (text: string) => {
    if (!browserSynthRef.current) return;
    browserSynthRef.current.cancel();
    
    setIsPlayingAudio(true);
    const cleanText = text.replace(/[*#]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-ES';
    utterance.rate = 0.95;
    
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    browserSynthRef.current.speak(utterance);
  };

  const base64ToArrayBuffer = (base64: string) => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  const playRawAudioBuffer = async (buffer: ArrayBuffer) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const decodedBuffer = await ctx.decodeAudioData(buffer);
      
      const source = ctx.createBufferSource();
      source.buffer = decodedBuffer;
      source.connect(ctx.destination);
      
      source.onended = () => {
        setIsPlayingAudio(false);
      };

      source.start(0);
      audioSourceRef.current = source;
      setIsPlayingAudio(true);
    } catch (err) {
      console.error("Failed to play custom audio stream:", err);
      setIsPlayingAudio(false);
    }
  };

  const stopAudioPlayback = () => {
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch {}
      audioSourceRef.current = null;
    }
    if (browserSynthRef.current) {
      browserSynthRef.current.cancel();
    }
    setIsPlayingAudio(false);
  };

  // Speech to Text Recording Handlers
  const startRecording = async () => {
    stopAudioPlayback();
    setRecognitionError(null);

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'es-ES';

        recognitionRef.current = recognition;
        setIsUsingWebSpeech(true);
        setIsRecording(true);
        setRecordingDuration(0);

        let finalTranscript = '';

        recognition.onstart = () => {
          console.log("Web Speech API recognition started");
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
          const currentText = finalTranscript || interimTranscript;
          setInputText(currentText);
        };

        recognition.onerror = (event: any) => {
          console.error("Web Speech API error:", event.error);
          setRecognitionError(event.error);
          if (event.error !== 'aborted') {
            stopRecording();
            startMediaRecorderRecording();
          }
        };

        recognition.onend = () => {
          console.log("Web Speech API recognition ended");
          setIsRecording(false);
          setIsUsingWebSpeech(false);
          if (recordingIntervalRef.current) {
            clearInterval(recordingIntervalRef.current);
          }
        };

        recognition.start();

        recordingIntervalRef.current = setInterval(() => {
          setRecordingDuration(prev => prev + 1);
        }, 1000);

      } catch (err) {
        console.error("Failed to initialize Web Speech recognition, falling back:", err);
        startMediaRecorderRecording();
      }
    } else {
      console.warn("Web Speech API not supported in this browser. Falling back to MediaRecorder.");
      startMediaRecorderRecording();
    }
  };

  const startMediaRecorderRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64data = reader.result as string;
          const base64Payload = base64data.split(',')[1];
          
          setIsLoading(true);
          try {
            const res = await fetch('/api/transcribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                audio: {
                  data: base64Payload,
                  mimeType: 'audio/webm'
                }
              })
            });
            const data = await res.json();
            if (data.text) {
              setInputText(data.text);
            }
          } catch (err) {
            console.error("Microphone transcription failed:", err);
          } finally {
            setIsLoading(false);
          }
        };

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Failed to access microphone:", err);
    }
  };

  const stopRecording = () => {
    if (isUsingWebSpeech && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error("Error stopping recognition:", err);
      }
      setIsRecording(false);
      setIsUsingWebSpeech(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    } else if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  // Image Upload Handlers
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImagePreview(URL.createObjectURL(file));

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      const base64Payload = base64data.split(',')[1];
      setSelectedImage({
        data: base64Payload,
        mimeType: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // --- LIVE VOICE API WEB SOCKET SESSIONS ---
  const convertFloat32To16BitPCM = (float32Array: Float32Array) => {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    let offset = 0;
    for (let i = 0; i < float32Array.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return buffer;
  };

  const startLiveVoiceSession = async () => {
    if (isLiveActive) return;
    setIsLiveActive(true);
    setLiveStatus('connecting');

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live-ws`;
      const ws = new WebSocket(wsUrl);
      liveWsRef.current = ws;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx({ sampleRate: 24000 });
      liveAudioContextRef.current = audioCtx;

      ws.onopen = async () => {
        setLiveStatus('listening');
        
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const source = audioCtx.createMediaStreamSource(stream);
          const processor = audioCtx.createScriptProcessor(4096, 1, 1);
          
          processor.onaudioprocess = (e) => {
            if (ws.readyState !== WebSocket.OPEN) return;
            
            const inputData = e.inputBuffer.getChannelData(0);
            
            // Downsample
            const inputSampleRate = audioCtx.sampleRate;
            const targetSampleRate = 16000;
            const ratio = inputSampleRate / targetSampleRate;
            const newLength = Math.round(inputData.length / ratio);
            const resampledData = new Float32Array(newLength);
            
            for (let i = 0; i < newLength; i++) {
              resampledData[i] = inputData[Math.round(i * ratio)];
            }
            
            const pcmBuffer = convertFloat32To16BitPCM(resampledData);
            const base64Audio = btoa(
              new Uint8Array(pcmBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
            );
            
            ws.send(JSON.stringify({ audio: base64Audio }));
          };
          
          source.connect(processor);
          processor.connect(audioCtx.destination);
          liveWorkletNodeRef.current = { stream, processor, source };
        } catch (micErr) {
          console.error("Live session microphone access failed:", micErr);
          stopLiveVoiceSession();
        }
      };

      ws.onmessage = async (event) => {
        try {
          const response = JSON.parse(event.data);
          
          if (response.audio) {
            setLiveStatus('speaking');
            
            const binary = atob(response.audio);
            const len = binary.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              bytes[i] = binary.charCodeAt(i);
            }

            // Play the 24kHz PCM chunk
            audioCtx.decodeAudioData(bytes.buffer.slice(0), (buffer) => {
              const bufferSource = audioCtx.createBufferSource();
              bufferSource.buffer = buffer;
              bufferSource.connect(audioCtx.destination);
              bufferSource.onended = () => {
                setLiveStatus('listening');
              };
              bufferSource.start();
              liveAudioSourcesRef.current.push(bufferSource);
            }, (decodeErr) => {
              // Ignore decoding errors of partial PCM frames
            });
          }

          if (response.interrupted) {
            // Stop current speech playback if user started talking
            liveAudioSourcesRef.current.forEach(src => {
              try { src.stop(); } catch (e) {}
            });
            liveAudioSourcesRef.current = [];
            setLiveStatus('listening');
          }

          if (response.error) {
            console.error("Live session server error:", response.error);
          }
        } catch (e) {
          console.error("Error processing WebSocket live audio frame:", e);
        }
      };

      ws.onclose = () => {
        console.log("Live voice WS closed");
        stopLiveVoiceSession();
      };

      ws.onerror = (e) => {
        console.error("WS Live Error:", e);
        stopLiveVoiceSession();
      };

    } catch (err) {
      console.error("Failed to setup Live session:", err);
      stopLiveVoiceSession();
    }
  };

  const stopLiveVoiceSession = () => {
    setIsLiveActive(false);
    setLiveStatus('idle');

    if (liveWsRef.current) {
      try { liveWsRef.current.close(); } catch (e) {}
      liveWsRef.current = null;
    }

    if (liveWorkletNodeRef.current) {
      const { stream, processor, source } = liveWorkletNodeRef.current;
      try {
        stream.getTracks().forEach((track: any) => track.stop());
        processor.disconnect();
        source.disconnect();
      } catch (e) {}
      liveWorkletNodeRef.current = null;
    }

    liveAudioSourcesRef.current.forEach(src => {
      try { src.stop(); } catch (e) {}
    });
    liveAudioSourcesRef.current = [];

    if (liveAudioContextRef.current) {
      try { liveAudioContextRef.current.close(); } catch (e) {}
      liveAudioContextRef.current = null;
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'severa':
        return {
          bg: 'bg-rose-50 border-rose-200',
          badge: 'bg-rose-600 text-white',
          text: 'text-rose-950',
          title: 'text-rose-900',
          icon: <ShieldAlert className="w-6 h-6 text-rose-600 animate-pulse" />
        };
      case 'moderada':
        return {
          bg: 'bg-amber-50 border-amber-200',
          badge: 'bg-amber-500 text-slate-900',
          text: 'text-amber-950',
          title: 'text-amber-900',
          icon: <AlertCircle className="w-6 h-6 text-amber-500" />
        };
      default:
        return {
          bg: 'bg-emerald-50 border-emerald-200',
          badge: 'bg-emerald-600 text-white',
          text: 'text-emerald-950',
          title: 'text-emerald-900',
          icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" />
        };
    }
  };

  return (
    <div id="symptom-checker" className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-5xl mx-auto">
      {/* LEFT COLUMN: Consultation Chat Interface */}
      <div className="relative lg:col-span-7 bg-white border border-slate-100 rounded-3xl shadow-sm flex flex-col h-[610px] overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
              👶
            </div>
            <div>
              <div className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                Pediatra Virtual Amapola <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div className="text-[11px] text-slate-500">
                {activeProfile ? `Evaluando a ${activeProfile.name}` : "Perfil Invitado (Anónimo)"}
              </div>
            </div>
          </div>
          {/* Switching profiles */}
          <div className="flex items-center gap-2">
            <select
              value={activeProfile?.id || ""}
              onChange={(e) => {
                const selected = profiles.find(p => p.id === e.target.value);
                onSelectProfile(selected || null);
                setMessages([]);
                setLatestAssessment(null);
                stopAudioPlayback();
              }}
              className="text-xs bg-white border border-slate-200 rounded-lg py-1 px-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Anónimo (Invitado)</option>
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Message feed */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/20">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] rounded-2xl p-3.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-emerald-600 text-white rounded-tr-none'
                  : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none shadow-sm'
              }`}>
                {msg.text.split('\n').map((para, i) => (
                  <p key={i} className={i > 0 ? 'mt-2' : ''}>{para}</p>
                ))}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-3">
                <RefreshCw className="w-4 h-4 text-emerald-500 animate-spin" />
                <span className="text-xs text-slate-500 font-medium">Amapola está consultando guías pediátricas oficiales...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Image upload preview widget */}
        {imagePreview && (
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <img src={imagePreview} className="w-12 h-12 rounded-lg object-cover border border-slate-200" alt="Preview" />
              <div className="text-xs">
                <p className="font-bold text-slate-700">Foto Adjunta para Análisis</p>
                <p className="text-[10px] text-slate-400">Se usará Gemini Pro de imagen</p>
              </div>
            </div>
            <button onClick={removeSelectedImage} className="p-1.5 bg-slate-200 hover:bg-slate-300 rounded-full text-slate-600 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Quick helpers panel */}
        {messages.length === 1 && !isLoading && !imagePreview && (
          <div className="p-3 bg-slate-50 border-t border-slate-100 space-y-1.5">
            <div className="text-[10px] font-bold text-slate-400 tracking-wide uppercase px-1">Consultas más habituales:</div>
            <div className="flex flex-wrap gap-1.5">
              {quickSymptomOptions.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(opt.text)}
                  className="text-xs bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-slate-700 py-1.5 px-2.5 rounded-lg font-medium transition-all animate-fadeIn"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input bar and action toggles */}
        <div className="border-t border-slate-100 bg-white p-3 space-y-2">
          {/* Action buttons (Thinking mode, upload image, mic STT) */}
          <div className="flex items-center justify-between text-xs px-1">
            <div className="flex items-center gap-3">
              {/* Image analysis click-to-upload */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                accept="image/*" 
                className="hidden" 
              />
              <button 
                type="button"
                onClick={triggerImageUpload}
                className="flex items-center gap-1 text-slate-500 hover:text-emerald-600 font-bold transition-colors py-1 cursor-pointer"
                title="Sube una foto de sarpullido, quemaduras, etc. para análisis visual"
              >
                <Camera className="w-4 h-4" />
                <span>Signos Visuales (Foto)</span>
              </button>

              {/* High Thinking Mode Toggle */}
              <button
                type="button"
                onClick={() => setThinkingMode(!thinkingMode)}
                className={`flex items-center gap-1 font-bold transition-all py-1 ${
                  thinkingMode 
                    ? 'text-indigo-600 scale-105' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Activa el razonamiento clínico profundo (IA de Pensamiento Alta)"
              >
                <Sparkles className="w-4 h-4" />
                <span>Pensamiento Profundo {thinkingMode ? 'ON' : 'OFF'}</span>
              </button>

              {/* Quick Log Toggle */}
              <button
                type="button"
                onClick={() => setShowQuickLog(!showQuickLog)}
                className={`flex items-center gap-1 font-bold transition-all py-1 ${
                  showQuickLog 
                    ? 'text-emerald-600 scale-105' 
                    : 'text-slate-500 hover:text-emerald-600'
                }`}
                title="Abre el cuestionario de registro rápido para momentos de estrés"
              >
                <Activity className="w-4 h-4 text-emerald-500" />
                <span>⚡ Registro Rápido (Estrés)</span>
              </button>
            </div>

            {/* Display active mode */}
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {selectedImage ? "Multimodal (Gemini Pro)" : thinkingMode ? "Razonamiento Profundo" : "Grounding Google Search"}
            </span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }}
            className="flex gap-2"
          >
            {/* Mic voice transcription button */}
            {isRecording ? (
              <button
                type="button"
                onClick={stopRecording}
                className="p-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-all shadow-sm animate-pulse flex items-center justify-center gap-1.5 shrink-0"
              >
                <MicOff className="w-4 h-4" />
                <span className="text-xs font-bold px-1">{recordingDuration}s</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                disabled={isLoading || freeAssessmentsLeft <= 0}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-600 hover:text-slate-900 rounded-xl transition-all shrink-0"
                title="Graba tu voz para transcribir síntomas automáticamente"
              >
                <Mic className="w-4 h-4" />
              </button>
            )}

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isLoading || (isRecording && !isUsingWebSpeech)}
              placeholder={
                freeAssessmentsLeft > 0
                  ? (isRecording ? (isUsingWebSpeech ? "Escuchando... Dicta tus síntomas..." : "Grabando voz...") : "Describe detalladamente los síntomas aquí...")
                  : "Has agotado tus consultas gratuitas."
              }
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:opacity-50 text-slate-800"
            />
            
            <button
              type="submit"
              disabled={isLoading || isRecording || (!inputText.trim() && !selectedImage) || freeAssessmentsLeft <= 0}
              className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl transition-all shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Quick Log Slider Panel */}
        {showQuickLog && (
          <div className="absolute inset-0 bg-white z-30 flex flex-col h-full animate-fadeIn">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600 animate-pulse" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Registro Clínico Rápido</h3>
                  <p className="text-[10px] text-slate-500">Completa indicadores clave para auto-completar los síntomas</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowQuickLog(false)}
                className="p-1.5 hover:bg-slate-200 rounded-full text-slate-500 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Questions Container */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 text-left">
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-800 leading-relaxed">
                ℹ️ <strong>Consejo bajo estrés:</strong> No necesitas escribir nada. Simplemente selecciona el estado actual de cada indicador y haz clic en <strong>Analizar de Inmediato</strong>. Nosotros redactaremos los detalles clínicos de forma rigurosa y empática.
              </div>

              {/* 1. Actividad */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 tracking-wide uppercase flex items-center gap-1">
                  <span>🎮</span> Nivel de Actividad o Alerta:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'active', label: '🟢 Activo / Juega', desc: 'Comportamiento normal, reactivo, sonríe.' },
                    { id: 'sleepy', label: '🟡 Decaído / Apático', desc: 'Duerme más de lo usual, cansado o triste.' },
                    { id: 'lethargic', label: '🔴 Letárgico', desc: 'Extremadamente débil o cuesta mucho despertarlo.' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setQuickLogState(prev => ({ ...prev, activity: opt.id }))}
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between h-24 ${
                        quickLogState.activity === opt.id
                          ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/10'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-800">{opt.label}</span>
                      <span className="text-[9px] text-slate-400 leading-tight block mt-1.5">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Hidratación */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 tracking-wide uppercase flex items-center gap-1">
                  <span>🍼</span> Hidratación y Alimentación:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'good', label: '🟢 Hidratado', desc: 'Toma líquidos bien, saliva normal, orina normal.' },
                    { id: 'medium', label: '🟡 Toma menos', desc: 'Boca algo seca, menos pañales mojados o lágrimas.' },
                    { id: 'bad', label: '🔴 Deshidratado', desc: 'Rechaza todo, saliva ausente, >8h sin orinar.' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setQuickLogState(prev => ({ ...prev, hydration: opt.id }))}
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between h-24 ${
                        quickLogState.hydration === opt.id
                          ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/10'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-800">{opt.label}</span>
                      <span className="text-[9px] text-slate-400 leading-tight block mt-1.5">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Color de piel */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 tracking-wide uppercase flex items-center gap-1">
                  <span>👶</span> Color de Piel / Extremidades:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'normal', label: '🟢 Normal', desc: 'Rosado o su tono habitual, extremidades templadas.' },
                    { id: 'pale', label: '🟡 Pálido / Rubor', desc: 'Pálido, sudoroso o muy colorado por fiebre.' },
                    { id: 'cyanotic', label: '🔴 Alterado', desc: 'Azulado, morado o con manchitas de sangre/petequias.' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setQuickLogState(prev => ({ ...prev, skin: opt.id }))}
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between h-24 ${
                        quickLogState.skin === opt.id
                          ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/10'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-800">{opt.label}</span>
                      <span className="text-[9px] text-slate-400 leading-tight block mt-1.5">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Respiración */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 tracking-wide uppercase flex items-center gap-1">
                  <span>🫁</span> Respiración y Tos:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'normal', label: '🟢 Normal', desc: 'Tranquila, sin silbidos ni esfuerzo visible.' },
                    { id: 'cough', label: '🟡 Tos / Congestión', desc: 'Mocos, tos leve, ronquera leve.' },
                    { id: 'struggling', label: '🔴 Dificultad', desc: 'Respira muy rápido, silbido fuerte o hunde costillas.' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setQuickLogState(prev => ({ ...prev, breathing: opt.id }))}
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between h-24 ${
                        quickLogState.breathing === opt.id
                          ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/10'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-800">{opt.label}</span>
                      <span className="text-[9px] text-slate-400 leading-tight block mt-1.5">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Fiebre */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 tracking-wide uppercase flex items-center gap-1">
                  <span>🌡️</span> Temperatura (Fiebre):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'none', label: '🟢 Sin Fiebre', desc: 'Temperatura corporal normal (<37.8 °C)' },
                    { id: 'mild', label: '🟡 Febrícula/Fiebre', desc: 'Fiebre de rango leve/moderado (37.8°C - 38.9°C)' },
                    { id: 'high', label: '🔴 Fiebre Alta', desc: 'Fiebre alta o persistente (≥39.0 °C)' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setQuickLogState(prev => ({ ...prev, fever: opt.id }))}
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between h-24 ${
                        quickLogState.fever === opt.id
                          ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/10'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-800">{opt.label}</span>
                      <span className="text-[9px] text-slate-400 leading-tight block mt-1.5">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3 shrink-0">
              <button
                type="button"
                onClick={handleQuickLogLoad}
                className="flex-1 py-3 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-all text-xs"
              >
                📝 Cargar en el Chat
              </button>
              <button
                type="button"
                onClick={handleQuickLogSubmit}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all text-xs shadow-md shadow-emerald-600/10 flex items-center justify-center gap-1.5"
              >
                🚀 Analizar de Inmediato
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Cohesive Analysis Outcome Panel & Live Voice assistant */}
      <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
        
        {/* Toggle between static Assessment Report and Live Voice Consultation */}
        <div className="bg-slate-100 p-1 rounded-xl flex gap-1 text-xs font-bold">
          <button
            onClick={() => setRightTab('assessment')}
            className={`flex-1 py-2 rounded-lg text-center transition-all ${
              rightTab === 'assessment' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📋 Reporte Clínico
          </button>
          <button
            onClick={() => setRightTab('live_voice')}
            className={`flex-1 py-2 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 ${
              rightTab === 'live_voice' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isLiveActive ? 'text-emerald-500 animate-pulse' : ''}`} />
            Consulta de Voz (Live)
          </button>
        </div>

        {rightTab === 'assessment' ? (
          latestAssessment ? (
            (() => {
              const styles = getSeverityStyles(latestAssessment.severity);
              return (
                <div className={`border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 transition-all bg-white flex-1`}>
                  {/* Header Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {styles.icon}
                      <h3 className={`font-black uppercase tracking-tight text-xs ${styles.title}`}>Análisis de Emergencia</h3>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide ${styles.badge}`}>
                      {latestAssessment.severity}
                    </span>
                  </div>

                  {/* Reassurance Message */}
                  <p className="text-xs italic leading-relaxed text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    "{latestAssessment.reassurance}"
                  </p>

                  {/* Step by step action guidance */}
                  {latestAssessment.steps.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wide">ACCIONES DE PRIMEROS AUXILIOS:</div>
                      <ol className="space-y-1 text-xs text-slate-700 list-decimal list-inside leading-relaxed">
                        {latestAssessment.steps.map((step, i) => (
                          <li key={i} className="pl-1 text-[11px] font-medium">{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Alarm Signs (Critical Red Flags) */}
                  {latestAssessment.redFlags.length > 0 && (
                    <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 space-y-1">
                      <div className="font-extrabold text-[10px] text-rose-800 flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 shrink-0" /> SEÑALES DE ALARMA CRÍTICAS:
                      </div>
                      <ul className="space-y-0.5 text-[10.5px] text-rose-900 list-disc list-inside font-semibold leading-relaxed">
                        {latestAssessment.redFlags.map((flag, i) => (
                          <li key={i}>{flag}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Traditional & Natural Safe Remedies */}
                  {latestAssessment.naturalRemedies.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wide">REMEDIOS NATURALES PERMITIDOS:</div>
                      <ul className="space-y-1 text-xs text-slate-700 list-disc list-inside leading-relaxed">
                        {latestAssessment.naturalRemedies.map((rem, i) => (
                          <li key={i} className="text-[11px] font-medium">{rem}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Remedies warnings */}
                  {latestAssessment.remediesWarning && (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-[10px] text-slate-500 leading-relaxed">
                      <strong>Nota Médica:</strong> {latestAssessment.remediesWarning}
                    </div>
                  )}

                  {/* Voice play triggers */}
                  <div className="pt-2 space-y-2">
                    <button
                      onClick={() => handlePlayVoiceReport(
                        `Indicaciones para gravedad ${latestAssessment.severity === 'severa' ? 'severa' : latestAssessment.severity === 'moderada' ? 'moderada' : 'leve'}. ` +
                        `Resumen de primeros auxilios: ` +
                        latestAssessment.steps.join(". ") +
                        `. Alertas importantes: ` +
                        latestAssessment.redFlags.join(". ")
                      )}
                      disabled={ttsLoading}
                      className="w-full px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-white font-bold rounded-xl transition-all text-xs inline-flex items-center justify-center gap-2 shadow-sm"
                    >
                      {ttsLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Generando Voz Premium...
                        </>
                      ) : isPlayingAudio ? (
                        <>
                          <Square className="w-3.5 h-3.5 text-rose-500 fill-current" /> Detener Audio
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-4 h-4 text-emerald-400" /> Escuchar Reporte (Voz Premium)
                        </>
                      )}
                    </button>
                  </div>

                  {/* Reference tag */}
                  <div className="text-[9px] text-slate-400 text-right font-medium">
                    Fuente: {latestAssessment.references}
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="bg-white border border-slate-100 rounded-3xl p-6 text-center text-slate-500 h-[440px] flex flex-col items-center justify-center space-y-4 flex-1 shadow-sm">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full">
                <Activity className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm">Ficha de Diagnóstico Primario</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  Describe los síntomas en el chat, haz una consulta por voz o sube una fotografía. El reporte clínico se mostrará en este panel detallando pasos de primeros auxilios.
                </p>
              </div>
            </div>
          )
        ) : (
          /* LIVE VOICE CONSULTATION INTERFACE WITH REAL TIME GEMINI LIVE API */
          <div className="bg-gradient-to-b from-indigo-950 to-slate-950 text-white rounded-3xl p-6 h-[440px] flex flex-col justify-between shadow-md relative overflow-hidden flex-1 border border-indigo-900">
            <div className="absolute top-0 right-0 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            
            {/* Header info */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" /> Live Voice API
                </span>
                <span className="text-[10px] text-indigo-300 font-bold">Respuesta Bidireccional</span>
              </div>
              <h3 className="font-extrabold text-white text-sm tracking-tight pt-1">Asistente Manos Libres</h3>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Ideal para emergencias donde necesitas instrucciones habladas en tiempo real mientras atiendes al niño.
              </p>
            </div>

            {/* Animation Visualizer Sphere */}
            <div className="flex items-center justify-center py-4">
              {isLiveActive ? (
                <div className="relative flex items-center justify-center">
                  {/* Pulser circles */}
                  <div className={`absolute w-32 h-32 bg-emerald-500/10 rounded-full animate-ping ${liveStatus === 'speaking' ? 'duration-1000' : 'duration-1500'}`} />
                  <div className={`absolute w-24 h-24 bg-indigo-500/20 rounded-full animate-pulse`} />
                  
                  {/* Core sphere changing color based on speaking/listening */}
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                    liveStatus === 'speaking' 
                      ? 'bg-emerald-500 text-slate-950' 
                      : liveStatus === 'listening' 
                      ? 'bg-indigo-600 text-white animate-bounce' 
                      : 'bg-indigo-900 text-slate-300'
                  }`}>
                    {liveStatus === 'speaking' ? <Volume2 className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
                  </div>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center shadow-inner">
                  <Mic className="w-6 h-6" />
                </div>
              )}
            </div>

            {/* Session stats & logs */}
            <div className="text-center space-y-1 px-4">
              <p className="text-xs font-black">
                {liveStatus === 'idle' && "Canal de Voz Desactivado"}
                {liveStatus === 'connecting' && "Conectando con Servidor de Voz..."}
                {liveStatus === 'listening' && "Escuchando... ¡Habla ahora!"}
                {liveStatus === 'speaking' && "Amapola hablando..."}
              </p>
              <p className="text-[10px] text-slate-400">
                {liveStatus === 'idle' && "Haz clic abajo para iniciar la consulta hablada directa."}
                {liveStatus === 'connecting' && "Estableciendo websocket cifrado..."}
                {liveStatus === 'listening' && "Habla de forma natural. Te responderá de inmediato."}
                {liveStatus === 'speaking' && "Reproduciendo pautas de primeros auxilios en vivo."}
              </p>
            </div>

            {/* Action triggering */}
            <div className="pt-2">
              {isLiveActive ? (
                <button
                  onClick={stopLiveVoiceSession}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl transition-all text-xs tracking-wider uppercase shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Square className="w-4 h-4 fill-current" /> Detener Canal de Voz
                </button>
              ) : (
                <button
                  onClick={startLiveVoiceSession}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold rounded-xl transition-all text-xs tracking-wider uppercase shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Radio className="w-4 h-4" /> Activar Consulta por Voz en Vivo
                </button>
              )}
            </div>
          </div>
        )}

        {/* Trial consultations tracker */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs font-bold text-slate-800">Evaluaciones Gratuitas</div>
            <p className="text-[10px] text-slate-500">Prueba de orientación inmediata de IA</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-lg font-black text-emerald-600">{freeAssessmentsLeft}</span>
              <span className="text-xs text-slate-400"> / 3</span>
            </div>
            {freeAssessmentsLeft <= 0 && (
              <button
                onClick={onNavigateToPremium}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-lg text-[10px] uppercase shadow-sm transition-all"
              >
                Suscribirse
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
